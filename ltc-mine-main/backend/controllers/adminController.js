const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { sendLtcBatchEmail, sendSquadNotificationEmail } = require('../config/mailer');
const { seedImmersionSchedulesForBatch } = require('../config/initDb');
const { withLtcId, writeAudit } = require('../utils/helpers');
const { SQUAD_NAMES } = require('../utils/constants');

const processUploadJobInBackground = async (jobId, records, batchId = null, isBatchSpecific = false, adminUserId = null, adminUserName = 'Admin', duplicateAction = 'replace') => {
  let processed = 0;
  let success = 0;
  let failed = 0;
  let errorsList = [];

  try {
    const uniqueRecords = [];
    const seenPrns = new Set();
    const seenEmails = new Set();
    const seenFacultyIds = new Set();
    
    for (const r of records) {
      if (!r || typeof r !== 'object') continue;
      
      const normalized = {};
      for (const key in r) {
        const cleanKey = key.replace(/^\uFEFF/, '').toLowerCase().trim();
        normalized[cleanKey] = r[key];
      }
      
      const prn = String(normalized.prn || normalized['student id'] || normalized.student_id || '').trim();
      const email = String(normalized.email || '').trim().toLowerCase();
      const facultyId = String(normalized.faculty_id || normalized['faculty id'] || '').trim();
      const role = String(normalized.role || '').toLowerCase().trim();
      
      const isFaculty = role === 'faculty' || (!prn && facultyId);
      const isStudent = role === 'student' || prn || (!facultyId && email);
      
      normalized._isFaculty = isFaculty;
      normalized._isStudent = isStudent;
      normalized._prn = prn || null;
      normalized._email = email || null;
      normalized._facultyId = facultyId || null;
      normalized._role = isFaculty ? 'faculty' : (role === 'ltc_member' ? 'ltc_member' : 'student');
      
      if (!normalized._email && !normalized._prn && !normalized._facultyId) {
        failed++;
        errorsList.push({ row: 'Unknown', error: 'Missing email, PRN, and Faculty ID. Row skipped.' });
        continue;
      }

      if (isFaculty) {
        if (normalized._facultyId && seenFacultyIds.has(normalized._facultyId)) continue;
        if (normalized._email && seenEmails.has(normalized._email)) continue;
        if (normalized._facultyId) seenFacultyIds.add(normalized._facultyId);
        if (normalized._email) seenEmails.add(normalized._email);
      } else {
        if (normalized._prn && seenPrns.has(normalized._prn)) continue;
        if (normalized._email && seenEmails.has(normalized._email)) continue;
        if (normalized._prn) seenPrns.add(normalized._prn);
        if (normalized._email) seenEmails.add(normalized._email);
      }
      
      uniqueRecords.push(normalized);
    }

    const totalRecords = uniqueRecords.length + failed;
    await pool.query(
      "UPDATE upload_jobs SET total_records = $1, status = 'processing', updated_at = NOW() WHERE id = $2",
      [totalRecords, jobId]
    );

    const defaultStudentHash = await bcrypt.hash('student123', 10);
    const defaultFacultyHash = await bcrypt.hash('password123', 10);
    const defaultMemberHash = await bcrypt.hash('ltc123', 10);

    const CHUNK_SIZE = 1000;
    for (let i = 0; i < uniqueRecords.length; i += CHUNK_SIZE) {
      const chunk = uniqueRecords.slice(i, i + CHUNK_SIZE);
      
      try {
        const chunkEmails = chunk.map(r => r._email).filter(Boolean);
        const chunkPrns = chunk.map(r => r._prn).filter(Boolean);
        const chunkFacultyIds = chunk.map(r => r._facultyId).filter(Boolean);

        let existingUsers = [];
        if (chunkEmails.length > 0 || chunkPrns.length > 0 || chunkFacultyIds.length > 0) {
          const res = await pool.query(
            `SELECT id, email, prn, faculty_id FROM users
             WHERE email = ANY($1) OR prn = ANY($2) OR faculty_id = ANY($3)`,
            [chunkEmails, chunkPrns, chunkFacultyIds]
          );
          existingUsers = res.rows;
        }

        const existingByEmail = new Map();
        const existingByPrn = new Map();
        const existingByFacultyId = new Map();

        for (const u of existingUsers) {
          if (u.email) existingByEmail.set(u.email.toLowerCase(), u);
          if (u.prn) existingByPrn.set(u.prn, u);
          if (u.faculty_id) existingByFacultyId.set(u.faculty_id, u);
        }

        const toInsert = [];
        const toUpdate = [];
        const skippedDuplicates = [];

        for (const r of chunk) {
          let matchedUser = null;
          if (r._email && existingByEmail.has(r._email)) matchedUser = existingByEmail.get(r._email);
          else if (r._prn && existingByPrn.has(r._prn)) matchedUser = existingByPrn.get(r._prn);
          else if (r._facultyId && existingByFacultyId.has(r._facultyId)) matchedUser = existingByFacultyId.get(r._facultyId);

          const name = r.name || r.full_name || r.student_name;
          if (!name) {
            failed++;
            errorsList.push({ row: r._email || r._prn || r._facultyId || 'Row', error: 'Missing name column.' });
            continue;
          }

          if (matchedUser) {
            if (duplicateAction === 'skip') {
              skippedDuplicates.push({ id: matchedUser.id, record: r });
            } else {
              toUpdate.push({ id: matchedUser.id, record: r });
            }
          } else {
            toInsert.push(r);
          }
        }

        let insertedRows = [];
        if (toInsert.length > 0) {
          const insertParams = [];
          const insertValueRows = [];
          let paramIdx = 1;

          for (const r of toInsert) {
            const passHash = r._role === 'faculty' ? defaultFacultyHash : (r._role === 'ltc_member' ? defaultMemberHash : defaultStudentHash);
            const values = [
              r.name || r.full_name || r.student_name,
              r._email || `temp_${Date.now()}_${Math.floor(Math.random() * 100000)}@ltc.edu`,
              passHash,
              r._role,
              r.department || null,
              r.semester || r.year || null,
              r.division || null,
              r.school || null,
              (r.panel || '').trim().toUpperCase() || null,
              r.is_primary === 'true' || r.is_primary === true || r.role === 'primary',
              r._prn,
              r._facultyId,
              r.phone || null,
              r.dob || null,
              r.gender || null,
              r.program || null,
              r.year || r.semester || null,
              r.designation || null,
              r.status || 'active',
              r.nri === true || r.nri === 1 || String(r.nri).toLowerCase().trim() === 'yes' || String(r.nri).toLowerCase().trim() === 'true',
            ];

            const placeholders = [];
            for (let j = 0; j < values.length; j++) {
              placeholders.push(`$${paramIdx++}`);
            }
            insertValueRows.push(`(${placeholders.join(', ')})`);
            insertParams.push(...values);
          }

          const insertRes = await pool.query(
            `INSERT INTO users (name, email, password, role, department, semester, division, school, panel, is_primary, prn, faculty_id, phone, dob, gender, program, year, designation, status, nri)
             VALUES ${insertValueRows.join(', ')}
             RETURNING id, email, prn, faculty_id, role, name`,
            insertParams
          );
          insertedRows = insertRes.rows;
          success += insertedRows.length;
        }

        if (toUpdate.length > 0) {
          const updateParams = [];
          const updateValueRows = [];
          let paramIdx = 1;

          for (const item of toUpdate) {
            const r = item.record;
            const values = [
              item.id,
              r.name || r.full_name || r.student_name,
              r.department || null,
              r.semester || r.year || null,
              r.division || null,
              r.school || null,
              (r.panel || '').trim().toUpperCase() || null,
              r.phone || null,
              r.dob || null,
              r.gender || null,
              r.program || null,
              r.year || r.semester || null,
              r.designation || null,
              r.status || 'active',
              r.nri === true || r.nri === 1 || String(r.nri).toLowerCase().trim() === 'yes' || String(r.nri).toLowerCase().trim() === 'true',
            ];

            const placeholders = [
              `$${paramIdx++}::int`,
              `$${paramIdx++}::varchar`,
              `$${paramIdx++}::varchar`,
              `$${paramIdx++}::varchar`,
              `$${paramIdx++}::varchar`,
              `$${paramIdx++}::varchar`,
              `$${paramIdx++}::varchar`,
              `$${paramIdx++}::varchar`,
              `$${paramIdx++}::varchar`,
              `$${paramIdx++}::varchar`,
              `$${paramIdx++}::varchar`,
              `$${paramIdx++}::varchar`,
              `$${paramIdx++}::varchar`,
              `$${paramIdx++}::varchar`,
              `$${paramIdx++}::boolean`,
            ];

            updateValueRows.push(`(${placeholders.join(', ')})`);
            updateParams.push(...values);
          }

          await pool.query(
            `UPDATE users AS u SET
              name = v.name,
              department = COALESCE(v.department, u.department),
              semester = COALESCE(v.semester, u.semester),
              division = COALESCE(v.division, u.division),
              school = COALESCE(v.school, u.school),
              panel = COALESCE(v.panel, u.panel),
              phone = COALESCE(v.phone, u.phone),
              dob = COALESCE(v.dob, u.dob),
              gender = COALESCE(v.gender, u.gender),
              program = COALESCE(v.program, u.program),
              year = COALESCE(v.year, u.year),
              designation = COALESCE(v.designation, u.designation),
              status = COALESCE(v.status, u.status),
              nri = COALESCE(v.nri, u.nri)
            FROM (VALUES ${updateValueRows.join(', ')}) AS v(id, name, department, semester, division, school, panel, phone, dob, gender, program, year, designation, status, nri)
            WHERE u.id = v.id`,
            updateParams
          );
          success += toUpdate.length;
        }

        if (skippedDuplicates.length > 0) {
          success += skippedDuplicates.length;
        }

        if (isBatchSpecific && batchId) {
          const allProcessedUsers = [
            ...insertedRows.map(u => ({ id: u.id, role: u.role, email: u.email, prn: u.prn, faculty_id: u.faculty_id, name: u.name })),
            ...toUpdate.map(item => {
              const r = item.record;
              return { id: item.id, role: r._role, email: r._email, prn: r._prn, faculty_id: r._facultyId, name: r.name || r.full_name || r.student_name };
            }),
            ...skippedDuplicates.map(item => {
              const r = item.record;
              return { id: item.id, role: r._role, email: r._email, prn: r._prn, faculty_id: r._facultyId, name: r.name || r.full_name || r.student_name };
            })
          ];

          const studentsAlloc = allProcessedUsers.filter(u => u.role === 'student');
          const facultyAlloc = allProcessedUsers.filter(u => u.role === 'faculty');

          if (studentsAlloc.length > 0) {
            const studentIds = studentsAlloc.map(s => s.id);
            
            const checkAllocRes = await pool.query(
              `SELECT bs.student_id, b.name AS batch_name
               FROM batch_students bs
               JOIN batches b ON bs.batch_id = b.id
               WHERE bs.student_id = ANY($1) AND bs.batch_id <> $2 AND b.status = 'active' AND b.is_deleted IS NOT TRUE`,
              [studentIds, batchId]
            );

            const activeBatchMap = new Map();
            for (const row of checkAllocRes.rows) {
              activeBatchMap.set(row.student_id, row.batch_name);
            }

            const validStudents = [];
            for (const s of studentsAlloc) {
              if (activeBatchMap.has(s.id)) {
                failed++;
                success--;
                errorsList.push({ row: s.email || s.prn || 'Student', error: `Student already allocated to active batch: ${activeBatchMap.get(s.id)}` });
              } else {
                validStudents.push(s);
              }
            }

            if (validStudents.length > 0) {
              const studentParams = [];
              const studentValueRows = [];
              let studentParamIdx = 1;

              for (const s of validStudents) {
                const barcode = `LTC-${batchId}-${s.id}-${Math.floor(Math.random() * 10000)}`;
                const origRecord = chunk.find(r => r._email === s.email || r._prn === s.prn);
                const room = origRecord ? origRecord.room : null;

                studentValueRows.push(`($${studentParamIdx++}, $${studentParamIdx++}, $${studentParamIdx++}, $${studentParamIdx++}, $${studentParamIdx++})`);
                studentParams.push(batchId, s.id, barcode, null, room || null);
              }

              await pool.query(
                `INSERT INTO batch_students (batch_id, student_id, barcode, squad, room)
                 VALUES ${studentValueRows.join(', ')}
                 ON CONFLICT (batch_id, student_id)
                 DO UPDATE SET room = COALESCE(EXCLUDED.room, batch_students.room)`,
                studentParams
              );

              for (const s of validStudents) {
                sendLtcBatchEmail(s.name, s.email);
              }
            }
          }

          if (facultyAlloc.length > 0) {
            const facultyParams = [];
            const facultyValueRows = [];
            let facultyParamIdx = 1;

            for (const f of facultyAlloc) {
              facultyValueRows.push(`($${facultyParamIdx++}, $${facultyParamIdx++})`);
              facultyParams.push(batchId, f.id);
            }

            await pool.query(
              `INSERT INTO batch_faculty (batch_id, faculty_id)
               VALUES ${facultyValueRows.join(', ')}
               ON CONFLICT (batch_id, faculty_id) DO NOTHING`,
              facultyParams
            );
          }
        }
      } catch (chunkErr) {
        console.error(`Error processing chunk at index ${i}:`, chunkErr);
        failed += chunk.length;
        errorsList.push({ row: 'Chunk Ingestion', error: `Database chunk insertion failed: ${chunkErr.message}` });
      }

      processed += chunk.length;

      await pool.query(
        `UPDATE upload_jobs
         SET processed_records = $1, success_count = $2, failed_count = $3, errors = $4, updated_at = NOW()
         WHERE id = $5`,
        [processed, success, failed, JSON.stringify(errorsList), jobId]
      );

      await new Promise(resolve => setImmediate(resolve));
    }

    await pool.query(
      `UPDATE upload_jobs
       SET status = 'completed', updated_at = NOW()
       WHERE id = $1`,
      [jobId]
    );

    writeAudit(adminUserId, adminUserName, 'BULK_UPLOAD_COMPLETED', 'upload_job', jobId, {
      total_records: processed,
      success_count: success,
      failed_count: failed
    });

  } catch (fatalErr) {
    console.error('Fatal bulk upload error:', fatalErr);
    errorsList.push({ row: 'Fatal Job', error: fatalErr.message });
    await pool.query(
      `UPDATE upload_jobs
       SET status = 'failed', errors = $1, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(errorsList), jobId]
    );
  }
};

const createFaculty = async (req, res) => {
  const { name, email, department, division, school, panel, is_primary, gender } = req.body;
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const newFaculty = await pool.query(
      "INSERT INTO users (name, email, password, role, department, division, school, panel, is_primary, gender) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, name, email, role, department, division, school, panel, is_primary, gender",
      [name, email, hashedPassword, 'faculty', department, division || null, school || null, panel || null, is_primary === true || is_primary === 'true', gender || null]
    );
    res.status(201).json({ message: 'Faculty created. Default password: password123.', faculty: newFaculty.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'User already exists' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createStudent = async (req, res) => {
  const { name, email, semester, department, division, school, panel, prn, gender } = req.body;
  try {
    const hashedPassword = await bcrypt.hash('student123', 10);
    const finalPrn = prn && prn.trim() ? prn.trim() : 'PRN-STU-' + Date.now() + Math.floor(Math.random() * 1000);
    const newStudent = await pool.query(
      "INSERT INTO users (name, email, password, role, semester, department, division, school, panel, prn, gender) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, name, email, role, semester, department, division, school, panel, prn, gender",
      [name, email, hashedPassword, 'student', semester, department, division || null, school || null, panel || null, finalPrn, gender || null]
    );
    res.status(201).json({ message: 'Student created. Default password: student123.', student: newStudent.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'User already exists' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getStudents = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const school = req.query.school || '';
  const department = req.query.department || '';

  try {
    let whereClause = "WHERE u.role = 'student'";
    const params = [];
    let paramIdx = 1;

    if (search) {
      whereClause += ` AND (u.name ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx} OR u.prn ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (school) {
      whereClause += ` AND u.school = $${paramIdx}`;
      params.push(school);
      paramIdx++;
    }
    if (department) {
      whereClause += ` AND u.department = $${paramIdx}`;
      params.push(department);
      paramIdx++;
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM users u ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count);

    const dataRes = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.department, u.semester, u.division, u.school, u.panel, u.prn, u.phone, u.gender, u.nri, u.status,
              (i.prn IS NOT NULL) as insured, u.undertaking_submitted, u.undertaking_signed_name, u.undertaking_signed_date
       FROM users u
       LEFT JOIN insurance i ON u.prn = i.prn
       ${whereClause}
       ORDER BY u.name ASC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    res.json({
      students: withLtcId(dataRes.rows),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getFacultyList = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  try {
    let whereClause = "WHERE role = 'faculty'";
    const params = [];
    let paramIdx = 1;

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIdx} OR email ILIKE $${paramIdx} OR department ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM users ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count);

    const dataRes = await pool.query(
      `SELECT id, name, email, department, division, school, panel, is_primary, gender, faculty_id, phone, status,
              undertaking_submitted, undertaking_signed_name, undertaking_signed_date
       FROM users ${whereClause} ORDER BY name ASC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    res.json({
      faculty: dataRes.rows,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getFilterOptions = async (req, res) => {
  try {
    const schoolsRes = await pool.query("SELECT DISTINCT school FROM users WHERE role='student' AND school IS NOT NULL ORDER BY school");
    const deptRes = await pool.query("SELECT DISTINCT department FROM users WHERE role='student' AND department IS NOT NULL ORDER BY department");
    res.json({
      schools: schoolsRes.rows.map(r => r.school),
      departments: deptRes.rows.map(r => r.department)
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getBatches = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*,
        COUNT(DISTINCT bs.student_id) as student_count,
        COUNT(DISTINCT bf.faculty_id) as faculty_count
      FROM batches b
      LEFT JOIN batch_students bs ON b.id = bs.batch_id
      LEFT JOIN batch_faculty bf ON b.id = bf.batch_id
      WHERE b.is_deleted IS NOT TRUE
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `);
    res.json({ batches: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createBatch = async (req, res) => {
  const { name, location, start_date, end_date, status, description, batch_code, year, capacity } = req.body;
  if (!name) return res.status(400).json({ message: 'Batch name is required' });
  try {
    let finalCode = batch_code;
    if (!finalCode) {
      const batchYear = year || new Date().getFullYear();
      const countRes = await pool.query("SELECT COUNT(*) FROM batches WHERE is_deleted IS NOT TRUE AND (year = $1 OR EXTRACT(YEAR FROM created_at) = $2)", [String(batchYear), parseInt(batchYear)]);
      const seq = parseInt(countRes.rows[0].count) + 1;
      finalCode = `LTC${batchYear}-B${seq}`;
    }
    const result = await pool.query(
      `INSERT INTO batches (name, location, start_date, end_date, status, description, batch_code, year, capacity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, location || null, start_date || null, end_date || null, status || 'upcoming', description || null, finalCode, year || null, capacity || null]
    );
    const newBatchId = result.rows[0].id;
    await seedImmersionSchedulesForBatch(pool, newBatchId);
    writeAudit(req.user.id, req.user.name || 'Admin', 'BATCH_CREATED', 'batch', newBatchId, { name, batch_code: finalCode });
    res.status(201).json({ message: 'Batch created', batch: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateBatch = async (req, res) => {
  const { id } = req.params;
  const { name, location, start_date, end_date, status, description, batch_code, year, capacity } = req.body;
  try {
    const result = await pool.query(
      `UPDATE batches SET name=$1, location=$2, start_date=$3, end_date=$4, status=$5, description=$6,
        batch_code=COALESCE($7, batch_code), year=COALESCE($8, year), capacity=COALESCE($9, capacity)
       WHERE id=$10 AND is_deleted IS NOT TRUE RETURNING *`,
      [name, location || null, start_date || null, end_date || null, status || 'upcoming', description || null,
       batch_code || null, year || null, capacity || null, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Batch not found' });
    writeAudit(req.user.id, req.user.name || 'Admin', 'BATCH_UPDATED', 'batch', parseInt(id), { name });
    res.json({ message: 'Batch updated', batch: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteBatch = async (req, res) => {
  const { id } = req.params;
  const { hard } = req.query;
  try {
    if (hard === 'true') {
      await pool.query("DELETE FROM batches WHERE id = $1", [id]);
      writeAudit(req.user.id, req.user.name || 'Admin', 'BATCH_HARD_DELETED', 'batch', parseInt(id), {});
      return res.json({ message: 'Batch permanently deleted.' });
    }
    const result = await pool.query(
      "UPDATE batches SET is_deleted = true, status = 'archived' WHERE id = $1 RETURNING id, name",
      [id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Batch not found' });
    writeAudit(req.user.id, req.user.name || 'Admin', 'BATCH_ARCHIVED', 'batch', parseInt(id), { name: result.rows[0].name });
    res.json({ message: 'Batch archived. Student and faculty records remain in master database.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const restoreBatch = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE batches SET is_deleted = false, status = 'upcoming' WHERE id = $1 RETURNING id, name",
      [id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Batch not found' });
    writeAudit(req.user.id, req.user.name || 'Admin', 'BATCH_RESTORED', 'batch', parseInt(id), { name: result.rows[0].name });
    res.json({ message: 'Batch restored.', batch: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getBatchDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const batchRes = await pool.query(`
      SELECT b.*,
        COUNT(DISTINCT bs.student_id) as student_count,
        COUNT(DISTINCT bf.faculty_id) as faculty_count
      FROM batches b
      LEFT JOIN batch_students bs ON b.id = bs.batch_id
      LEFT JOIN batch_faculty bf ON b.id = bf.batch_id
      WHERE b.id = $1
      GROUP BY b.id
    `, [id]);
    if (batchRes.rowCount === 0) return res.status(404).json({ message: 'Batch not found' });
    const squadRes = await pool.query(
      `SELECT squad, COUNT(*) as count FROM batch_students WHERE batch_id = $1 AND squad IS NOT NULL GROUP BY squad ORDER BY squad`,
      [id]
    );
    res.json({ batch: batchRes.rows[0], squads: squadRes.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getBatchStudents = async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  try {
    let whereExtra = '';
    const params = [parseInt(id)];
    let paramIdx = 2;

    if (search) {
      whereExtra = ` AND (u.name ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx} OR u.prn ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM batch_students bs JOIN users u ON bs.student_id = u.id WHERE bs.batch_id = $1${whereExtra}`,
      params
    );
    const total = parseInt(countRes.rows[0].count);

    const dataRes = await pool.query(
      `SELECT u.id, u.name, u.email, u.prn, u.department, u.semester, u.school, u.division, u.gender, u.phone, u.nri, u.red_flag,
              bs.squad, bs.room, bs.barcode, bs.is_squad_leader,
              (ins.prn IS NOT NULL) as insured, u.undertaking_submitted
       FROM batch_students bs
       JOIN users u ON bs.student_id = u.id
       LEFT JOIN insurance ins ON u.prn = ins.prn
       WHERE bs.batch_id = $1${whereExtra}
       ORDER BY u.name ASC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    res.json({
      students: withLtcId(dataRes.rows),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addBatchStudents = async (req, res) => {
  const { id } = req.params;
  const { identifiers, matchType } = req.body;
  if (!Array.isArray(identifiers) || identifiers.length === 0) {
    return res.status(400).json({ message: 'identifiers must be a non-empty array' });
  }
  try {
    const batchCheck = await pool.query("SELECT id FROM batches WHERE id = $1", [id]);
    if (batchCheck.rowCount === 0) return res.status(404).json({ message: 'Batch not found' });

    const column = matchType === 'prn' ? 'prn' : 'email';
    const matchRes = await pool.query(
      `SELECT id, name, email FROM users WHERE role = 'student' AND ${column} = ANY($1)`,
      [identifiers]
    );

    let added = 0;
    let skipped = 0;
    const errors = [];

    for (const student of matchRes.rows) {
      try {
        const checkBatch = await pool.query(
          `SELECT b.name FROM batch_students bs
           JOIN batches b ON bs.batch_id = b.id
           WHERE bs.student_id = $1 AND bs.batch_id <> $2 AND b.status = 'active' AND (b.is_deleted = false OR b.is_deleted IS NULL)
           LIMIT 1`,
          [student.id, id]
        );
        if (checkBatch.rowCount > 0) {
          skipped++;
          errors.push({ email: student.email, error: `Student is already allocated to active batch: ${checkBatch.rows[0].name}` });
          continue;
        }

        const barcode = `LTC-${id}-${student.id}-${Math.floor(Math.random() * 10000)}`;
        await pool.query(
          `INSERT INTO batch_students (batch_id, student_id, barcode)
           VALUES ($1, $2, $3)
           ON CONFLICT (batch_id, student_id) DO NOTHING`,
          [id, student.id, barcode]
        );
        added++;
      } catch (e) {
        skipped++;
        errors.push({ email: student.email, error: e.message });
      }
    }

    for (const student of matchRes.rows) {
      sendLtcBatchEmail(student.name, student.email);
    }

    res.json({
      message: `Added ${added} students to batch. ${skipped} skipped (already in batch).`,
      matched: matchRes.rowCount,
      added,
      skipped,
      unmatched: identifiers.length - matchRes.rowCount,
      errors
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const removeBatchStudent = async (req, res) => {
  const { id, studentId } = req.params;
  try {
    await pool.query("DELETE FROM batch_students WHERE batch_id = $1 AND student_id = $2", [id, studentId]);
    res.json({ message: 'Student removed from batch. Master record preserved.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addOneBatchStudent = async (req, res) => {
  const { id } = req.params;
  const { student_id } = req.body;
  try {
    const studentRes = await pool.query("SELECT id, name, email FROM users WHERE id = $1 AND role = 'student'", [student_id]);
    if (studentRes.rowCount === 0) return res.status(404).json({ message: 'Student not found' });
    const student = studentRes.rows[0];
    const checkBatch = await pool.query(
      `SELECT b.name FROM batch_students bs
       JOIN batches b ON bs.batch_id = b.id
       WHERE bs.student_id = $1 AND bs.batch_id <> $2 AND b.status = 'active' AND (b.is_deleted = false OR b.is_deleted IS NULL)
       LIMIT 1`,
      [student_id, id]
    );
    if (checkBatch.rowCount > 0) {
      return res.status(400).json({ message: `Student is already allocated to active batch: ${checkBatch.rows[0].name}` });
    }

    const barcode = `LTC-${id}-${student_id}-${Math.floor(Math.random() * 10000)}`;
    await pool.query(
      `INSERT INTO batch_students (batch_id, student_id, barcode) VALUES ($1, $2, $3) ON CONFLICT (batch_id, student_id) DO NOTHING`,
      [id, student_id, barcode]
    );
    res.json({ message: 'Student added to batch.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getBatchFaculty = async (req, res) => {
  const { id } = req.params;
  const search = req.query.search || '';
  try {
    let whereExtra = '';
    const params = [parseInt(id)];
    if (search) {
      whereExtra = ` AND (u.name ILIKE $2 OR u.email ILIKE $2 OR u.department ILIKE $2)`;
      params.push(`%${search}%`);
    }
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.department, u.division, u.school, u.panel, u.is_primary, u.gender, u.phone,
              bf.squad
       FROM batch_faculty bf
       JOIN users u ON bf.faculty_id = u.id
       WHERE bf.batch_id = $1${whereExtra}
       ORDER BY u.name ASC`,
      params
    );
    res.json({ faculty: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addBatchFaculty = async (req, res) => {
  const { id } = req.params;
  const { faculty_ids } = req.body;
  if (!Array.isArray(faculty_ids) || faculty_ids.length === 0) {
    return res.status(400).json({ message: 'faculty_ids must be a non-empty array' });
  }
  try {
    let added = 0;
    for (const fid of faculty_ids) {
      await pool.query(
        `INSERT INTO batch_faculty (batch_id, faculty_id) VALUES ($1, $2) ON CONFLICT (batch_id, faculty_id) DO NOTHING`,
        [id, fid]
      );
      added++;
    }
    res.json({ message: `${added} faculty assigned to batch.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const removeBatchFaculty = async (req, res) => {
  const { id, facultyId } = req.params;
  try {
    await pool.query("DELETE FROM batch_faculty WHERE batch_id = $1 AND faculty_id = $2", [id, facultyId]);
    res.json({ message: 'Faculty removed from batch. Master record preserved.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const batchBulkUpload = async (req, res) => {
  const { id } = req.params;
  const { records, duplicateAction } = req.body;

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'records must be a non-empty array' });
  }

  try {
    const batchCheck = await pool.query("SELECT id, name FROM batches WHERE id = $1", [id]);
    if (batchCheck.rowCount === 0) return res.status(404).json({ message: 'Batch not found' });

    const jobRes = await pool.query(
      `INSERT INTO upload_jobs (batch_id, filename, status, total_records)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [id, `Batch ${batchCheck.rows[0].name} Ingestion`, 'pending', records.length]
    );
    const jobId = jobRes.rows[0].id;

    setImmediate(() => {
      processUploadJobInBackground(jobId, records, parseInt(id), true, req.user.id, req.user.name || 'Admin', duplicateAction || 'replace');
    });

    res.json({ jobId, message: 'Bulk upload started in the background.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const enrollExistingBatchUsers = async (req, res) => {
  const { id } = req.params;
  const { records } = req.body;

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'records must be a non-empty array' });
  }

  try {
    const batchCheck = await pool.query("SELECT id, name, status FROM batches WHERE id = $1 AND (is_deleted = false OR is_deleted IS NULL)", [id]);
    if (batchCheck.rowCount === 0) return res.status(404).json({ message: 'Batch not found' });

    const emails = new Set();
    const prns = new Set();
    const facultyIds = new Set();

    for (const raw of records) {
      if (!raw || typeof raw !== 'object') continue;
      const r = {};
      for (const key in raw) {
        r[key.replace(/^\uFEFF/, '').toLowerCase().trim()] = String(raw[key] || '').trim();
      }
      const email = r.email?.toLowerCase() || '';
      const prn   = r.prn || r['student id'] || r.student_id || '';
      const fid   = r.faculty_id || r['faculty id'] || '';
      if (email)  emails.add(email);
      if (prn)    prns.add(prn);
      if (fid)    facultyIds.add(fid);
    }

    if (emails.size === 0 && prns.size === 0 && facultyIds.size === 0) {
      return res.status(400).json({ message: 'No valid email, PRN, or faculty_id found in the uploaded file.' });
    }

    const matchRes = await pool.query(
      `SELECT id, name, email, prn, faculty_id, role
       FROM users
       WHERE email = ANY($1) OR prn = ANY($2) OR faculty_id = ANY($3)`,
      [[...emails], [...prns], [...facultyIds]]
    );

    const allUsers = matchRes.rows;
    const students = allUsers.filter(u => u.role === 'student' || u.role === 'ltc_member');
    const faculty  = allUsers.filter(u => u.role === 'faculty');

    let enrolled = 0;
    let alreadyInBatch = 0;
    const notFoundCount = records.length - allUsers.length;

    if (students.length > 0) {
      const studentIds = students.map(s => s.id);

      const alreadyRes = await pool.query(
        `SELECT student_id FROM batch_students WHERE batch_id = $1 AND student_id = ANY($2)`,
        [id, studentIds]
      );
      const alreadySet = new Set(alreadyRes.rows.map(r => r.student_id));

      const toAdd = students.filter(s => !alreadySet.has(s.id));
      alreadyInBatch += alreadySet.size;

      if (toAdd.length > 0) {
        const valueRows = [];
        const params = [];
        let idx = 1;
        for (const s of toAdd) {
          const barcode = `LTC-${id}-${s.id}-${Math.floor(Math.random() * 10000)}`;
          valueRows.push(`($${idx++}, $${idx++}, $${idx++})`);
          params.push(id, s.id, barcode);
        }
        await pool.query(
          `INSERT INTO batch_students (batch_id, student_id, barcode)
           VALUES ${valueRows.join(', ')}
           ON CONFLICT (batch_id, student_id) DO NOTHING`,
          params
        );
        enrolled += toAdd.length;

        for (const s of toAdd) {
          sendLtcBatchEmail(s.name, s.email).catch(() => {});
        }
      }
    }

    if (faculty.length > 0) {
      const facultyUserIds = faculty.map(f => f.id);

      const alreadyFacRes = await pool.query(
        `SELECT faculty_id FROM batch_faculty WHERE batch_id = $1 AND faculty_id = ANY($2)`,
        [id, facultyUserIds]
      );
      const alreadyFacSet = new Set(alreadyFacRes.rows.map(r => r.faculty_id));

      const toAdd = faculty.filter(f => !alreadyFacSet.has(f.id));
      alreadyInBatch += alreadyFacSet.size;

      if (toAdd.length > 0) {
        const valueRows = [];
        const params = [];
        let idx = 1;
        for (const f of toAdd) {
          valueRows.push(`($${idx++}, $${idx++})`);
          params.push(id, f.id);
        }
        await pool.query(
          `INSERT INTO batch_faculty (batch_id, faculty_id)
           VALUES ${valueRows.join(', ')}
           ON CONFLICT (batch_id, faculty_id) DO NOTHING`,
          params
        );
        enrolled += toAdd.length;
      }
    }

    res.json({
      message: `Enrollment complete.`,
      enrolled,
      alreadyInBatch,
      notFound: notFoundCount < 0 ? 0 : notFoundCount,
      total: records.length
    });
  } catch (err) {
    console.error('Enroll-existing error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getBatchSquads = async (req, res) => {
  const { id } = req.params;
  try {
    const lockKey = `batch_${id}_squads_locked`;
    const lockCheck = await pool.query("SELECT value FROM system_settings WHERE key = $1", [lockKey]);
    const isLocked = lockCheck.rowCount > 0 && lockCheck.rows[0].value === 'true';

    const studentsRes = await pool.query(
      `SELECT u.id, u.name, u.email, u.gender, u.prn, u.undertaking_submitted, bs.squad, bs.room, bs.barcode, bs.is_squad_leader
       FROM batch_students bs
       JOIN users u ON bs.student_id = u.id
       WHERE bs.batch_id = $1
       ORDER BY bs.squad ASC, u.name ASC`,
      [id]
    );

    const facultyRes = await pool.query(
      `SELECT u.id, u.name, u.email, u.department, u.undertaking_submitted, bf.squad
       FROM batch_faculty bf
       JOIN users u ON bf.faculty_id = u.id
       WHERE bf.batch_id = $1
       ORDER BY bf.squad ASC, u.name ASC`,
      [id]
    );

    res.json({
      locked: isLocked,
      students: studentsRes.rows,
      faculty: facultyRes.rows,
      squadNames: SQUAD_NAMES
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const autoAllocateBatchSquads = async (req, res) => {
  const { id } = req.params;
  try {
    const lockKey = `batch_${id}_squads_locked`;
    const lockCheck = await pool.query("SELECT value FROM system_settings WHERE key = $1", [lockKey]);
    if (lockCheck.rowCount > 0 && lockCheck.rows[0].value === 'true') {
      return res.status(400).json({ message: 'Squad allocation is locked for this batch.' });
    }

    const studentsRes = await pool.query(
      "SELECT u.id, u.gender FROM batch_students bs JOIN users u ON bs.student_id = u.id WHERE bs.batch_id = $1",
      [id]
    );
    const students = studentsRes.rows;
    const total = students.length;

    if (total === 0) return res.status(400).json({ message: 'No students in this batch.' });

    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const girls = shuffle(students.filter(s => {
      const g = s.gender ? s.gender.trim().toLowerCase() : '';
      return g === 'female' || g === 'f';
    }));
    const boys = shuffle(students.filter(s => {
      const g = s.gender ? s.gender.trim().toLowerCase() : '';
      return g === 'male' || g === 'm';
    }));
    const others = shuffle(students.filter(s => {
      const g = s.gender ? s.gender.trim().toLowerCase() : '';
      return g !== 'female' && g !== 'f' && g !== 'male' && g !== 'm';
    }));
    const allStudents = [...girls, ...boys, ...others];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < allStudents.length; i++) {
        const squadName = SQUAD_NAMES[i % SQUAD_NAMES.length];
        const barcode = `LTC-${id}-${allStudents[i].id}-${Math.floor(Math.random() * 10000)}`;
        await client.query(
          "UPDATE batch_students SET squad = $1, barcode = $2 WHERE batch_id = $3 AND student_id = $4",
          [squadName, barcode, id, allStudents[i].id]
        );
      }

      const facultyRes = await client.query(
        "SELECT u.id FROM batch_faculty bf JOIN users u ON bf.faculty_id = u.id WHERE bf.batch_id = $1",
        [id]
      );
      const faculty = shuffle(facultyRes.rows);
      for (let i = 0; i < faculty.length; i++) {
        const squadName = SQUAD_NAMES[i % SQUAD_NAMES.length];
        await client.query(
          "UPDATE batch_faculty SET squad = $1 WHERE batch_id = $2 AND faculty_id = $3",
          [squadName, id, faculty[i].id]
        );
      }

      await client.query('COMMIT');
      res.json({ message: `Squads allocated for ${allStudents.length} students across ${SQUAD_NAMES.length} squads.` });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateBatchStudentSquad = async (req, res) => {
  const { id } = req.params;
  const { student_id, squad } = req.body;
  try {
    await pool.query(
      "UPDATE batch_students SET squad = $1 WHERE batch_id = $2 AND student_id = $3",
      [squad, id, student_id]
    );
    res.json({ message: 'Squad updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const lockBatchSquads = async (req, res) => {
  const { id } = req.params;
  const { locked } = req.body;
  try {
    const lockKey = `batch_${id}_squads_locked`;
    await pool.query(
      `INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [lockKey, locked ? 'true' : 'false']
    );
    res.json({ message: `Squad allocation ${locked ? 'locked' : 'unlocked'}.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const notifyBatchSquads = async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;
  try {
    const studentsRes = await pool.query(
      `SELECT u.name, u.email, u.phone, bs.squad FROM batch_students bs
       JOIN users u ON bs.student_id = u.id
       WHERE bs.batch_id = $1`,
      [id]
    );
    const facultyRes = await pool.query(
      `SELECT u.name, u.email, u.phone, bf.squad FROM batch_faculty bf
       JOIN users u ON bf.faculty_id = u.id
       WHERE bf.batch_id = $1`,
      [id]
    );

    const students = studentsRes.rows;
    const faculty = facultyRes.rows;
    let successCount = 0;

    if (type === 'email') {
      for (const u of [...students, ...faculty]) {
        if (u.email && u.squad) {
          try {
            await sendSquadNotificationEmail(u.name, u.email, u.squad);
            successCount++;
          } catch (e) {
            console.error(`Failed to send email to ${u.email}`, e);
          }
        }
      }
    } else if (type === 'whatsapp') {
      for (const u of [...students, ...faculty]) {
        if (u.phone && u.squad) {
          console.log(`[WhatsApp Mock] Sending squad assignment notification to ${u.name} (${u.phone}): You are assigned to Squad ${u.squad}`);
          successCount++;
        }
      }
    }

    res.json({
      message: `Successfully notified ${successCount} members via ${type.toUpperCase()}.`,
      studentsCount: students.length,
      facultyCount: faculty.length,
      notifiedCount: successCount
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getDashboard = async (req, res) => {
  try {
    const activeBatchRes = await pool.query(
      "SELECT id FROM batches WHERE status = 'active' AND is_deleted IS NOT TRUE LIMIT 1"
    );
    let allFaculties, allStudents;
    if (activeBatchRes.rowCount > 0) {
      const activeBatchId = activeBatchRes.rows[0].id;
      allFaculties = await pool.query(
        `SELECT u.id, u.name, u.email, u.department FROM users u
         JOIN batch_faculty bf ON u.id = bf.faculty_id
         WHERE bf.batch_id = $1`,
        [activeBatchId]
      );
      allStudents = await pool.query(
        `SELECT u.id, u.name, u.email, u.semester, u.department FROM users u
         JOIN batch_students bs ON u.id = bs.student_id
         WHERE bs.batch_id = $1`,
        [activeBatchId]
      );
    } else {
      allFaculties = await pool.query("SELECT id, name, email, department FROM users WHERE role = 'faculty'");
      allStudents = await pool.query("SELECT id, name, email, semester, department FROM users WHERE role = 'student'");
    }
    res.json({ message: 'Welcome Admin', faculties: allFaculties.rows, students: allStudents.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const allUsers = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.department, u.semester,
             u.division, u.school, u.panel, u.is_primary, u.prn,
             COALESCE(bs.squad, u.squad) as squad,
             COALESCE(bs.room, u.room) as room,
             COALESCE(bs.barcode, u.barcode) as barcode,
             u.in_current_batch,
             u.undertaking_submitted, u.undertaking_signed_name, u.undertaking_signed_date,
             COALESCE(bs.is_squad_leader, u.is_squad_leader) as is_squad_leader, u.phone,
             (i.prn IS NOT NULL) as insured, i.policy_number, i.provider,
             bs.batch_id as active_batch_id
      FROM users u
      LEFT JOIN insurance i ON u.prn = i.prn
      LEFT JOIN batch_students bs ON u.id = bs.student_id AND bs.batch_id = (
        SELECT id FROM batches WHERE status = 'active' AND is_deleted IS NOT TRUE LIMIT 1
      )
      ORDER BY u.id ASC
    `);
    const squadLeadersRes = await pool.query("SELECT * FROM squad_leaders");
    res.json({ users: allUsers.rows, squadLeaders: squadLeadersRes.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updatePanel = async (req, res) => {
  const { user_id, panel } = req.body;
  try {
    await pool.query("UPDATE users SET panel = $1 WHERE id = $2", [panel, user_id]);
    res.json({ message: 'Panel updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateDivision = async (req, res) => {
  const { user_id, division } = req.body;
  try {
    await pool.query("UPDATE users SET division = $1 WHERE id = $2", [division || null, user_id]);
    res.json({ message: 'Division updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateInsurance = async (req, res) => {
  const { user_id, insurance } = req.body;
  try {
    const userRes = await pool.query("SELECT prn FROM users WHERE id = $1", [user_id]);
    if (userRes.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    const prn = userRes.rows[0].prn;
    if (!prn) return res.status(400).json({ message: 'User has no PRN' });
    if (insurance) {
      await pool.query(
        "INSERT INTO insurance (prn, policy_number, provider) VALUES ($1, $2, $3) ON CONFLICT (prn) DO NOTHING",
        [prn, 'POLICY-' + user_id, 'LTC Provider']
      );
    } else {
      await pool.query("DELETE FROM insurance WHERE prn = $1", [prn]);
    }
    res.json({ message: 'Insurance status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const validateBulkUpload = async (req, res) => {
  const { users } = req.body;
  if (!Array.isArray(users)) {
    return res.status(400).json({ message: 'users must be an array' });
  }

  try {
    const emails = [];
    const prns = [];
    const facultyIds = [];

    for (const r of users) {
      if (!r || typeof r !== 'object') continue;

      const normalized = {};
      for (const key in r) {
        const cleanKey = key.replace(/^\uFEFF/, '').toLowerCase().trim();
        normalized[cleanKey] = r[key];
      }

      const prn = String(normalized.prn || normalized['student id'] || normalized.student_id || '').trim();
      const email = String(normalized.email || '').trim().toLowerCase();
      const facultyId = String(normalized.faculty_id || normalized['faculty id'] || '').trim();

      if (email) emails.push(email);
      if (prn) prns.push(prn);
      if (facultyId) facultyIds.push(facultyId);
    }

    let existingUsers = [];
    if (emails.length > 0 || prns.length > 0 || facultyIds.length > 0) {
      const dbRes = await pool.query(
        `SELECT id, email, prn, faculty_id, role, name FROM users
         WHERE (email IS NOT NULL AND email = ANY($1)) 
            OR (prn IS NOT NULL AND prn = ANY($2)) 
            OR (faculty_id IS NOT NULL AND faculty_id = ANY($3))`,
        [emails, prns, facultyIds]
      );
      existingUsers = dbRes.rows;
    }

    const duplicates = [];
    for (const r of users) {
      if (!r || typeof r !== 'object') continue;

      const normalized = {};
      for (const key in r) {
        const cleanKey = key.replace(/^\uFEFF/, '').toLowerCase().trim();
        normalized[cleanKey] = r[key];
      }

      const prn = String(normalized.prn || normalized['student id'] || normalized.student_id || '').trim();
      const email = String(normalized.email || '').trim().toLowerCase();
      const facultyId = String(normalized.faculty_id || normalized['faculty id'] || '').trim();

      let matched = existingUsers.find(u => 
        (email && u.email && u.email.toLowerCase() === email) ||
        (prn && u.prn && u.prn === prn) ||
        (facultyId && u.faculty_id && u.faculty_id === facultyId)
      );

      if (matched) {
        duplicates.push({
          uploadRecord: {
            name: normalized.name || normalized.full_name || normalized.student_name || 'Unknown',
            email: email || null,
            prn: prn || null,
            faculty_id: facultyId || null,
            role: normalized.role || 'student'
          },
          existingRecord: {
            name: matched.name,
            email: matched.email,
            prn: matched.prn,
            faculty_id: matched.faculty_id,
            role: matched.role
          }
        });
      }
    }

    res.json({ duplicates });
  } catch (err) {
    res.status(500).json({ message: 'Server error during validation', error: err.message });
  }
};

const globalBulkUpload = async (req, res) => {
  const { users, duplicateAction } = req.body;
  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ message: 'users must be a non-empty array' });
  }
  try {
    const jobRes = await pool.query(
      `INSERT INTO upload_jobs (batch_id, filename, status, total_records)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [null, 'Global Master Ingestion', 'pending', users.length]
    );
    const jobId = jobRes.rows[0].id;

    setImmediate(() => {
      processUploadJobInBackground(jobId, users, null, false, req.user.id, req.user.name || 'Admin', duplicateAction || 'replace');
    });

    res.json({ jobId, message: 'Bulk upload started in the background.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getUploadJobStatus = async (req, res) => {
  const { jobId } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, batch_id, filename, status, total_records, processed_records, success_count, failed_count, errors, created_at, updated_at
       FROM upload_jobs WHERE id = $1`,
      [jobId]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Job not found' });
    res.json({ job: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const autoAllocateRoomsSquads = async (req, res) => {
  try {
    const studentsRes = await pool.query("SELECT id, gender FROM users WHERE role = 'student'");
    let students = studentsRes.rows.sort(() => Math.random() - 0.5);
    let currentRoomMale = 1, roomMaleCount = 0;
    let currentRoomFemale = 1, roomFemaleCount = 0;
    let currentRoomUnans = 1, roomUnansCount = 0;
    let currentSquad = 1, squadCount = 0;
    const updatePromises = [];
    for (const s of students) {
      if (squadCount >= 60) { currentSquad++; squadCount = 0; }
      const squadName = SQUAD_NAMES[(currentSquad - 1) % 10];
      squadCount++;
      let roomName = '';
      if (s.gender && s.gender.toLowerCase() === 'male') {
        if (roomMaleCount >= 40) { currentRoomMale++; roomMaleCount = 0; }
        roomName = `M-${currentRoomMale}`; roomMaleCount++;
      } else if (s.gender && s.gender.toLowerCase() === 'female') {
        if (roomFemaleCount >= 40) { currentRoomFemale++; roomFemaleCount = 0; }
        roomName = `F-${currentRoomFemale}`; roomFemaleCount++;
      } else {
        if (roomUnansCount >= 40) { currentRoomUnans++; roomUnansCount = 0; }
        roomName = `U-${currentRoomUnans}`; roomUnansCount++;
      }
      const barcode = `LTC-${s.id}-${Math.floor(Math.random() * 10000)}`;
      updatePromises.push(
        pool.query("UPDATE users SET squad = $1, room = $2, barcode = $3 WHERE id = $4", [squadName, roomName, barcode, s.id])
      );
    }
    await Promise.all(updatePromises);
    res.json({ message: `Allocated ${students.length} students.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const bulkInsurance = async (req, res) => {
  const data = req.body.users || req.body.insuranceData;
  if (!Array.isArray(data)) return res.status(400).json({ message: 'Data must be an array' });
  try {
    const results = [], errors = [];
    for (const item of data) {
      try {
        const prn = String(item.prn || item.PRN || '').trim();
        if (!prn) throw new Error('Missing PRN');
        await pool.query(
          "INSERT INTO insurance (prn, policy_number, provider) VALUES ($1, $2, $3) ON CONFLICT (prn) DO UPDATE SET policy_number = EXCLUDED.policy_number, provider = EXCLUDED.provider",
          [prn, item.policy_number || item.policy || 'POLICY-BULK', item.provider || 'LTC Provider']
        );
        results.push(prn);
      } catch (err) {
        errors.push({ prn: item.prn, error: err.message });
      }
    }
    res.status(201).json({ message: `Processed ${results.length} insurance records.`, results, errors });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getUserByBarcode = async (req, res) => {
  const { barcode } = req.query;
  try {
    const user = await pool.query(
      "SELECT id, name, email, role, department, division, school, panel, squad, room, barcode FROM users WHERE barcode = $1",
      [barcode]
    );
    if (user.rowCount === 0) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getFeedback = async (req, res) => {
  const { user_id } = req.query;
  try {
    let query = `SELECT f.*, u.name, u.email FROM feedback f JOIN users u ON f.user_id = u.id`;
    const params = [];
    if (user_id) { query += ` WHERE f.user_id = $1`; params.push(user_id); }
    query += ` ORDER BY f.created_at DESC`;
    const feedback = await pool.query(query, params);
    res.json({ feedback: feedback.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getAuditLogs = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const action = req.query.action || '';
  const search = req.query.search || '';

  try {
    let whereClause = "WHERE 1=1";
    const params = [];
    let paramIdx = 1;

    if (action) {
      whereClause += ` AND action = $${paramIdx}`;
      params.push(action);
      paramIdx++;
    }
    if (search) {
      whereClause += ` AND (user_name ILIKE $${paramIdx} OR details ILIKE $${paramIdx} OR entity_type ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM audit_logs ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count);

    const dataRes = await pool.query(
      `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    res.json({
      logs: dataRes.rows,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const userRes = await pool.query("SELECT role FROM users WHERE id = $1", [id]);
    if (userRes.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    if (userRes.rows[0].role === 'admin') return res.status(403).json({ message: 'Cannot delete admin' });
    await pool.query("DELETE FROM batch_students WHERE student_id = $1", [id]);
    await pool.query("DELETE FROM batch_faculty WHERE faculty_id = $1", [id]);
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ message: 'User deleted from master database.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const resetDatabase = async (req, res) => {
  try {
    await pool.query("DELETE FROM batch_students");
    await pool.query("DELETE FROM batch_faculty");
    await pool.query("DELETE FROM batches");
    await pool.query("DELETE FROM users WHERE role != 'admin'");
    await pool.query("DELETE FROM schedules");
    await pool.query("DELETE FROM attendance");
    await pool.query("DELETE FROM evaluations");
    await pool.query("DELETE FROM feedback");
    await pool.query("DELETE FROM documents");
    await pool.query("DELETE FROM insurance");
    await pool.query("DELETE FROM squad_leaders");
    res.json({ message: 'Database reset. Admin account preserved.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset database', error: err.message });
  }
};

const getCurrentBatch = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.department, u.semester,
              u.division, u.school, u.panel, u.is_primary, u.prn,
              u.squad, u.room, u.barcode, u.in_current_batch,
              u.undertaking_submitted, u.undertaking_signed_name, u.undertaking_signed_date,
              (i.prn IS NOT NULL) as insured
       FROM users u
       LEFT JOIN insurance i ON u.prn = i.prn
       WHERE u.role = 'student' AND u.in_current_batch = true
       ORDER BY u.id ASC`
    );
    res.json({ students: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const setCurrentBatch = async (req, res) => {
  const { identifiers, matchType } = req.body;
  if (!Array.isArray(identifiers)) return res.status(400).json({ message: 'identifiers must be an array' });
  try {
    await pool.query("UPDATE users SET in_current_batch = false WHERE role = 'student'");
    const column = matchType === 'prn' ? 'prn' : 'email';
    const matches = await pool.query(
      `SELECT id, name, email FROM users WHERE role = 'student' AND ${column} = ANY($1)`,
      [identifiers]
    );
    if (matches.rowCount > 0) {
      const matchedIds = matches.rows.map(r => r.id);
      await pool.query("UPDATE users SET in_current_batch = true WHERE id = ANY($1)", [matchedIds]);
      for (const student of matches.rows) sendLtcBatchEmail(student.name, student.email);
    }
    res.json({ message: `Set ${matches.rowCount} students in current batch.`, matchedCount: matches.rowCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const toggleStudentBatch = async (req, res) => {
  const { user_id, in_batch } = req.body;
  try {
    const userQuery = await pool.query("SELECT id, name, email, role, in_current_batch FROM users WHERE id = $1", [user_id]);
    if (userQuery.rowCount === 0) return res.status(404).json({ message: 'User not found.' });
    const user = userQuery.rows[0];
    if (in_batch && user.role === 'student' && !user.in_current_batch) {
      await pool.query("UPDATE users SET in_current_batch = true WHERE id = $1", [user_id]);
      sendLtcBatchEmail(user.name, user.email);
    } else {
      await pool.query("UPDATE users SET in_current_batch = $1 WHERE id = $2", [in_batch, user_id]);
    }
    res.json({ message: 'Batch status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const clearCurrentBatch = async (req, res) => {
  try {
    await pool.query("UPDATE users SET in_current_batch = false WHERE role = 'student'");
    res.json({ message: 'Current batch cleared.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getSquadAllocationState = async (req, res) => {
  try {
    const lockCheck = await pool.query("SELECT value FROM system_settings WHERE key = 'squads_locked'");
    const isLocked = lockCheck.rowCount > 0 && lockCheck.rows[0].value === 'true';
    const studentsRes = await pool.query(
      "SELECT id, name, email, gender, prn, squad, role, in_current_batch, is_squad_leader, phone FROM users WHERE role = 'student' AND in_current_batch = true ORDER BY name ASC"
    );
    const facultyRes = await pool.query(
      "SELECT id, name, email, department, squad, role, in_current_batch FROM users WHERE role = 'faculty' AND in_current_batch = true ORDER BY name ASC"
    );
    const squadLeadersRes = await pool.query("SELECT * FROM squad_leaders");
    res.json({ locked: isLocked, students: studentsRes.rows, faculties: facultyRes.rows, squadLeaders: squadLeadersRes.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const lockSquads = async (req, res) => {
  try {
    await pool.query("INSERT INTO system_settings (key, value) VALUES ('squads_locked', 'true') ON CONFLICT (key) DO UPDATE SET value = 'true'");
    res.json({ message: 'Squad allocation locked.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const unlockSquads = async (req, res) => {
  try {
    await pool.query("INSERT INTO system_settings (key, value) VALUES ('squads_locked', 'false') ON CONFLICT (key) DO UPDATE SET value = 'false'");
    res.json({ message: 'Squad allocation unlocked.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const shuffleSquads = async (req, res) => {
  try {
    const lockCheck = await pool.query("SELECT value FROM system_settings WHERE key = 'squads_locked'");
    if (lockCheck.rowCount > 0 && lockCheck.rows[0].value === 'true') {
      return res.status(400).json({ message: 'Squad allocation is locked.' });
    }
    const studentsRes = await pool.query("SELECT id, name, email, gender FROM users WHERE role = 'student' AND in_current_batch = true");
    const students = studentsRes.rows;
    const facultyRes = await pool.query("SELECT id FROM users WHERE role = 'faculty' AND in_current_batch = true");
    const faculties = facultyRes.rows;

    const shuffle = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    };

    const girls = students.filter(s => {
      const g = s.gender ? s.gender.trim().toLowerCase() : '';
      return g === 'female' || g === 'f';
    });
    const boys = students.filter(s => {
      const g = s.gender ? s.gender.trim().toLowerCase() : '';
      return g === 'male' || g === 'm';
    });
    const others = students.filter(s => {
      const g = s.gender ? s.gender.trim().toLowerCase() : '';
      return g !== 'female' && g !== 'f' && g !== 'male' && g !== 'm';
    });
    shuffle(girls); shuffle(boys); shuffle(others);
    const allStudents = [...girls, ...boys, ...others];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("UPDATE users SET squad = NULL WHERE in_current_batch = false OR in_current_batch IS NULL");

      for (let idx = 0; idx < allStudents.length; idx++) {
        await client.query("UPDATE users SET squad = $1 WHERE id = $2", [SQUAD_NAMES[idx % SQUAD_NAMES.length], allStudents[idx].id]);
      }

      await client.query("UPDATE users SET squad = NULL WHERE role = 'faculty'");
      shuffle(faculties);
      for (let idx = 0; idx < faculties.length; idx++) {
        if (idx < 20) {
          await client.query("UPDATE users SET squad = $1 WHERE id = $2", [SQUAD_NAMES[Math.floor(idx / 2)], faculties[idx].id]);
        }
      }
      await client.query('COMMIT');
      res.json({ message: 'Squad allocation completed.' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error during shuffling', error: err.message });
  }
};

module.exports = {
  createFaculty,
  createStudent,
  getStudents,
  getFacultyList,
  getFilterOptions,
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  restoreBatch,
  getBatchDetails,
  getBatchStudents,
  addBatchStudents,
  removeBatchStudent,
  addOneBatchStudent,
  getBatchFaculty,
  addBatchFaculty,
  removeBatchFaculty,
  batchBulkUpload,
  enrollExistingBatchUsers,
  getBatchSquads,
  autoAllocateBatchSquads,
  updateBatchStudentSquad,
  lockBatchSquads,
  notifyBatchSquads,
  getDashboard,
  getUsers,
  updatePanel,
  updateDivision,
  updateInsurance,
  validateBulkUpload,
  globalBulkUpload,
  getUploadJobStatus,
  autoAllocateRoomsSquads,
  bulkInsurance,
  getUserByBarcode,
  getFeedback,
  getAuditLogs,
  deleteUser,
  resetDatabase,
  getCurrentBatch,
  setCurrentBatch,
  toggleStudentBatch,
  clearCurrentBatch,
  getSquadAllocationState,
  lockSquads,
  unlockSquads,
  shuffleSquads,
};

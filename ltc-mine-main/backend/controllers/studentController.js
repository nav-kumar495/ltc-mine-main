const pool = require('../config/db');

const getDashboard = async (req, res) => {
  try {
    const myData = await pool.query(
      `SELECT u.id, u.name, u.email, u.semester, u.department, u.prn, u.red_flag,
              u.in_current_batch, u.undertaking_submitted, u.undertaking_signed_name, u.undertaking_signed_date,
              (i.prn IS NOT NULL) as insured, i.policy_number, i.provider,
              bs.batch_id, bs.squad, bs.room
       FROM users u
       LEFT JOIN insurance i ON u.prn = i.prn
       LEFT JOIN batch_students bs ON u.id = bs.student_id AND bs.batch_id = (
         SELECT bs2.batch_id FROM batch_students bs2
         JOIN batches b2 ON bs2.batch_id = b2.id
         WHERE bs2.student_id = u.id AND (b2.is_deleted = false OR b2.is_deleted IS NULL)
         ORDER BY bs2.batch_id DESC LIMIT 1
       )
       WHERE u.id = $1`,
      [req.user.id]
    );
    const studentObj = myData.rows[0];
    let squadFaculty = [];
    if (studentObj && studentObj.batch_id && studentObj.squad) {
      const facultyRes = await pool.query(
        `SELECT u.name, u.email, u.department
         FROM batch_faculty bf
         JOIN users u ON bf.faculty_id = u.id
         WHERE bf.batch_id = $1 AND bf.squad = $2`,
        [studentObj.batch_id, studentObj.squad]
      );
      squadFaculty = facultyRes.rows;
    }
    res.json({ message: 'Welcome Student', data: studentObj, squadFaculty });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getSchedules = async (req, res) => {
  try {
    const activeBatchRes = await pool.query(
      `SELECT bs.batch_id FROM batch_students bs
       JOIN batches b ON bs.batch_id = b.id
       WHERE bs.student_id = $1 AND (b.is_deleted = false OR b.is_deleted IS NULL)
       ORDER BY bs.batch_id DESC LIMIT 1`,
      [req.user.id]
    );
    const activeBatchId = activeBatchRes.rowCount > 0 ? activeBatchRes.rows[0].batch_id : null;

    const userRes = await pool.query("SELECT panel FROM users WHERE id = $1", [req.user.id]);
    const panelStr = userRes.rowCount > 0 ? userRes.rows[0].panel : '';
    const panels = (panelStr || '').split(',').map(p => p.trim()).filter(Boolean);

    let schedules;
    if (activeBatchId) {
      if (panels.length > 0) {
        schedules = await pool.query(
          "SELECT * FROM schedules WHERE (batch_id = $1) AND (panel = 'ALL' OR panel = ANY($2)) ORDER BY id ASC",
          [activeBatchId, panels]
        );
      } else {
        schedules = await pool.query(
          "SELECT * FROM schedules WHERE (batch_id = $1) AND (panel = 'ALL' OR panel = $2) ORDER BY id ASC",
          [activeBatchId, req.user.panel || 'Unassigned']
        );
      }
    } else {
      if (panels.length > 0) {
        schedules = await pool.query(
          "SELECT * FROM schedules WHERE (batch_id IS NULL) AND (panel = 'ALL' OR panel = ANY($1)) ORDER BY id ASC",
          [panels]
        );
      } else {
        schedules = await pool.query(
          "SELECT * FROM schedules WHERE (batch_id IS NULL) AND (panel = 'ALL' OR panel = $1) ORDER BY id ASC",
          [req.user.panel || 'Unassigned']
        );
      }
    }
    res.json({ schedules: schedules.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getAttendance = async (req, res) => {
  try {
    const att = await pool.query(
      `SELECT a.status, s.title, s.date FROM attendance a JOIN schedules s ON a.schedule_id = s.id WHERE a.student_id = $1`,
      [req.user.id]
    );
    res.json({ attendance: att.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getEvaluations = async (req, res) => {
  try {
    const evals = await pool.query(
      `SELECT e.*, s.title as activity_title FROM evaluations e LEFT JOIN schedules s ON e.schedule_id = s.id WHERE e.student_id = $1`,
      [req.user.id]
    );
    res.json({ evaluations: evals.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const submitInsurance = async (req, res) => {
  const { policy_number, provider } = req.body;
  try {
    const userRes = await pool.query("SELECT prn FROM users WHERE id = $1", [req.user.id]);
    if (userRes.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    let prn = userRes.rows[0].prn;
    if (!prn) {
      prn = 'PRN-STU-' + req.user.id;
      await pool.query("UPDATE users SET prn = $1 WHERE id = $2", [prn, req.user.id]);
    }
    await pool.query(
      "INSERT INTO insurance (prn, policy_number, provider) VALUES ($1, $2, $3) ON CONFLICT (prn) DO UPDATE SET policy_number = EXCLUDED.policy_number, provider = EXCLUDED.provider",
      [prn, policy_number || 'POLICY-' + req.user.id, provider || 'Student Submitted']
    );
    res.json({ message: 'Insurance submitted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const submitUndertaking = async (req, res) => {
  const { signedName, signedDate } = req.body;
  try {
    await pool.query(
      "UPDATE users SET undertaking_submitted = true, undertaking_signed_name = $1, undertaking_signed_date = $2 WHERE id = $3 AND role = 'student'",
      [signedName, signedDate, req.user.id]
    );
    res.json({ message: 'Undertaking submitted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  getDashboard,
  getSchedules,
  getAttendance,
  getEvaluations,
  submitInsurance,
  submitUndertaking,
};

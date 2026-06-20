const pool = require('../config/db');
const { withLtcId } = require('../utils/helpers');

const submitUndertaking = async (req, res) => {
  const { signedName, signedDate } = req.body;
  try {
    await pool.query(
      "UPDATE users SET undertaking_submitted = true, undertaking_signed_name = $1, undertaking_signed_date = $2 WHERE id = $3 AND role = 'faculty'",
      [signedName, signedDate, req.user.id]
    );
    res.json({ message: 'Undertaking submitted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getDashboard = async (req, res) => {
  try {
    const activeBatchRes = await pool.query(
      `SELECT bf.batch_id, bf.squad, b.name as batch_name
       FROM batch_faculty bf
       JOIN batches b ON bf.batch_id = b.id
       WHERE bf.faculty_id = $1 AND (b.is_deleted = false OR b.is_deleted IS NULL)
       ORDER BY bf.batch_id DESC LIMIT 1`,
      [req.user.id]
    );
    const activeBatchId = activeBatchRes.rowCount > 0 ? activeBatchRes.rows[0].batch_id : null;
    const squadName = activeBatchRes.rowCount > 0 ? activeBatchRes.rows[0].squad : null;

    const facultyUser = await pool.query(
      "SELECT id, name, email, role, department, division, school, panel, undertaking_submitted, undertaking_signed_name, undertaking_signed_date FROM users WHERE id = $1",
      [req.user.id]
    );
    const facultyInfo = facultyUser.rows[0];
    if (facultyInfo) {
      facultyInfo.squad = squadName || null;
    }

    let squadLeader = null;
    let squadStudents = [];
    let myStudentsRows = [];

    if (activeBatchId && squadName) {
      // Fetch squad students from the active batch
      const squadStudentsRes = await pool.query(
        `SELECT u.id, u.name, u.email, u.semester, u.department, u.panel, u.nri, u.red_flag, u.gender, u.prn, u.phone,
                u.undertaking_submitted,
                bs.squad, bs.room, bs.barcode
         FROM users u
         JOIN batch_students bs ON u.id = bs.student_id
         WHERE u.role = 'student' AND bs.batch_id = $1 AND bs.squad = $2`,
        [activeBatchId, squadName]
      );
      squadStudents = squadStudentsRes.rows;
      myStudentsRows = squadStudents;

      // Fetch squad leader
      const leaderRes = await pool.query(
        `SELECT u.name, u.email, u.prn, u.phone
         FROM batch_students bs
         JOIN users u ON bs.student_id = u.id
         WHERE bs.batch_id = $1 AND bs.squad = $2 AND bs.is_squad_leader = true
         LIMIT 1`,
        [activeBatchId, squadName]
      );
      if (leaderRes.rowCount > 0) {
        squadLeader = leaderRes.rows[0];
      } else {
        const legacyLeaderRes = await pool.query("SELECT * FROM squad_leaders WHERE squad_name = $1", [squadName]);
        if (legacyLeaderRes.rowCount > 0) squadLeader = legacyLeaderRes.rows[0];
      }
    } else {
      // Fallback behavior if not allocated to a squad in the active batch
      const panels = (req.user.panel || '').split(',').map(p => p.trim()).filter(Boolean);
      let myStudents;
      if (activeBatchId) {
        if (panels.length > 0) {
          myStudents = await pool.query(
            `SELECT u.id, u.name, u.email, u.semester, u.department, u.panel, u.nri, u.red_flag, u.gender, u.prn, u.phone,
                    u.undertaking_submitted, bs.squad, bs.room, bs.barcode
             FROM users u
             JOIN batch_students bs ON u.id = bs.student_id
             WHERE u.role = 'student' AND bs.batch_id = $1 AND u.panel = ANY($2)`,
            [activeBatchId, panels]
          );
        } else {
          myStudents = await pool.query(
            `SELECT u.id, u.name, u.email, u.semester, u.department, u.panel, u.nri, u.red_flag, u.gender, u.prn, u.phone,
                    u.undertaking_submitted, bs.squad, bs.room, bs.barcode
             FROM users u
             JOIN batch_students bs ON u.id = bs.student_id
             WHERE u.role = 'student' AND bs.batch_id = $1 AND u.department = $2`,
            [activeBatchId, req.user.department]
          );
        }
      } else {
        if (panels.length > 0) {
          myStudents = await pool.query(
            "SELECT id, name, email, semester, department, panel, nri, red_flag, prn, undertaking_submitted FROM users WHERE role = 'student' AND panel = ANY($1)",
            [panels]
          );
        } else {
          myStudents = await pool.query(
            "SELECT id, name, email, semester, department, panel, nri, red_flag, prn, undertaking_submitted FROM users WHERE role = 'student' AND department = $1",
            [req.user.department]
          );
        }
      }
      myStudentsRows = myStudents.rows;
    }

    let batchFaculty = [];
    if (activeBatchId && squadName) {
      const batchFacultyRes = await pool.query(
        `SELECT u.id, u.name, u.email, u.department, u.school, u.panel, bf.squad
         FROM users u
         JOIN batch_faculty bf ON u.id = bf.faculty_id
         WHERE bf.batch_id = $1 AND bf.squad = $2`,
        [activeBatchId, squadName]
      );
      batchFaculty = batchFacultyRes.rows;
    }

    res.json({
      message: 'Welcome Faculty',
      data: withLtcId(myStudentsRows),
      facultyInfo,
      squadLeader,
      squadStudents: withLtcId(squadStudents),
      batchFaculty
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const toggleRedFlag = async (req, res) => {
  const { student_id } = req.body;
  try {
    const result = await pool.query(
      "UPDATE users SET red_flag = NOT COALESCE(red_flag, false) WHERE id = $1 RETURNING red_flag",
      [student_id]
    );
    res.json({ success: true, red_flag: result.rows[0].red_flag });
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle red flag', error: err.message });
  }
};

const createSchedule = async (req, res) => {
  const { title, date, time, panel } = req.body;
  try {
    const activeBatchRes = await pool.query(
      `SELECT bf.batch_id FROM batch_faculty bf
       JOIN batches b ON bf.batch_id = b.id
       WHERE bf.faculty_id = $1 AND (b.is_deleted = false OR b.is_deleted IS NULL)
       ORDER BY bf.batch_id DESC LIMIT 1`,
      [req.user.id]
    );
    const activeBatchId = activeBatchRes.rowCount > 0 ? activeBatchRes.rows[0].batch_id : null;

    await pool.query(
      "INSERT INTO schedules (batch_id, title, date, time, faculty_id, panel) VALUES ($1, $2, $3, $4, $5, $6)",
      [activeBatchId, title, date, time, req.user.id, panel]
    );
    res.json({ message: 'Schedule created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const check = await pool.query("SELECT * FROM schedules WHERE id = $1 AND faculty_id = $2", [id, req.user.id]);
    if (check.rowCount === 0) return res.status(403).json({ message: 'Unauthorized' });
    await pool.query("DELETE FROM attendance WHERE schedule_id = $1", [id]);
    await pool.query("DELETE FROM evaluations WHERE schedule_id = $1", [id]);
    await pool.query("DELETE FROM schedules WHERE id = $1", [id]);
    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const submitEvaluation = async (req, res) => {
  const { student_id, schedule_id, marks, remarks, report_url, photo_url, marking_scheme } = req.body;
  try {
    if (req.user.role === 'faculty') {
      const activeBatchRes = await pool.query(
        `SELECT bf.batch_id, bf.squad
         FROM batch_faculty bf
         JOIN batches b ON bf.batch_id = b.id
         WHERE bf.faculty_id = $1 AND (b.is_deleted = false OR b.is_deleted IS NULL)
         ORDER BY bf.batch_id DESC LIMIT 1`,
        [req.user.id]
      );
      
      let isAllowed = false;
      if (activeBatchRes.rowCount > 0) {
        const { batch_id, squad } = activeBatchRes.rows[0];
        if (squad) {
          const studentSquadCheck = await pool.query(
            `SELECT 1 FROM batch_students 
             WHERE student_id = $1 AND batch_id = $2 AND squad = $3`,
            [student_id, batch_id, squad]
          );
          if (studentSquadCheck.rowCount > 0) {
            isAllowed = true;
          }
        }
      }
      
      if (!isAllowed) {
        // Fallback checks (panel or department)
        const facultyUser = await pool.query(
          "SELECT department, panel FROM users WHERE id = $1",
          [req.user.id]
        );
        if (facultyUser.rowCount > 0) {
          const { department, panel } = facultyUser.rows[0];
          const panels = (panel || '').split(',').map(p => p.trim()).filter(Boolean);
          if (panels.length > 0) {
            const check = await pool.query(
              "SELECT 1 FROM users WHERE id = $1 AND role = 'student' AND panel = ANY($2)",
              [student_id, panels]
            );
            if (check.rowCount > 0) isAllowed = true;
          } else {
            const check = await pool.query(
              "SELECT 1 FROM users WHERE id = $1 AND role = 'student' AND department = $2",
              [student_id, department]
            );
            if (check.rowCount > 0) isAllowed = true;
          }
        }
      }
      
      if (!isAllowed) {
        return res.status(403).json({ message: 'Unauthorized: This student is not allocated to you.' });
      }
    }

    await pool.query(
      "INSERT INTO evaluations (student_id, faculty_id, schedule_id, marks, remarks, report_url, photo_url, marking_scheme) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [student_id, req.user.id, schedule_id, marks, remarks, report_url || null, photo_url || null, marking_scheme || null]
    );
    res.json({ message: 'Evaluation submitted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getEvaluations = async (req, res) => {
  try {
    let evals;
    if (req.user.role === 'admin') {
      evals = await pool.query("SELECT * FROM evaluations");
    } else {
      // Return evaluations only for schedules in the faculty's active batch
      const activeBatchRes = await pool.query(
        `SELECT bf.batch_id FROM batch_faculty bf
         JOIN batches b ON bf.batch_id = b.id
         WHERE bf.faculty_id = $1 AND (b.is_deleted = false OR b.is_deleted IS NULL)
         ORDER BY bf.batch_id DESC LIMIT 1`,
        [req.user.id]
      );
      if (activeBatchRes.rowCount > 0) {
        const batchId = activeBatchRes.rows[0].batch_id;
        evals = await pool.query(
          `SELECT ev.* FROM evaluations ev
           WHERE ev.faculty_id = $1
             AND (
               ev.schedule_id IN (SELECT id FROM schedules WHERE batch_id = $2)
               OR ev.schedule_id IS NULL
             )`,
          [req.user.id, batchId]
        );
      } else {
        evals = await pool.query("SELECT * FROM evaluations WHERE faculty_id = $1", [req.user.id]);
      }
    }
    res.json({ evaluations: evals.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getAttendanceRecords = async (req, res) => {
  try {
    let att;
    if (req.user.role === 'admin') {
      att = await pool.query("SELECT * FROM attendance");
    } else {
      // Return attendance records only for schedules in the faculty's active batch
      const activeBatchRes = await pool.query(
        `SELECT bf.batch_id, bf.squad FROM batch_faculty bf
         JOIN batches b ON bf.batch_id = b.id
         WHERE bf.faculty_id = $1 AND (b.is_deleted = false OR b.is_deleted IS NULL)
         ORDER BY bf.batch_id DESC LIMIT 1`,
        [req.user.id]
      );
      if (activeBatchRes.rowCount > 0) {
        const { batch_id, squad } = activeBatchRes.rows[0];
        att = await pool.query(
          `SELECT a.* FROM attendance a
           WHERE a.schedule_id IN (SELECT id FROM schedules WHERE batch_id = $1)
             AND a.student_id IN (
               SELECT student_id FROM batch_students
               WHERE batch_id = $1 AND ($2::text IS NULL OR squad = $2)
             )`,
          [batch_id, squad || null]
        );
      } else {
        // Fallback: any attendance for students the faculty has access to
        att = await pool.query(
          `SELECT a.* FROM attendance a
           WHERE a.student_id IN (
             SELECT bs.student_id FROM batch_students bs
             JOIN batch_faculty bf ON bs.batch_id = bf.batch_id AND bs.squad = bf.squad
             WHERE bf.faculty_id = $1
           )`,
          [req.user.id]
        );
      }
    }
    res.json({ records: att.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const markAttendance = async (req, res) => {
  const { schedule_id, student_id, status } = req.body;
  try {
    if (req.user.role === 'faculty') {
      const activeBatchRes = await pool.query(
        `SELECT bf.batch_id, bf.squad
         FROM batch_faculty bf
         JOIN batches b ON bf.batch_id = b.id
         WHERE bf.faculty_id = $1 AND (b.is_deleted = false OR b.is_deleted IS NULL)
         ORDER BY bf.batch_id DESC LIMIT 1`,
        [req.user.id]
      );
      
      let isAllowed = false;
      if (activeBatchRes.rowCount > 0) {
        const { batch_id, squad } = activeBatchRes.rows[0];
        if (squad) {
          const studentSquadCheck = await pool.query(
            `SELECT 1 FROM batch_students 
             WHERE student_id = $1 AND batch_id = $2 AND squad = $3`,
            [student_id, batch_id, squad]
          );
          if (studentSquadCheck.rowCount > 0) {
            isAllowed = true;
          }
        }
      }
      
      if (!isAllowed) {
        // Fallback checks (panel or department)
        const facultyUser = await pool.query(
          "SELECT department, panel FROM users WHERE id = $1",
          [req.user.id]
        );
        if (facultyUser.rowCount > 0) {
          const { department, panel } = facultyUser.rows[0];
          const panels = (panel || '').split(',').map(p => p.trim()).filter(Boolean);
          if (panels.length > 0) {
            const check = await pool.query(
              "SELECT 1 FROM users WHERE id = $1 AND role = 'student' AND panel = ANY($2)",
              [student_id, panels]
            );
            if (check.rowCount > 0) isAllowed = true;
          } else {
            const check = await pool.query(
              "SELECT 1 FROM users WHERE id = $1 AND role = 'student' AND department = $2",
              [student_id, department]
            );
            if (check.rowCount > 0) isAllowed = true;
          }
        }
      }
      
      if (!isAllowed) {
        return res.status(403).json({ message: 'Unauthorized: This student is not allocated to you.' });
      }
    }

    const exist = await pool.query(
      "SELECT id FROM attendance WHERE schedule_id = $1 AND student_id = $2",
      [schedule_id, student_id]
    );
    if (exist.rowCount > 0) {
      await pool.query(
        "UPDATE attendance SET status = $1 WHERE schedule_id = $2 AND student_id = $3",
        [status, schedule_id, student_id]
      );
    } else {
      await pool.query(
        "INSERT INTO attendance (schedule_id, student_id, status) VALUES ($1, $2, $3)",
        [schedule_id, student_id, status]
      );
    }
    res.json({ message: 'Attendance marked' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const assignPanel = async (req, res) => {
  const { student_id, panel } = req.body;
  try {
    await pool.query("UPDATE users SET panel = $1 WHERE id = $2 AND role = 'student'", [panel, student_id]);
    res.json({ message: 'Panel updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  submitUndertaking,
  getDashboard,
  toggleRedFlag,
  createSchedule,
  deleteSchedule,
  submitEvaluation,
  getEvaluations,
  getAttendanceRecords,
  markAttendance,
  assignPanel,
};

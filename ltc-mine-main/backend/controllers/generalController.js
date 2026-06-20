const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const verifyBarcode = async (req, res) => {
  const { barcode } = req.query;
  try {
    const user = await pool.query(
      "SELECT id, name, email, department, squad, room, barcode FROM users WHERE barcode = $1",
      [barcode]
    );
    if (user.rowCount === 0) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const uploadDocument = async (req, res) => {
  const { name, url, target_role } = req.body;
  try {
    const doc = await pool.query(
      "INSERT INTO documents (name, url, uploaded_by, target_role) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, url, req.user.id, target_role]
    );
    res.json({ message: 'Document uploaded', document: doc.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    await pool.query("DELETE FROM documents WHERE id = $1", [req.params.id]);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getDocuments = async (req, res) => {
  try {
    let docs;
    if (req.user.role === 'admin') {
      docs = await pool.query("SELECT * FROM documents ORDER BY id DESC");
    } else {
      docs = await pool.query(
        "SELECT * FROM documents WHERE target_role = $1 OR target_role = 'all' ORDER BY id DESC",
        [req.user.role]
      );
    }
    res.json({ documents: docs.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getSchedules = async (req, res) => {
  try {
    let activeBatchId = null;

    if (req.user.role === 'faculty') {
      const activeBatchRes = await pool.query(
        `SELECT bf.batch_id FROM batch_faculty bf
         JOIN batches b ON bf.batch_id = b.id
         WHERE bf.faculty_id = $1 AND (b.is_deleted = false OR b.is_deleted IS NULL)
         ORDER BY bf.batch_id DESC LIMIT 1`,
        [req.user.id]
      );
      if (activeBatchRes.rowCount > 0) activeBatchId = activeBatchRes.rows[0].batch_id;

    } else if (req.user.role === 'student') {
      const activeBatchRes = await pool.query(
        `SELECT bs.batch_id FROM batch_students bs
         JOIN batches b ON bs.batch_id = b.id
         WHERE bs.student_id = $1 AND (b.is_deleted = false OR b.is_deleted IS NULL)
         ORDER BY bs.batch_id DESC LIMIT 1`,
        [req.user.id]
      );
      if (activeBatchRes.rowCount > 0) activeBatchId = activeBatchRes.rows[0].batch_id;

    } else if (req.user.role === 'admin') {
      const { batchId } = req.query;
      if (batchId) activeBatchId = parseInt(batchId);
    }

    let query;
    if (req.user.role === 'admin') {
      if (activeBatchId) {
        query = await pool.query(
          "SELECT * FROM schedules WHERE batch_id = $1 ORDER BY date ASC, time ASC",
          [activeBatchId]
        );
      } else {
        query = await pool.query("SELECT * FROM schedules ORDER BY id ASC");
      }

    } else if (req.user.role === 'faculty') {
      if (activeBatchId) {
        query = await pool.query(
          `SELECT * FROM schedules
           WHERE batch_id = $1
           ORDER BY date ASC, time ASC`,
          [activeBatchId]
        );
      } else {
        query = await pool.query(
          `SELECT * FROM schedules
           WHERE (batch_id IS NULL) AND (faculty_id = $1 OR panel = 'ALL')
           ORDER BY id ASC`,
          [req.user.id]
        );
      }

    } else {
      // Student
      if (activeBatchId) {
        query = await pool.query(
          `SELECT * FROM schedules
           WHERE batch_id = $1 AND (panel = 'ALL' OR panel = $2)
           ORDER BY id ASC`,
          [activeBatchId, req.user.panel || 'Unassigned']
        );
      } else {
        query = await pool.query(
          `SELECT * FROM schedules
           WHERE (batch_id IS NULL) AND (panel = 'ALL' OR panel = $1)
           ORDER BY id ASC`,
          [req.user.panel || 'Unassigned']
        );
      }
    }
    res.json({ schedules: query.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.department, u.semester, u.division, u.school, u.panel, u.is_primary,
              (CASE 
                WHEN u.role = 'student' THEN (
                  SELECT bs.squad FROM batch_students bs
                  JOIN batches b ON bs.batch_id = b.id
                  WHERE bs.student_id = u.id AND (b.is_deleted = false OR b.is_deleted IS NULL)
                  ORDER BY bs.batch_id DESC LIMIT 1
                )
                WHEN u.role = 'faculty' THEN (
                  SELECT bf.squad FROM batch_faculty bf
                  JOIN batches b ON bf.batch_id = b.id
                  WHERE bf.faculty_id = u.id AND (b.is_deleted = false OR b.is_deleted IS NULL)
                  ORDER BY bf.batch_id DESC LIMIT 1
                )
                ELSE NULL
              END) as batch_squad,
              u.squad
       FROM users u
       WHERE u.id = $1`,
      [req.user.id]
    );
    const userObj = user.rows[0];
    if (userObj) {
      userObj.squad = userObj.batch_squad || userObj.squad || null;
      delete userObj.batch_squad;
    }
    res.json({ user: userObj });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateProfile = async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;
  try {
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    const user = userResult.rows[0];
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: 'Current password is required.' });
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Incorrect current password.' });
      const hashedNew = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE users SET name = $1, password = $2 WHERE id = $3", [name || user.name, hashedNew, req.user.id]);
    } else {
      await pool.query("UPDATE users SET name = $1 WHERE id = $2", [name || user.name, req.user.id]);
    }
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const submitFeedback = async (req, res) => {
  const { feedback_text, category, additional_notes } = req.body;
  try {
    await pool.query(
      "INSERT INTO feedback (user_id, role, feedback_text, category, additional_notes) VALUES ($1, $2, $3, $4, $5)",
      [req.user.id, req.user.role, feedback_text, category || 'General', additional_notes || null]
    );
    res.json({ message: 'Feedback submitted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  verifyBarcode,
  uploadDocument,
  deleteDocument,
  getDocuments,
  getSchedules,
  getProfile,
  updateProfile,
  submitFeedback,
};

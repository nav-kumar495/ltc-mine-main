const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'secret123';

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userQuery = await pool.query(
      `SELECT u.*, 
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
              END) as batch_squad
       FROM users u
       WHERE u.email = $1`,
      [email]
    );
    if (userQuery.rowCount === 0) return res.status(400).json({ message: 'User not found' });
    const user = userQuery.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign(
      { id: user.id, role: user.role, department: user.department, panel: user.panel },
      SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      token,
      user: {
        id: user.id, email: user.email, role: user.role, name: user.name,
        department: user.department, panel: user.panel, division: user.division,
        school: user.school, squad: user.batch_squad || user.squad || null,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  login,
};

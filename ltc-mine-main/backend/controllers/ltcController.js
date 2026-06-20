const pool = require('../config/db');

const getDashboard = async (req, res) => {
  try {
    const statsRes = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE role = 'student') AS total_students,
        COUNT(DISTINCT squad) FILTER (WHERE role = 'student' AND squad IS NOT NULL) AS total_squads,
        COUNT(DISTINCT room) FILTER (WHERE role = 'student' AND room IS NOT NULL) AS total_rooms,
        COUNT(*) FILTER (WHERE role = 'student' AND nri = true) AS nri_count,
        COUNT(*) FILTER (WHERE role = 'student' AND red_flag = true) AS red_flag_count
      FROM users
    `);
    const s = statsRes.rows[0];
    const studentsRes = await pool.query(
      "SELECT id, name, email, semester, department, division, school, panel, squad, room, barcode, nri, red_flag, is_squad_leader, phone, prn, gender FROM users WHERE role = 'student' ORDER BY id ASC"
    );
    const docRes = await pool.query("SELECT * FROM documents WHERE target_role = 'all' OR target_role = 'faculty'");
    const squadLeadersRes = await pool.query("SELECT * FROM squad_leaders");
    res.json({
      stats: {
        totalStudents: parseInt(s.total_students),
        totalSquads: parseInt(s.total_squads),
        totalRooms: parseInt(s.total_rooms),
        nriCount: parseInt(s.nri_count),
        redFlagCount: parseInt(s.red_flag_count),
      },
      students: studentsRes.rows,
      documents: docRes.rows,
      squadLeaders: squadLeadersRes.rows,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateSquadLeader = async (req, res) => {
  const { squadName, name, email, prn, phone } = req.body;
  try {
    if (!squadName) return res.status(400).json({ message: 'Squad name is required.' });
    await pool.query(
      `INSERT INTO squad_leaders (squad_name, name, email, prn, phone)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (squad_name) DO UPDATE SET name=EXCLUDED.name, email=EXCLUDED.email, prn=EXCLUDED.prn, phone=EXCLUDED.phone`,
      [squadName, name || '', email || '', prn || '', phone || '']
    );
    res.json({ message: 'Squad leader updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  getDashboard,
  updateSquadLeader,
};

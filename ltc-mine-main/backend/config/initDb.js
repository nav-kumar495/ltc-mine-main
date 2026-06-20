const bcrypt = require('bcryptjs');

const seedImmersionSchedulesForBatch = async (pool, batchId) => {
  const activities = [
    { title: "Day 1: Room Allotment & Bag Check", date: "Day 1", time: "02:00 PM", panel: "ALL" },
    { title: "Day 1: Orientation & Program Welcome", date: "Day 1", time: "07:00 PM", panel: "ALL" },
    { title: "Day 2: Yoga & Physical Drills", date: "Day 2", time: "06:00 AM", panel: "ALL" },
    { title: "Day 2: Agriculture & Team Building (G1/G2 Swap)", date: "Day 2", time: "10:00 AM", panel: "ALL" },
    { title: "Day 3: Yoga & Physical Drills", date: "Day 3", time: "06:00 AM", panel: "ALL" },
    { title: "Day 3: Pillar Quiz Competition", date: "Day 3", time: "03:00 PM", panel: "ALL" },
    { title: "Day 4: Yoga & Obstacle Competition", date: "Day 4", time: "06:00 AM", panel: "ALL" },
    { title: "Day 4: Debate & Cultural Program Night", date: "Day 4", time: "03:00 PM", panel: "ALL" },
    { title: "Day 5: Patriotism Obstacles Competition", date: "Day 5", time: "08:00 AM", panel: "ALL" },
    { title: "Day 5: Certificate Awarding & Departure", date: "Day 5", time: "11:00 AM", panel: "ALL" }
  ];
  try {
    for (const act of activities) {
      await pool.query(
        "INSERT INTO schedules (batch_id, title, date, time, panel) VALUES ($1, $2, $3, $4, $5)",
        [batchId, act.title, act.date, act.time, act.panel]
      );
    }
    console.log(`Immersion schedule seeding complete for batch ${batchId}.`);
  } catch (err) {
    console.error(`Failed to seed immersion schedules for batch ${batchId}:`, err);
  }
};

const seedImmersionSchedules = async (pool) => {
  const activities = [
    { title: "Day 1: Room Allotment & Bag Check", date: "Day 1", time: "02:00 PM", panel: "ALL" },
    { title: "Day 1: Orientation & Program Welcome", date: "Day 1", time: "07:00 PM", panel: "ALL" },
    { title: "Day 2: Yoga & Physical Drills", date: "Day 2", time: "06:00 AM", panel: "ALL" },
    { title: "Day 2: Agriculture & Team Building (G1/G2 Swap)", date: "Day 2", time: "10:00 AM", panel: "ALL" },
    { title: "Day 3: Yoga & Physical Drills", date: "Day 3", time: "06:00 AM", panel: "ALL" },
    { title: "Day 3: Pillar Quiz Competition", date: "Day 3", time: "03:00 PM", panel: "ALL" },
    { title: "Day 4: Yoga & Obstacle Competition", date: "Day 4", time: "06:00 AM", panel: "ALL" },
    { title: "Day 4: Debate & Cultural Program Night", date: "Day 4", time: "03:00 PM", panel: "ALL" },
    { title: "Day 5: Patriotism Obstacles Competition", date: "Day 5", time: "08:00 AM", panel: "ALL" },
    { title: "Day 5: Certificate Awarding & Departure", date: "Day 5", time: "11:00 AM", panel: "ALL" }
  ];

  const oldTitles = [
    "Day 1 AM: Registration and Squad Allocation",
    "Day 1 PM: Orientation and Team Alignment",
    "Day 2 AM: Governance and Policy Seminar",
    "Day 2 PM: Policy Design Thinking Sprint",
    "Day 3 AM: Industrial Operations Tour",
    "Day 3 PM: Technology Leadership Summit",
    "Day 4 AM: Heritage Tour and Regional Growth Models",
    "Day 4 PM: Socio-Cultural Economics Analysis",
    "Day 5 AM: Capstone Draft Peer Reviews",
    "Day 5 PM: Sustainable Development Lecture",
    "Day 6 AM: Capstone Dry-Runs and Rehearsals",
    "Day 6 PM: Crisis Simulation Workshop",
    "Day 7 AM: Final Capstone Presentations",
    "Day 7 PM: Valedictory Ceremony and Departure"
  ];

  try {
    const schedulesRes = await pool.query("SELECT DISTINCT batch_id FROM schedules WHERE batch_id IS NOT NULL");
    const activeBatches = schedulesRes.rows.map(r => r.batch_id);

    const allBatchesRes = await pool.query("SELECT id FROM batches WHERE is_deleted IS NOT TRUE");
    const allBatches = allBatchesRes.rows.map(r => r.id);

    // 1. Purge legacy schedules and dependents
    const oldScheds = await pool.query("SELECT id FROM schedules WHERE title = ANY($1)", [oldTitles]);
    if (oldScheds.rowCount > 0) {
      const oldIds = oldScheds.rows.map(s => s.id);
      await pool.query("DELETE FROM attendance WHERE schedule_id = ANY($1)", [oldIds]);
      await pool.query("DELETE FROM evaluations WHERE schedule_id = ANY($1)", [oldIds]);
      await pool.query("DELETE FROM schedules WHERE id = ANY($1)", [oldIds]);
      console.log(`Purged ${oldIds.length} legacy schedule references.`);
    }

    // 2. Add new 5-day schedules to batches lacking them
    for (const bId of allBatches) {
      const checkRes = await pool.query(
        "SELECT 1 FROM schedules WHERE batch_id = $1 AND title = ANY($2)",
        [bId, activities.map(a => a.title)]
      );
      if (checkRes.rowCount === 0) {
        console.log(`Batch ${bId} lacks 5-day schedules. Seeding...`);
        await seedImmersionSchedulesForBatch(pool, bId);
      }
    }
  } catch (err) {
    console.error("Failed to seed 5-day immersion schedules:", err);
  }
};

const initDB = async (pool) => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        department VARCHAR(100),
        semester VARCHAR(50),
        division VARCHAR(100),
        school VARCHAR(100),
        panel VARCHAR(50),
        is_primary BOOLEAN DEFAULT false,
        prn VARCHAR(100) UNIQUE,
        faculty_id VARCHAR(100) UNIQUE,
        phone VARCHAR(20),
        dob VARCHAR(50),
        gender VARCHAR(20),
        program VARCHAR(100),
        year VARCHAR(20),
        designation VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        nri BOOLEAN DEFAULT false,
        red_flag BOOLEAN DEFAULT false,
        squad VARCHAR(50),
        room VARCHAR(50),
        barcode VARCHAR(255),
        in_current_batch BOOLEAN DEFAULT false
      );
    `);

    // Legacy columns (for backward compat)
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS in_current_batch BOOLEAN DEFAULT false;");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS undertaking_submitted BOOLEAN DEFAULT false;");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS undertaking_signed_name VARCHAR(255);");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS undertaking_signed_date VARCHAR(50);");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_squad_leader BOOLEAN DEFAULT false;");

    // ── Batches table ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS batches (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        start_date DATE,
        end_date DATE,
        status VARCHAR(50) DEFAULT 'upcoming',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Enterprise upgrade: new batch columns (additive, safe)
    await pool.query("ALTER TABLE batches ADD COLUMN IF NOT EXISTS batch_code VARCHAR(50);");
    await pool.query("ALTER TABLE batches ADD COLUMN IF NOT EXISTS year VARCHAR(10);");
    await pool.query("ALTER TABLE batches ADD COLUMN IF NOT EXISTS capacity INT;");
    await pool.query("ALTER TABLE batches ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;");

    // ── Batch-Student relationship ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS batch_students (
        batch_id INT REFERENCES batches(id) ON DELETE CASCADE,
        student_id INT REFERENCES users(id) ON DELETE CASCADE,
        squad VARCHAR(50),
        room VARCHAR(50),
        barcode VARCHAR(255),
        is_squad_leader BOOLEAN DEFAULT false,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (batch_id, student_id)
      );
    `);

    // ── Batch-Faculty relationship ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS batch_faculty (
        batch_id INT REFERENCES batches(id) ON DELETE CASCADE,
        faculty_id INT REFERENCES users(id) ON DELETE CASCADE,
        squad VARCHAR(50),
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (batch_id, faculty_id)
      );
    `);

    // Schedules
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        batch_id INT REFERENCES batches(id) ON DELETE CASCADE,
        title VARCHAR(255),
        date VARCHAR(50),
        time VARCHAR(50),
        faculty_id INT,
        panel VARCHAR(50)
      );
    `);
    await pool.query("ALTER TABLE schedules ADD COLUMN IF NOT EXISTS batch_id INT REFERENCES batches(id) ON DELETE CASCADE;");

    // Squad leaders
    await pool.query(`
      CREATE TABLE IF NOT EXISTS squad_leaders (
        squad_name VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        prn VARCHAR(255),
        phone VARCHAR(255)
      );
    `);

    // Legacy attendance (keep for backward compat)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        schedule_id INT,
        student_id INT,
        status VARCHAR(50)
      );
    `);

    // ── NEW: Attendance sessions (batch-level, ready architecture) ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_sessions (
        id SERIAL PRIMARY KEY,
        batch_id INT REFERENCES batches(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        session_date DATE,
        session_type VARCHAR(50) DEFAULT 'general',
        created_by INT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ── NEW: Attendance records v2 (batch-level) ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_records_v2 (
        id SERIAL PRIMARY KEY,
        session_id INT REFERENCES attendance_sessions(id) ON DELETE CASCADE,
        student_id INT REFERENCES users(id) ON DELETE CASCADE,
        batch_id INT REFERENCES batches(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'absent',
        marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(session_id, student_id)
      );
    `);

    // Evaluations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS evaluations (
        id SERIAL PRIMARY KEY,
        student_id INT,
        faculty_id INT,
        schedule_id INT,
        marks INT,
        remarks TEXT,
        report_url TEXT,
        photo_url TEXT,
        marking_scheme VARCHAR(50)
      );
    `);

    // Documents
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        url TEXT,
        uploaded_by INT,
        target_role VARCHAR(50),
        batch_id INT
      );
    `);
    await pool.query("ALTER TABLE documents ADD COLUMN IF NOT EXISTS batch_id INT;");

    // Insurance
    await pool.query(`
      CREATE TABLE IF NOT EXISTS insurance (
        id SERIAL PRIMARY KEY,
        prn VARCHAR(100) UNIQUE,
        policy_number VARCHAR(255),
        provider VARCHAR(255)
      );
    `);

    // Feedback
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        user_id INT,
        role VARCHAR(50),
        feedback_text TEXT,
        category VARCHAR(100),
        additional_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // System settings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) PRIMARY KEY,
        value VARCHAR(255)
      );
    `);

    await pool.query(`
      INSERT INTO system_settings (key, value)
      VALUES ('squads_locked', 'false')
      ON CONFLICT (key) DO NOTHING;
    `);

    // ── NEW: Audit Logs ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INT,
        user_name VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INT,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ── NEW: Certificates (ready architecture) ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        student_id INT REFERENCES users(id) ON DELETE CASCADE,
        batch_id INT REFERENCES batches(id) ON DELETE CASCADE,
        type VARCHAR(50) DEFAULT 'completion',
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data JSONB,
        UNIQUE(student_id, batch_id, type)
      );
    `);

    // ── NEW: Completion Reports (ready architecture) ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS completion_reports (
        id SERIAL PRIMARY KEY,
        batch_id INT REFERENCES batches(id) ON DELETE CASCADE,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        generated_by INT REFERENCES users(id),
        data JSONB
      );
    `);

    // ── NEW: Upload Jobs table for background processing ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS upload_jobs (
        id SERIAL PRIMARY KEY,
        batch_id INT REFERENCES batches(id) ON DELETE SET NULL,
        filename VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        total_records INT DEFAULT 0,
        processed_records INT DEFAULT 0,
        success_count INT DEFAULT 0,
        failed_count INT DEFAULT 0,
        errors JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ── Performance Indexes ──
    await pool.query("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_users_prn ON users(prn);");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_users_in_batch ON users(in_current_batch);");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_batch_students_batch ON batch_students(batch_id);");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_batch_students_student ON batch_students(student_id);");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_batch_students_squad ON batch_students(squad);");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_batch_faculty_batch ON batch_faculty(batch_id);");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(created_at);");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_attendance_sessions_batch ON attendance_sessions(batch_id);");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_attendance_records_v2_session ON attendance_records_v2(session_id);");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_attendance_records_v2_batch ON attendance_records_v2(batch_id);");

    // Additional indexes for bulk upload scaling
    await pool.query("CREATE INDEX IF NOT EXISTS idx_users_faculty_id ON users(faculty_id);");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_batch_faculty_faculty ON batch_faculty(faculty_id);");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_upload_jobs_status ON upload_jobs(status);");

    // Super Admin
    const adminQuery = await pool.query("SELECT * FROM users WHERE role = 'admin'");
    if (adminQuery.rowCount === 0) {
      const hashedPassword = await bcrypt.hash('123', 10);
      await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
        ['Super Admin', 'admin@ltc.edu', hashedPassword, 'admin']
      );
      console.log('Super Admin initialized: admin@ltc.edu (123)');
    } else {
      console.log('PostgreSQL database ready. Super Admin already exists.');
    }

    // Seed 5-day immersion schedules
    await seedImmersionSchedules(pool);
  } catch (err) {
    console.error('Database Initialization Error:', err);
  }
};

module.exports = {
  initDB,
  seedImmersionSchedulesForBatch,
};

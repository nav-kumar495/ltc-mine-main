const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const pool = require('./config/db');
const { initDB } = require('./config/initDb');
const { setupMailer } = require('./config/mailer');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ltcRoutes = require('./routes/ltcRoutes');
const userRoutes = require('./routes/userRoutes');
const generalRoutes = require('./routes/generalRoutes');

const app = express();
const allowedOrigins = [
  "https://ltc-deploy-final.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
};

// HTTP security headers
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Global parsing limits (specific bulk-upload routes override these at the router level)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Mount MVC routers
app.use('/api', authRoutes); // /api/login
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ltc', ltcRoutes);
app.use('/api/users', userRoutes);
app.use('/api', generalRoutes); // /api/verify, /api/documents, etc.

const PORT = process.env.PORT || 5001;

// Setup database & mailer, then start listening
const startServer = async () => {
  await initDB(pool);
  await setupMailer();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

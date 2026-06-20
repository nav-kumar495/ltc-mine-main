const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/auth');

router.get('/dashboard', authMiddleware(['student']), studentController.getDashboard);
router.get('/schedules', authMiddleware(['student']), studentController.getSchedules);
router.get('/attendance', authMiddleware(['student']), studentController.getAttendance);
router.get('/evaluations', authMiddleware(['student']), studentController.getEvaluations);
router.post('/submit-insurance', authMiddleware(['student']), studentController.submitInsurance);
router.post('/submit-undertaking', authMiddleware(['student']), studentController.submitUndertaking);

module.exports = router;

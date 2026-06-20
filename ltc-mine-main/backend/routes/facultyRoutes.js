const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const authMiddleware = require('../middleware/auth');

router.post('/submit-undertaking', authMiddleware(['faculty']), facultyController.submitUndertaking);
router.get('/dashboard', authMiddleware(['faculty']), facultyController.getDashboard);
router.post('/toggle-red-flag', authMiddleware(['faculty']), facultyController.toggleRedFlag);
router.post('/schedule', authMiddleware(['faculty']), facultyController.createSchedule);
router.delete('/schedule/:id', authMiddleware(['faculty']), facultyController.deleteSchedule);
router.post('/evaluate', authMiddleware(['admin', 'faculty']), facultyController.submitEvaluation);
router.get('/evaluations', authMiddleware(['admin', 'faculty']), facultyController.getEvaluations);
router.get('/attendance_records', authMiddleware(['admin', 'faculty']), facultyController.getAttendanceRecords);
router.post('/attendance', authMiddleware(['admin', 'faculty']), facultyController.markAttendance);
router.put('/assign-panel', authMiddleware(['faculty']), facultyController.assignPanel);

module.exports = router;

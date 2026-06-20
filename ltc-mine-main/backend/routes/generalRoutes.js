const express = require('express');
const router = express.Router();
const generalController = require('../controllers/generalController');
const authMiddleware = require('../middleware/auth');

router.get('/verify', generalController.verifyBarcode);
router.post('/documents', authMiddleware(['admin', 'faculty']), generalController.uploadDocument);
router.delete('/documents/:id', authMiddleware(['admin']), generalController.deleteDocument);
router.get('/documents', authMiddleware(), generalController.getDocuments);
router.get('/schedules', authMiddleware(), generalController.getSchedules);
router.get('/me', authMiddleware(), generalController.getProfile);
router.put('/me', authMiddleware(), generalController.updateProfile);
router.post('/feedback', authMiddleware(['student', 'faculty', 'ltc_member']), generalController.submitFeedback);

module.exports = router;

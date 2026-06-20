const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

// Faculty & Student master records
router.post('/faculty', authMiddleware(['admin']), adminController.createFaculty);
router.get('/students', authMiddleware(['admin']), adminController.getStudents);
router.get('/faculty-list', authMiddleware(['admin']), adminController.getFacultyList);
router.get('/filter-options', authMiddleware(['admin']), adminController.getFilterOptions);

// Batches
router.get('/batches', authMiddleware(['admin']), adminController.getBatches);
router.post('/batches', authMiddleware(['admin']), adminController.createBatch);
router.put('/batches/:id', authMiddleware(['admin']), adminController.updateBatch);
router.delete('/batches/:id', authMiddleware(['admin']), adminController.deleteBatch);
router.post('/batches/:id/restore', authMiddleware(['admin']), adminController.restoreBatch);
router.get('/batches/:id', authMiddleware(['admin']), adminController.getBatchDetails);

// Batch-Students
router.get('/batches/:id/students', authMiddleware(['admin']), adminController.getBatchStudents);
router.post('/batches/:id/students', authMiddleware(['admin']), adminController.addBatchStudents);
router.delete('/batches/:id/students/:studentId', authMiddleware(['admin']), adminController.removeBatchStudent);
router.post('/batches/:id/students/add-one', authMiddleware(['admin']), adminController.addOneBatchStudent);

// Batch-Faculty
router.get('/batches/:id/faculty', authMiddleware(['admin']), adminController.getBatchFaculty);
router.post('/batches/:id/faculty', authMiddleware(['admin']), adminController.addBatchFaculty);
router.delete('/batches/:id/faculty/:facultyId', authMiddleware(['admin']), adminController.removeBatchFaculty);

// Bulk upload and enrollment inside a batch
router.post('/batches/:id/bulk-upload', express.json({ limit: '50mb' }), authMiddleware(['admin']), adminController.batchBulkUpload);
router.post('/batches/:id/enroll-existing', express.json({ limit: '10mb' }), authMiddleware(['admin']), adminController.enrollExistingBatchUsers);

// Squad management inside a batch
router.get('/batches/:id/squads', authMiddleware(['admin']), adminController.getBatchSquads);
router.post('/batches/:id/auto-allocate-squads', authMiddleware(['admin']), adminController.autoAllocateBatchSquads);
router.put('/batches/:id/student-squad', authMiddleware(['admin']), adminController.updateBatchStudentSquad);
router.post('/batches/:id/lock-squads', authMiddleware(['admin']), adminController.lockBatchSquads);
router.post('/batches/:id/notify-squads', authMiddleware(['admin']), adminController.notifyBatchSquads);

// Dashboard and generic admin actions
router.get('/dashboard', authMiddleware(['admin']), adminController.getDashboard);
router.get('/users', authMiddleware(['admin']), adminController.getUsers);
router.put('/update-panel', authMiddleware(['admin']), adminController.updatePanel);
router.put('/update-division', authMiddleware(['admin']), adminController.updateDivision);
router.put('/insurance', authMiddleware(['admin']), adminController.updateInsurance);
router.post('/bulk-upload/validate', authMiddleware(['admin']), adminController.validateBulkUpload);
router.post('/bulk-upload', express.json({ limit: '50mb' }), authMiddleware(['admin']), adminController.globalBulkUpload);
router.get('/upload-jobs/:jobId', authMiddleware(['admin']), adminController.getUploadJobStatus);
router.post('/auto-allocate', authMiddleware(['admin']), adminController.autoAllocateRoomsSquads);
router.post('/bulk-insurance', authMiddleware(['admin']), adminController.bulkInsurance);
router.post('/insurance-bulk-upload', authMiddleware(['admin']), adminController.bulkInsurance);
router.get('/user-by-barcode', authMiddleware(['admin', 'faculty', 'ltc_member']), adminController.getUserByBarcode);
router.get('/feedback', authMiddleware(['admin']), adminController.getFeedback);
router.get('/audit-logs', authMiddleware(['admin']), adminController.getAuditLogs);
router.delete('/users/:id', authMiddleware(['admin']), adminController.deleteUser);
router.post('/reset-database', authMiddleware(['admin']), adminController.resetDatabase);

// Current active batch (legacy/global)
router.get('/current-batch', authMiddleware(['admin']), adminController.getCurrentBatch);
router.post('/set-current-batch', authMiddleware(['admin']), adminController.setCurrentBatch);
router.put('/toggle-student-batch', authMiddleware(['admin']), adminController.toggleStudentBatch);
router.post('/clear-current-batch', authMiddleware(['admin']), adminController.clearCurrentBatch);
router.get('/squad-allocation-state', authMiddleware(['admin']), adminController.getSquadAllocationState);
router.post('/lock-squads', authMiddleware(['admin']), adminController.lockSquads);
router.post('/unlock-squads', authMiddleware(['admin']), adminController.unlockSquads);
router.post('/shuffle-squads', authMiddleware(['admin']), adminController.shuffleSquads);

module.exports = router;

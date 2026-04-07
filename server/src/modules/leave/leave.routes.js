const express = require('express');
const router = express.Router();
const leaveController = require('./leave.controller');

router.post('/', leaveController.submitLeave);
router.get('/', leaveController.getAllLeaves);
router.get('/student/:studentId', leaveController.getLeavesByStudent);
router.get('/:leaveId', leaveController.getLeave);
router.patch('/:leaveId/status', leaveController.patchLeaveStatus);

module.exports = router;

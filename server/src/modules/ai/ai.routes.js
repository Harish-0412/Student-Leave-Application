const express = require('express');
const router = express.Router();
const aiController = require('./ai.controller');

router.get('/health', aiController.getStatus);
router.post('/study-plan', aiController.generatePlan);
router.post('/reschedule-review', aiController.reviewReschedule);
router.post('/leave-letter', aiController.generateLeaveLetter);
router.post('/leave-letter/refine', aiController.refineLeaveLetter);
router.post('/chat', aiController.chat);

module.exports = router;

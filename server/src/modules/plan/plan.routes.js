const express = require('express');
const router = express.Router();
const planController = require('./plan.controller');

router.get('/:studentId', planController.getPlan);
router.post('/:studentId', planController.updatePlan);

module.exports = router;

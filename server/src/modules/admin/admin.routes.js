const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');

router.get('/students', adminController.getStudents);

module.exports = router;
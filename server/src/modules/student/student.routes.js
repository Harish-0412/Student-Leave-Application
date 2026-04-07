const express = require('express');
const router = express.Router();
const studentController = require('./student.controller');

router.get('/:id', studentController.getStudent);
router.post('/', studentController.createStudent);

module.exports = router;
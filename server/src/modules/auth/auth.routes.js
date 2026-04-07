const express = require('express');
const firebaseAuth = require('../../shared/middleware/firebase-auth');
const authController = require('./auth.controller');

const router = express.Router();

router.post('/register-profile', firebaseAuth, authController.registerProfile);
router.post('/session', firebaseAuth, authController.getSession);
router.patch('/profile', firebaseAuth, authController.updateProfile);
router.post('/activity', firebaseAuth, authController.recordActivity);
router.get('/activities', firebaseAuth, authController.listActivities);

module.exports = router;

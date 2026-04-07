const express = require('express');
const cors = require('cors');
const app = express();
const { CLIENT_ORIGIN } = require('./config/env');

app.use(express.json());
app.use(
  cors({
    origin: CLIENT_ORIGIN,
  }),
);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'student-leave-platform-api',
  });
});

app.use('/api/student', require('./modules/student/student.routes'));
app.use('/api/plan', require('./modules/plan/plan.routes'));
app.use('/api/leave', require('./modules/leave/leave.routes'));
app.use('/api/admin', require('./modules/admin/admin.routes'));
app.use('/api/ai', require('./modules/ai/ai.routes'));

app.use((error, _req, res, _next) => {
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
  });
});

module.exports = app;

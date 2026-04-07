const validateLeaveData = (req, res, next) => {
  const { studentId, reason, startDate, endDate } = req.body;
  if (!studentId || !reason || !startDate || !endDate) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  next();
};

module.exports = {
  validateLeaveData,
};
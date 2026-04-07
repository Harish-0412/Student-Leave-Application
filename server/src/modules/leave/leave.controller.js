const leaveService = require('./leave.service');

const submitLeave = async (req, res) => {
  try {
    const leave = await leaveService.submitLeave(req.body);
    res.status(201).json(leave);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

const getLeavesByStudent = async (req, res) => {
  try {
    const leaves = await leaveService.getLeavesByStudentId(req.params.studentId);
    res.json(leaves);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

const getLeave = async (req, res) => {
  try {
    const leave = await leaveService.getLeaveById(req.params.leaveId);
    if (!leave) {
      return res.status(404).json({ error: 'Leave application not found.' });
    }
    res.json({ data: leave });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

const getAllLeaves = async (_req, res) => {
  try {
    const leaves = await leaveService.getAllLeaves();
    res.json(leaves);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

const patchLeaveStatus = async (req, res) => {
  try {
    const leave = await leaveService.updateLeaveStatus(
      req.params.leaveId,
      req.body.status,
    );
    res.json(leave);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

module.exports = {
  submitLeave,
  getLeavesByStudent,
  getLeave,
  getAllLeaves,
  patchLeaveStatus,
};

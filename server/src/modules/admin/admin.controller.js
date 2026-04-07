const adminService = require('./admin.service');

const getStudents = async (req, res) => {
  try {
    const students = await adminService.getAllStudents();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getStudents,
};
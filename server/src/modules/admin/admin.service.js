const studentRepository = require('../student/student.repository');

const getAllStudents = async () => {
  // Assuming studentRepository has a method to get all
  return await studentRepository.findAll();
};

module.exports = {
  getAllStudents,
};
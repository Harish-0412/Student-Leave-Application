const studentRepository = require('./student.repository');

const getStudentById = async (id) => {
  return await studentRepository.findById(id);
};

const createStudent = async (data) => {
  return await studentRepository.create(data);
};

module.exports = {
  getStudentById,
  createStudent,
};
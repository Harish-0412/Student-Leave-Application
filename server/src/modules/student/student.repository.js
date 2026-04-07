const path = require('path');
const { generateId } = require('../../shared/utils/ids');
const { readJsonFile, writeJsonFile } = require('../../shared/utils/file-db');

const STUDENTS_FILE = path.join(__dirname, '../../data/students.json');

const readStudents = () => readJsonFile(STUDENTS_FILE);
const writeStudents = (students) => writeJsonFile(STUDENTS_FILE, students);

const findById = async (id) => {
  const students = await readStudents();
  return students.find(s => s.id === id);
};

const create = async (data) => {
  const students = await readStudents();
  const newStudent = { id: generateId(), ...data };
  students.push(newStudent);
  await writeStudents(students);
  return newStudent;
};

const findAll = async () => {
  return await readStudents();
};

module.exports = {
  findById,
  create,
  findAll,
};
const fs = require('fs').promises;
const path = require('path');
const { generateId } = require('../../shared/utils/ids');

const STUDENTS_FILE = path.join(__dirname, '../../data/students.json');

const readStudents = async () => {
  try {
    const data = await fs.readFile(STUDENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const writeStudents = async (students) => {
  await fs.writeFile(STUDENTS_FILE, JSON.stringify(students, null, 2));
};

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
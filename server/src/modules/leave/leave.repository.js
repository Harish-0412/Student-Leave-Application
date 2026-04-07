const path = require('path');
const { generateId } = require('../../shared/utils/ids');
const { readJsonFile, writeJsonFile } = require('../../shared/utils/file-db');

const LEAVES_FILE = path.join(__dirname, '../../data/leaves.json');

const readLeaves = () => readJsonFile(LEAVES_FILE);
const writeLeaves = (leaves) => writeJsonFile(LEAVES_FILE, leaves);

const findByStudentId = async (studentId) => {
  const leaves = await readLeaves();
  return leaves.filter(l => l.studentId === studentId);
};

const findById = async (leaveId) => {
  const leaves = await readLeaves();
  return leaves.find((leave) => leave.id === leaveId);
};

const findAll = async () => {
  return await readLeaves();
};

const create = async (data) => {
  const leaves = await readLeaves();
  const newLeave = { id: generateId(), ...data };
  leaves.push(newLeave);
  await writeLeaves(leaves);
  return newLeave;
};

const update = async (leaveId, updates) => {
  const leaves = await readLeaves();
  const index = leaves.findIndex((leave) => leave.id === leaveId);

  if (index === -1) {
    return null;
  }

  leaves[index] = {
    ...leaves[index],
    ...updates,
  };

  await writeLeaves(leaves);
  return leaves[index];
};

module.exports = {
  findByStudentId,
  findById,
  findAll,
  create,
  update,
};

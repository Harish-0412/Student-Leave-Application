import api from '../../services/http';

export const submitLeaveApplication = async (data) => api.post('/leave', data);

export const getLeaveHistory = async (studentId) =>
  api.get(`/leave/student/${studentId}`);

export const getLeaveById = async (leaveId) => api.get(`/leave/${leaveId}`);

export const getAllLeaves = async () => api.get('/leave');

export const updateLeaveStatus = async (leaveId, status) =>
  api.patch(`/leave/${leaveId}/status`, { status });

export const getLeaveImpact = async (data) => api.post('/ai/leave-impact', data);

export const suggestLeaveReasons = async (data) => api.post('/ai/suggest-reasons', data);

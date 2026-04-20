import apiClient from '../lib/apiClient';

export const deviceService = {
  // CRUD
  list: async () => (await apiClient.get('/devices')).data,
  create: async (payload) => (await apiClient.post('/devices', payload)).data,
  detail: async (id) => (await apiClient.get(`/devices/${id}`)).data,
  update: async (id, payload) => (await apiClient.put(`/devices/${id}`, payload)).data,
  remove: async (id) => (await apiClient.delete(`/devices/${id}`)).data,

  // WhatsApp Connection
  connect: async (id) => (await apiClient.post(`/devices/${id}/connect`)).data,
  disconnect: async (id) => (await apiClient.post(`/devices/${id}/disconnect`)).data,
  getQR: async (id) => (await apiClient.get(`/devices/${id}/qr`)).data,
  getStatus: async (id) => (await apiClient.get(`/devices/${id}/status`)).data,
  getAllStatuses: async () => (await apiClient.get('/devices/all-statuses')).data,

  // Messaging
  send: async (id, payload) => (await apiClient.post(`/devices/${id}/send`, payload)).data,
  sendTest: async (id, payload) => (await apiClient.post(`/devices/${id}/send`, payload)).data,
  scheduleSend: async (id, payload) => (await apiClient.post(`/devices/${id}/schedule-send`, payload)).data,
  listSchedules: async (id) => (await apiClient.get(`/devices/${id}/schedules`)).data,
  stopSchedule: async (id, jobId) => (await apiClient.post(`/devices/${id}/schedules/${jobId}/stop`)).data,
  resumeSchedule: async (id, jobId) => (await apiClient.post(`/devices/${id}/schedules/${jobId}/resume`)).data,
  deleteSchedule: async (id, jobId) => (await apiClient.delete(`/devices/${id}/schedules/${jobId}`)).data,
  sendBulk: async (id, payload) => (await apiClient.post(`/devices/${id}/send-bulk`, payload)).data,

  sendBulkExcel: async (id, file, message) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('message', message);
    return (await apiClient.post(`/devices/${id}/send-bulk-excel`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  },
};

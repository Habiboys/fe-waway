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
  sendTest: async (id, payload) => (await apiClient.post(`/devices/${id}/send-test`, payload)).data,
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

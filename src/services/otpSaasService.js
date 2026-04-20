import apiClient from "../lib/apiClient";

export const otpSaasService = {
  listApps: async () => (await apiClient.get("/otp/apps")).data?.data || [],
  createApp: async (payload) =>
    (await apiClient.post("/otp/apps", payload)).data?.data,
  updateApp: async (appId, payload) =>
    (await apiClient.put(`/otp/apps/${appId}`, payload)).data?.data,
  deleteApp: async (appId) =>
    (await apiClient.delete(`/otp/apps/${appId}`)).data,
  listKeys: async (appId) =>
    (await apiClient.get(`/otp/apps/${appId}/keys`)).data?.data || [],
  rotateKey: async (appId) =>
    (await apiClient.post(`/otp/apps/${appId}/keys/rotate`)).data?.data,
  updatePolicy: async (appId, payload) =>
    (await apiClient.put(`/otp/apps/${appId}/policy`, payload)).data?.data,
  listTransactions: async (appId, params = {}) => {
    const res = (await apiClient.get(`/otp/apps/${appId}/transactions`, { params })).data;
    return { data: res?.data || [], pagination: res?.pagination || {} };
  },
  getUsage: async (appId, params = {}) =>
    (await apiClient.get(`/otp/apps/${appId}/usage`, { params })).data?.data,
  testSend: async (appId, payload) =>
    (await apiClient.post(`/otp/apps/${appId}/send`, payload)).data,
  testVerify: async (appId, payload) =>
    (await apiClient.post(`/otp/apps/${appId}/verify`, payload)).data,
};

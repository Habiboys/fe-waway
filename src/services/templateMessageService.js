import apiClient from "../lib/apiClient";

export const templateMessageService = {
  list: async () => (await apiClient.get("/template-messages")).data,
  detail: async (id) => (await apiClient.get(`/template-messages/${id}`)).data,
  create: async (payload) => (await apiClient.post("/template-messages", payload)).data,
  update: async (id, payload) => (await apiClient.put(`/template-messages/${id}`, payload)).data,
  remove: async (id) => (await apiClient.delete(`/template-messages/${id}`)).data,
};

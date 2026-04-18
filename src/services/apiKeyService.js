import apiClient from "../lib/apiClient";

export const apiKeyService = {
  list: async () => (await apiClient.get("/api-keys")).data,
  generate: async () => (await apiClient.post("/api-keys")).data,
  revoke: async (id) => (await apiClient.delete(`/api-keys/${id}`)).data,
};

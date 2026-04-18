import apiClient from "../lib/apiClient";

export const masterDataService = {
  listPublicPlans: async () => (await apiClient.get("/auth/plans")).data,

  listOrganizations: async () => (await apiClient.get("/organizations")).data,
  createOrganization: async (payload) => (await apiClient.post("/organizations", payload)).data,
  updateOrganization: async (id, payload) => (await apiClient.put(`/organizations/${id}`, payload)).data,
  deleteOrganization: async (id) => (await apiClient.delete(`/organizations/${id}`)).data,
  inviteOrganizationMember: async (id, payload) =>
    (await apiClient.post(`/organizations/${id}/invite`, payload)).data,
  listOrganizationMembers: async (id) =>
    (await apiClient.get(`/organizations/${id}/members`)).data,
  listMyOrganizationInvitations: async () =>
    (await apiClient.get("/organizations/invitations")).data,
  acceptOrganizationInvitation: async (invitationId) =>
    (await apiClient.post(`/organizations/invitations/${invitationId}/accept`)).data,
  rejectOrganizationInvitation: async (invitationId) =>
    (await apiClient.post(`/organizations/invitations/${invitationId}/reject`)).data,

  listPlans: async () => (await apiClient.get("/plans")).data,
  createPlan: async (payload) => (await apiClient.post("/plans", payload)).data,
  updatePlan: async (id, payload) => (await apiClient.put(`/plans/${id}`, payload)).data,
  deletePlan: async (id) => (await apiClient.delete(`/plans/${id}`)).data,

  listDevices: async () => (await apiClient.get("/devices")).data,
  createDevice: async (payload) => (await apiClient.post("/devices", payload)).data,
  updateDevice: async (id, payload) => (await apiClient.put(`/devices/${id}`, payload)).data,
  deleteDevice: async (id) => (await apiClient.delete(`/devices/${id}`)).data,

  listContacts: async () => (await apiClient.get("/contacts")).data,
  createContact: async (payload) => (await apiClient.post("/contacts", payload)).data,
  updateContact: async (id, payload) => (await apiClient.put(`/contacts/${id}`, payload)).data,
  deleteContact: async (id) => (await apiClient.delete(`/contacts/${id}`)).data,

  listContactLists: async () => (await apiClient.get("/contact-lists")).data,
  listContactsByList: async (listId) =>
    (await apiClient.get(`/contact-lists/${listId}/contacts`)).data,
  createContactList: async (payload) => (await apiClient.post("/contact-lists", payload)).data,
  updateContactList: async (id, payload) => (await apiClient.put(`/contact-lists/${id}`, payload)).data,
  deleteContactList: async (id) => (await apiClient.delete(`/contact-lists/${id}`)).data,
};

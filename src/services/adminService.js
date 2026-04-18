import apiClient from '../lib/apiClient'

export const adminService = {
  async dashboard() {
    const { data } = await apiClient.get('/admin/dashboard')
    return data
  },

  async listOrders(status) {
    const { data } = await apiClient.get('/admin/orders', { params: status ? { status } : {} })
    return data
  },

  async approveOrder(id) {
    const { data } = await apiClient.post(`/admin/orders/${id}/approve`)
    return data
  },

  async rejectOrder(id, reason) {
    const { data } = await apiClient.post(`/admin/orders/${id}/reject`, { reason })
    return data
  },

  async listUsers() {
    const { data } = await apiClient.get('/admin/users')
    return data
  },

  async updateUser(id, payload) {
    const { data } = await apiClient.put(`/admin/users/${id}`, payload)
    return data
  },

  async softDeleteUser(id) {
    const { data } = await apiClient.delete(`/admin/users/${id}`)
    return data
  },

  async listOrganizations() {
    const { data } = await apiClient.get('/admin/organizations')
    return data
  },
}

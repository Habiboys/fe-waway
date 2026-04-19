import apiClient from '../lib/apiClient'

export const authService = {
  async login(payload) {
    const { data } = await apiClient.post('/auth/login', payload)
    return data
  },

  async register(payload) {
    const { data } = await apiClient.post('/auth/register', payload)
    return data
  },

  async forgotPassword(payload) {
    const { data } = await apiClient.post('/auth/forgot-password', payload)
    return data
  },

  async resetPassword(payload) {
    const { data } = await apiClient.post('/auth/reset-password', payload)
    return data
  },

  async verifyEmail(token) {
    const { data } = await apiClient.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
    return data
  },

  async resendVerification(payload) {
    const { data } = await apiClient.post('/auth/resend-verification', payload)
    return data
  },

  async me() {
    const { data } = await apiClient.get('/auth/me')
    return data
  },

  async logout() {
    const { data } = await apiClient.post('/auth/logout')
    return data
  },

  async updateProfile(payload) {
    const { data } = await apiClient.put('/auth/profile', payload)
    return data
  },

  async changePassword(payload) {
    const { data } = await apiClient.post('/auth/change-password', payload)
    return data
  },
}

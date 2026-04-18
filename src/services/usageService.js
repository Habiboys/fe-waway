import apiClient from '../lib/apiClient'

export const usageService = {
  async getQuota() {
    const { data } = await apiClient.get('/usage/quota')
    return data
  },

  async getSummary() {
    const { data } = await apiClient.get('/usage/summary')
    return data
  },
}

import apiClient from '../lib/apiClient'

export const paymentService = {
  async createInvoice(planId) {
    const { data } = await apiClient.post('/payments/invoice', { plan_id: planId })
    return data
  },

  async myOrders() {
    const { data } = await apiClient.get('/payments/my-orders')
    return data
  },

  async orderDetail(id) {
    const { data } = await apiClient.get(`/payments/orders/${id}`)
    return data
  },
}

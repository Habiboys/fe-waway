import axios from 'axios'
import { API_BASE_URL } from '../config/app'
import { getCurrentOrganizationId } from './organization'
import { clearToken, getToken } from './token'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const orgId = getCurrentOrganizationId()
  if (orgId) {
    config.headers['x-organization-id'] = String(orgId)
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearToken()
    }

    const message = error?.response?.data?.message || error.message || 'Request failed'
    const wrappedError = new Error(message)
    wrappedError.status = error?.response?.status
    wrappedError.code = error?.response?.data?.code
    wrappedError.data = error?.response?.data
    return Promise.reject(wrappedError)
  },
)

export default apiClient

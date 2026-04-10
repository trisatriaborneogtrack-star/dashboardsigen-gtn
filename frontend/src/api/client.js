import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

const client = axios.create({
  baseURL: BASE,
  timeout: 15000,
})

export const fetchVessels = () =>
  client.get('/api/vessels').then(r => r.data)

export const fetchRealtime = (systemId) =>
  client.get(`/api/realtime/${systemId}`).then(r => r.data)

export const fetchHistory = (systemId, { days = 30, level = 'Month', date } = {}) =>
  client.get(`/api/history/${systemId}`, { params: { days, level, date } }).then(r => r.data)

export const fetchLocation = (systemId) =>
  client.get(`/api/location/${systemId}`).then(r => r.data)

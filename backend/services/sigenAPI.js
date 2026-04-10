/**
 * Sigenergy OpenAPI Service
 * Domain: openapi-apac.sigencloud.com
 * Auth: OAuth2 Client Credentials (Base64 AppKey:AppSecret)
 */

const axios = require('axios');
const NodeCache = require('node-cache');

const tokenCache = new NodeCache({ stdTTL: 11 * 60 * 60 }); // 11h (token valid 12h)
const dataCache  = new NodeCache({ stdTTL: 60 });             // 1 min data cache

const BASE_URL = process.env.SIGEN_BASE_URL || 'https://openapi-apac.sigencloud.com';

// ─── Authentication ───────────────────────────────────────────────────────────
async function getToken() {
  const cached = tokenCache.get('access_token');
  if (cached) return cached;

  const appKey    = process.env.SIGEN_APP_KEY;
  const appSecret = process.env.SIGEN_APP_SECRET;

  if (!appKey || !appSecret) {
    throw new Error('SIGEN_APP_KEY and SIGEN_APP_SECRET must be set in .env');
  }

  // Sigenergy auth: base64(AppKey:AppSecret)
  const key = Buffer.from(`${appKey}:${appSecret}`).toString('base64');

  const res = await axios.post(
    `${BASE_URL}/openapi/auth/token`,
    { key },
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (res.data.code !== 0) {
    throw new Error(`Auth failed: ${res.data.msg}`);
  }

  // data is a JSON string in Sigenergy response
  let tokenData = res.data.data;
  if (typeof tokenData === 'string') {
    tokenData = JSON.parse(tokenData);
  }

  const { accessToken, expiresIn } = tokenData;
  tokenCache.set('access_token', accessToken, Math.max(60, expiresIn - 60));
  return accessToken;
}

// ─── Authenticated Request Helper ────────────────────────────────────────────
async function apiGet(path, params = {}) {
  const token = await getToken();
  const res = await axios.get(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    params,
    timeout: 15000,
  });
  return res.data;
}

async function apiPost(path, body = {}) {
  const token = await getToken();
  const res = await axios.post(`${BASE_URL}${path}`, body, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    timeout: 15000,
  });
  return res.data;
}

// ─── System List (Inventory) ──────────────────────────────────────────────────
async function getSystemList() {
  const cacheKey = 'system_list';
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;

  const res = await apiPost('/openapi/system/list/page', {
    pageNum: 1,
    pageSize: 100,
  });

  if (res.code !== 0) throw new Error(res.msg || 'Failed to fetch system list');

  let records = [];
  if (res.data?.records) {
    records = res.data.records.map(r => {
      if (typeof r === 'string') {
        try { return JSON.parse(r); } catch { return {}; }
      }
      return r;
    });
  } else if (Array.isArray(res.data)) {
    records = res.data;
  }

  dataCache.set(cacheKey, records, 5 * 60); // cache 5 mins (API rate-limit)
  return records;
}

// ─── System Energy Flow (Realtime) ───────────────────────────────────────────
async function getEnergyFlow(systemId) {
  const cacheKey = `energy_flow_${systemId}`;
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;

  const res = await apiPost('/openapi/realtime/system/energyflow', { systemId });
  if (res.code !== 0) throw new Error(res.msg || 'Failed to fetch energy flow');

  dataCache.set(cacheKey, res.data, 30); // 30s cache
  return res.data;
}

// ─── System Realtime Summary ──────────────────────────────────────────────────
async function getSystemRealtime(systemId) {
  const cacheKey = `system_rt_${systemId}`;
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;

  const res = await apiPost('/openapi/realtime/system', { systemId });
  if (res.code !== 0) throw new Error(res.msg || 'Failed to fetch system realtime');

  dataCache.set(cacheKey, res.data, 30);
  return res.data;
}

// ─── Device List ──────────────────────────────────────────────────────────────
async function getDeviceList(systemId) {
  const cacheKey = `device_list_${systemId}`;
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;

  const res = await apiPost('/openapi/device/list', { systemId });
  if (res.code !== 0) throw new Error(res.msg || 'Failed to fetch device list');

  const data = Array.isArray(res.data) ? res.data : [];
  dataCache.set(cacheKey, data, 5 * 60);
  return data;
}

// ─── Device Realtime Data ─────────────────────────────────────────────────────
async function getDeviceRealtime(systemId, serialNumber) {
  const cacheKey = `device_rt_${systemId}_${serialNumber}`;
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;

  const res = await apiPost('/openapi/realtime/device', { systemId, serialNumber });
  if (res.code !== 0) throw new Error(res.msg || 'Failed to fetch device realtime');

  dataCache.set(cacheKey, res.data, 30);
  return res.data;
}

// ─── System Historical Data ───────────────────────────────────────────────────
async function getSystemHistory(systemId, level = 'Day', date) {
  const d = date || new Date().toISOString().split('T')[0];
  const cacheKey = `history_${systemId}_${level}_${d}`;
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;

  const res = await apiPost('/openapi/history/system', { systemId, level, date: d });
  if (res.code !== 0) throw new Error(res.msg || 'Failed to fetch history');

  dataCache.set(cacheKey, res.data, 5 * 60);
  return res.data;
}

// ─── Historical Data V1 (Sankey + Chart) ─────────────────────────────────────
async function getSystemHistoryV1(systemId, level = 'Day', date) {
  const d = date || new Date().toISOString().split('T')[0];
  const cacheKey = `history_v1_${systemId}_${level}_${d}`;
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;

  const res = await apiPost('/openapi/history/system/v1', { systemId, date: d, level });
  if (res.code !== 0) throw new Error(res.msg || 'Failed to fetch history v1');

  dataCache.set(cacheKey, res.data, 5 * 60);
  return res.data;
}

module.exports = {
  getToken,
  getSystemList,
  getEnergyFlow,
  getSystemRealtime,
  getDeviceList,
  getDeviceRealtime,
  getSystemHistory,
  getSystemHistoryV1,
};

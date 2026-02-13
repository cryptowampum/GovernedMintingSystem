const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const API_KEY = import.meta.env.VITE_BACKEND_API_KEY || '';

function getToken() {
  return localStorage.getItem('admin_token') || '';
}

async function adminFetch(path, options = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    window.location.reload();
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function getChallenge() {
  const res = await fetch(`${BACKEND_URL}/api/admin/auth/challenge`);
  return res.json();
}

export async function verifyAuth(message, signature) {
  const res = await fetch(`${BACKEND_URL}/api/admin/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, signature }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Auth failed' }));
    throw new Error(err.error || 'Auth failed');
  }
  return res.json();
}

export async function listSubmissions(status, page = 1) {
  const params = new URLSearchParams({ page, limit: 20 });
  if (status) params.set('status', status);
  return adminFetch(`/api/admin/submissions?${params}`);
}

export async function getSubmission(id) {
  return adminFetch(`/api/admin/submissions/${id}`);
}

export async function updateSubmission(id, data) {
  return adminFetch(`/api/admin/submissions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function approveSubmission(id, collectionId) {
  return adminFetch(`/api/admin/submissions/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ collectionId }),
  });
}

export async function denySubmission(id, adminNotes) {
  return adminFetch(`/api/admin/submissions/${id}/deny`, {
    method: 'POST',
    body: JSON.stringify({ adminNotes }),
  });
}

export async function mintSubmission(id) {
  return adminFetch(`/api/admin/submissions/${id}/mint`, { method: 'POST' });
}

export async function getShareUrls(id) {
  return adminFetch(`/api/admin/submissions/${id}/share-urls`);
}

export async function listCollections() {
  return adminFetch('/api/admin/collections');
}

export async function createCollection(data) {
  return adminFetch('/api/admin/collections', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

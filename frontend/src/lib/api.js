const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const API_KEY = import.meta.env.VITE_BACKEND_API_KEY || '';

export async function submitEntry({ photo, comment, xHandle, instagramHandle, blueskyHandle, email, walletAddress }) {
  const formData = new FormData();
  formData.append('image', photo, 'photo.jpg');
  formData.append('comment', comment);
  formData.append('walletAddress', walletAddress);
  if (xHandle) formData.append('xHandle', xHandle);
  if (instagramHandle) formData.append('instagramHandle', instagramHandle);
  if (blueskyHandle) formData.append('blueskyHandle', blueskyHandle);
  if (email) formData.append('email', email);

  const res = await fetch(`${BACKEND_URL}/api/submissions`, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Submission failed');
  }

  return res.json();
}

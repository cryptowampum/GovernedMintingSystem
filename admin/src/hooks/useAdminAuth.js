import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { getChallenge, verifyAuth } from '../lib/api';

export default function useAdminAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for existing token on mount/address change
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const storedAddress = localStorage.getItem('admin_address');
    if (token && storedAddress?.toLowerCase() === address?.toLowerCase()) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [address]);

  const authenticate = useCallback(async () => {
    if (!isConnected || !address) return;
    setLoading(true);
    setError('');

    try {
      const { message } = await getChallenge();
      const signature = await signMessageAsync({ message });
      const { token } = await verifyAuth(message, signature);

      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_address', address.toLowerCase());
      setIsAdmin(true);
    } catch (err) {
      setError(err.message || 'Authentication failed');
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, signMessageAsync]);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_address');
    setIsAdmin(false);
  }, []);

  return { isAdmin, authenticate, logout, loading, error };
}

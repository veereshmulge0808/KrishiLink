import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('agriflow_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('agriflow_token') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('agriflow_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('agriflow_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('agriflow_token', token);
    } else {
      localStorage.removeItem('agriflow_token');
    }
  }, [token]);

  // Authenticated fetch helper
  const apiFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
      logout();
      throw new Error('Session expired. Please log in again.');
    }
    
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || data.message || `Request failed with status ${response.status}`);
    }
    return data;
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setUser(data.user);
      setToken(data.access_token);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role) => {
    const demoAccounts = {
      FARMER: { email: 'farmer@agriflow.io', password: 'farmer123' },
      LOGISTICS: { email: 'logistics@agriflow.io', password: 'logistics123' },
      BUYER: { email: 'buyer@agriflow.io', password: 'buyer123' }
    };
    const creds = demoAccounts[role.toUpperCase()];
    if (!creds) throw new Error('Invalid demo role');
    return await login(creds.email, creds.password);
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      setUser(data.user);
      setToken(data.access_token);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('agriflow_user');
    localStorage.removeItem('agriflow_token');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      demoLogin,
      register,
      logout,
      apiFetch
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

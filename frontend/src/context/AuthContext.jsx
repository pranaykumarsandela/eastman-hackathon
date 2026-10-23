import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('smartcart_token'));
  const [loading, setLoading] = useState(true);

  // Validate session on load
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('smartcart_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (res.success && res.data) {
          setUser(res.data);
        } else {
          localStorage.removeItem('smartcart_token');
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.warn('Session expired or invalid:', err.message);
        localStorage.removeItem('smartcart_token');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success && res.data) {
      localStorage.setItem('smartcart_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Login failed');
  }, []);

  const register = useCallback(async (userData) => {
    const res = await api.register(userData);
    if (res.success && res.data) {
      localStorage.setItem('smartcart_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Registration failed');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('smartcart_token');
    setToken(null);
    setUser(null);
  }, []);

  const role = user?.role || 'guest';
  const isAuthenticated = Boolean(user && token);
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        isAdmin,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

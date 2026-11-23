// Authentication Context for SnapShare Mobile
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, getSavedAuthToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = await getSavedAuthToken();
        if (savedToken) {
          setToken(savedToken);
          await setAuthToken(savedToken);
          const profile = await api.getProfile().catch(() => null);
          if (profile?.user) {
            setUser(profile.user);
          } else {
            // Token expired or invalid
            await setAuthToken(null);
            setToken(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    if (data.token) {
      await setAuthToken(data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const register = async (name, email, password) => {
    const data = await api.register(name, email, password);
    if (data.token) {
      await setAuthToken(data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const logout = async () => {
    await setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  };

  const refreshUser = async () => {
    try {
      const profile = await api.getProfile();
      if (profile?.user) setUser(profile.user);
    } catch (err) {
      console.warn('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { setAccessToken, getAccessToken, refreshSession } from '@/services/axiosInstance';
import { loginUser, logoutUser } from '@/features/auth/authApi';
import { connectSocket, disconnectSocket } from '@/services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const bootstrapSession = useCallback(async () => {
    try {
      const { token, user: sessionUser } = await refreshSession();
      setUser(sessionUser);
      connectSocket(token);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrapSession();
  }, [bootstrapSession]);

  const login = async (email, password) => {
    const { data } = await loginUser({ email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    connectSocket(data.data.accessToken);
    return data.data.user;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      setAccessToken(null);
      setUser(null);
      disconnectSocket();
    }
  };

  const refreshUser = async () => {
    const { user: sessionUser } = await refreshSession();
    setUser(sessionUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

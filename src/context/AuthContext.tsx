import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { loginApi, logoutApi, getCurrentUserApi, forgotPasswordApi, resetPasswordApi } from '../api/auth.api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<UserRole>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: { token: string; password: string }) => Promise<void>;
  setRole: (role: UserRole) => void;
  updateUser: (partialUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('tpo_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('tpo_token');
      if (token) {
        try {
          const res = await getCurrentUserApi();
          if (res.data?.user) {
            const fetchedUser = {
              ...res.data.user,
              name: res.data.user.full_name || res.data.user.name || 'User',
            };
            setUser(fetchedUser);
            localStorage.setItem('tpo_user', JSON.stringify(fetchedUser));
          }
        } catch (error) {
          console.error('Session verification error:', error);
          localStorage.removeItem('tpo_token');
          localStorage.removeItem('tpo_refresh_token');
          localStorage.removeItem('tpo_user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (email: string, password: string): Promise<UserRole> => {
    const res = await loginApi({ email, password });
    const payload = res.data;
    const token = payload?.accessToken || payload?.session?.access_token;
    const refreshToken = payload?.session?.refresh_token;
    const apiUser = payload?.user || payload;

    const formattedUser: User = {
      ...apiUser,
      name: apiUser?.full_name || apiUser?.name || 'User',
      must_change_password: (payload as any)?.must_change_password ?? apiUser?.must_change_password ?? false,
    };

    if (token) {
      localStorage.setItem('tpo_token', token);
    }
    if (refreshToken) {
      localStorage.setItem('tpo_refresh_token', refreshToken);
    }
    localStorage.setItem('tpo_user', JSON.stringify(formattedUser));
    setUser(formattedUser);

    return formattedUser.role;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.warn('Logout API failed, clearing local session:', error);
    } finally {
      localStorage.removeItem('tpo_token');
      localStorage.removeItem('tpo_refresh_token');
      localStorage.removeItem('tpo_user');
      setUser(null);
    }
  };

  const forgotPassword = async (email: string) => {
    await forgotPasswordApi(email);
  };

  const resetPassword = async (data: { token: string; password: string }) => {
    await resetPasswordApi(data);
  };

  const setRole = (role: UserRole) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      localStorage.setItem('tpo_user', JSON.stringify(updated));
    }
  };

  const updateUser = (partialUser: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...partialUser };
      setUser(updated);
      localStorage.setItem('tpo_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        forgotPassword,
        resetPassword,
        setRole,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

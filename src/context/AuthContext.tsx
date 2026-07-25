import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, role?: UserRole) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
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
    // Default demo user for seamless previewing
    return {
      id: 'usr-1',
      name: 'Dr. James Anderson',
      email: 'james.tpo@university.edu',
      role: 'tpo_admin',
      department: 'Training & Placement Office',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    };
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('tpo_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('tpo_user');
    }
  }, [user]);

  const login = (email: string, role: UserRole = 'tpo_admin') => {
    const newUser: User = {
      id: 'usr-' + Date.now(),
      name: role === 'tpo_admin' ? 'Dr. James Anderson' : role === 'student' ? 'Alex Rivera' : 'Sarah Jenkins',
      email,
      role,
      department: role === 'tpo_admin' ? 'TPO Office' : role === 'student' ? 'Computer Science' : 'Recruitment Ops',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  const setRole = (role: UserRole) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, setRole }}>
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

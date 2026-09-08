import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Farm } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  farm: Farm | null;
  sessionToken: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (fullName: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshFarm: () => Promise<void>;
  createFarm: (farmName: string, location: string, mainMilkBuyer?: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always start with false, never hardcode demo user or true
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    return localStorage.getItem('dairypulse_session_token');
  });

  const validateSession = useCallback(async (token: string) => {
    setIsLoading(true);
    try {
      const res = await api.validateSession(token);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setFarm(res.data.farm || null);
        setIsAuthenticated(true);
        setSessionToken(token);
        localStorage.setItem('dairypulse_session_token', token);
      } else {
        // Token is invalid or expired
        setIsAuthenticated(false);
        setUser(null);
        setFarm(null);
        setSessionToken(null);
        localStorage.removeItem('dairypulse_session_token');
      }
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);
      setFarm(null);
      setSessionToken(null);
      localStorage.removeItem('dairypulse_session_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('dairypulse_session_token');
    if (storedToken) {
      validateSession(storedToken);
    } else {
      setIsLoading(false);
      setIsAuthenticated(false);
    }
  }, [validateSession]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      if (res.success && res.sessionToken && res.data?.user) {
        const token = res.sessionToken;
        localStorage.setItem('dairypulse_session_token', token);
        setSessionToken(token);
        setUser(res.data.user);
        setIsAuthenticated(true);

        // Fetch farm if exists
        const farmRes = await api.getFarm();
        if (farmRes.success && farmRes.data) {
          setFarm(farmRes.data);
        } else {
          setFarm(null);
        }
        return { success: true };
      }
      return { success: false, message: res.message || 'Invalid email or password.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to connect to authentication service.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (fullName: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.signup(fullName, email, password);
      if (res.success && res.sessionToken && res.data?.user) {
        const token = res.sessionToken;
        localStorage.setItem('dairypulse_session_token', token);
        setSessionToken(token);
        setUser(res.data.user);
        setFarm(null); // Fresh signup has no farm yet
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: res.message || 'Signup failed. Please try again.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to connect to authentication service.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        await api.logout(sessionToken);
      }
    } catch (e) {
      // Proceed with local logout regardless
    } finally {
      localStorage.removeItem('dairypulse_session_token');
      setSessionToken(null);
      setUser(null);
      setFarm(null);
      setIsAuthenticated(false);
    }
  };

  const refreshFarm = async () => {
    try {
      const res = await api.getFarm();
      if (res.success && res.data) {
        setFarm(res.data);
      }
    } catch (err) {
      console.error('Error refreshing farm data:', err);
    }
  };

  const createFarm = async (farmName: string, location: string, mainMilkBuyer?: string) => {
    try {
      const res = await api.createFarm(farmName, location, mainMilkBuyer);
      if (res.success && res.data) {
        setFarm(res.data);
        if (user) {
          setUser({ ...user, farmId: res.data.farmId });
        }
        return { success: true };
      }
      return { success: false, message: res.message || 'Failed to create farm profile.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Unable to save farm setup.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        farm,
        sessionToken,
        login,
        signup,
        logout,
        refreshFarm,
        createFarm,
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

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest, LoginResponse } from '../types';
import { authApi, setToken, clearToken } from '../services/api';
import { config, log, isProduction } from '../utils/config';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 检查用户认证状态
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (err) {
      console.warn('无法访问localStorage，用户需要重新登录');
    }
    setIsLoading(false);
  }, []);

  // 登录
  const login = async (data: LoginRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      // 开发环境使用模拟登录，但在生产环境中始终使用真实登录
      if (process.env.NODE_ENV === 'development' && config.enableDebugLogging && !isProduction()) {
        const mockUser: User = {
          id: '1',
          username: data.username,
          email: `${data.username}@example.com`,
          token: 'mock-token-123456',
        };
        setToken('mock-token-123456', data.username);
        setUser(mockUser);
        setIsLoading(false);
        return true;
      }

      // 使用API服务登录
      const response = await authApi.login(data.username, data.password);
      log('登录响应:', response);

      if (!response.success) {
        setError(response.message || '登录失败');
        setIsLoading(false);
        return false;
      }

      // 处理登录成功响应
      if (response.token) {
        const userData: User = {
          id: '1', // 假设用户ID为1
          username: response.username || data.username,
          token: response.token
        };
        
        // 记录token信息，便于调试
        log('登录成功，获取到token:', response.token.substring(0, 20) + '...');
        
        setToken(response.token, userData.username);
        setUser(userData);
        setIsLoading(false);
        return true;
      } else {
        setError('登录响应缺少token');
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      console.error('登录错误:', err);
      setError('登录过程中发生错误');
      setIsLoading(false);
      return false;
    }
  };

  // 注册
  const register = async (data: RegisterRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      // 使用API服务注册
      const response = await authApi.register(data.username, data.email, data.password);

      if (!response.success) {
        setError(response.message || '注册失败');
        setIsLoading(false);
        return false;
      }

      // 处理注册成功响应
      if (response.data && response.data.token) {
        const userData: User = {
          id: '1', // 假设用户ID为1
          username: response.data.username || data.username,
          email: data.email,
          token: response.data.token
        };
        
        setToken(response.data.token, userData.username);
        setUser(userData);
        setIsLoading(false);
        return true;
      } else {
        setError('注册响应缺少token');
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      console.error('注册错误:', err);
      setError('注册过程中发生错误');
      setIsLoading(false);
      return false;
    }
  };

  // 登出
  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../../services/api';
import EnvironmentSwitcher from './EnvironmentSwitcher';
import { config, getEnvironment, getApiVersion } from '../../utils/config';

// API路径配置
const API_PATHS = [
  { name: '健康检查', path: '/health' },
  { name: '聊天会话', path: '/chat/sessions' },
  { name: '聊天会话(API v1)', path: '/api/v1/chat/sessions' },
  { name: '登录', path: '/auth/login' },
  { name: '登录(API v1)', path: '/api/v1/auth/login' },
  { name: 'WebSocket', path: '/ws' },
  { name: 'WebSocket(API v1)', path: '/api/v1/ws' },
];

const DebugPage: React.FC = () => {
  const [apiUrl, setApiUrl] = useState(config.baseUrl);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState<boolean | null>(null);
  const [mockToken, setMockToken] = useState('mock-token-123456');
  const [testEndpoint, setTestEndpoint] = useState('/api/v1/chat/sessions');
  const navigate = useNavigate();

  // 检查localStorage是否可用
  useEffect(() => {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      setStorageAvailable(true);
    } catch (e) {
      setStorageAvailable(false);
    }
  }, []);

  // 当环境配置变化时更新API URL
  useEffect(() => {
    setApiUrl(config.baseUrl);
  }, []);

  // 测试API连接
  const testApiConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const fullUrl = `${apiUrl}${testEndpoint}`;
      console.log(`测试连接: ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        },
        mode: 'cors',
      });
      
      let responseText;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const json = await response.json();
          responseText = JSON.stringify(json, null, 2);
        } else {
          responseText = await response.text();
        }
      } catch (e) {
        responseText = '无法解析响应内容';
      }
      
      // 获取响应头信息
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      setTestResult(`状态码: ${response.status}\n响应头: ${JSON.stringify(headers, null, 2)}\n\n响应内容:\n${responseText}`);
    } catch (error) {
      setTestResult(`错误: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 设置模拟token
  const setMockUserToken = () => {
    try {
      setToken(mockToken);
      setTestResult('已设置模拟用户Token');
    } catch (error) {
      setTestResult(`设置Token失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 跳转到登录页面
  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">应用诊断工具</h1>
        
        {/* 环境切换器 */}
        <EnvironmentSwitcher />
        
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <h2 className="text-lg font-semibold mb-2">系统信息</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">浏览器:</div>
            <div>{navigator.userAgent}</div>
            
            <div className="font-medium">localStorage可用:</div>
            <div>
              {storageAvailable === null ? '检查中...' : 
               storageAvailable ? '✅ 可用' : '❌ 不可用'}
            </div>
            
            <div className="font-medium">当前URL:</div>
            <div>{window.location.href}</div>
            
            <div className="font-medium">当前环境:</div>
            <div>{getEnvironment()}</div>
            
            <div className="font-medium">API版本:</div>
            <div>{getApiVersion()}</div>
            
            <div className="font-medium">API基础URL:</div>
            <div>{apiUrl}</div>
            
            <div className="font-medium">API前缀:</div>
            <div>{config.apiPrefix}</div>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">API连接测试</h2>
          <div className="flex mb-2">
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="flex-1 border rounded-l px-3 py-2"
              placeholder="API URL"
            />
            <input
              type="text"
              value={testEndpoint}
              onChange={(e) => setTestEndpoint(e.target.value)}
              className="w-1/3 border-t border-b border-r px-3 py-2"
              placeholder="端点路径"
            />
            <button
              onClick={testApiConnection}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? '测试中...' : '测试'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {API_PATHS.map((api) => (
              <button 
                key={api.path}
                onClick={() => setTestEndpoint(api.path)}
                className={`px-3 py-1 rounded text-sm ${testEndpoint === api.path ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {api.name}
              </button>
            ))}
          </div>
          {testResult && (
            <div className="mt-2 p-3 bg-gray-50 rounded text-sm font-mono whitespace-pre-wrap overflow-auto max-h-60">
              {testResult}
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">模拟用户</h2>
          <div className="flex mb-2">
            <input
              type="text"
              value={mockToken}
              onChange={(e) => setMockToken(e.target.value)}
              className="flex-1 border rounded-l px-3 py-2"
              placeholder="模拟Token"
            />
            <button
              onClick={setMockUserToken}
              className="bg-green-500 text-white px-4 py-2 rounded-r hover:bg-green-600"
            >
              设置Token
            </button>
          </div>
          <p className="text-sm text-gray-600">
            设置模拟Token后，应用将使用此Token进行API请求。
          </p>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={goToLogin}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            前往登录页面
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            返回主页
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugPage; 
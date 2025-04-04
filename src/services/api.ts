import { 
  ApiResponse, 
  ChatSession, 
  ApiMessage, 
  Message, 
  LoginResponse, 
  CreateSessionResponse,
  GetSessionsResponse
} from '../types';
import { config, log, logError, getApiUrl, isProduction } from '../utils/config';

// 内存中的token存储
let memoryToken: string | null = null;

// 获取认证令牌
const getToken = (): string | null => {
  try {
    const user = localStorage.getItem('user');
    if (!user) {
      // 在生产环境中，如果localStorage中没有user数据，则不使用内存token
      if (isProduction()) {
        log('生产环境中未找到user数据，不使用内存token');
        return null;
      }
      
      log('localStorage中未找到user数据，使用内存token:', memoryToken);
      return memoryToken;
    }
    
    const userData = JSON.parse(user);
    const token = userData.token || memoryToken;
    
    // 在生产环境中，检查token是否为模拟token
    if (isProduction() && token === 'mock-token-123456') {
      logError('警告: 在生产环境中使用了模拟token，这可能导致认证失败');
      return null;
    }
    
    // 记录token信息，便于调试
    if (token) {
      log('从localStorage获取到token:', token.substring(0, 20) + '...');
    } else {
      log('localStorage中的user数据不包含token');
    }
    
    return token;
  } catch (error) {
    console.warn('无法访问localStorage，使用内存存储');
    
    // 在生产环境中，如果无法访问localStorage，则不使用内存token
    if (isProduction()) {
      logError('生产环境中无法访问localStorage，不使用内存token');
      return null;
    }
    
    return memoryToken;
  }
};

// 设置token（当localStorage不可用时使用内存存储）
export const setToken = (token: string, username: string = 'test'): void => {
  try {
    // 检查token是否为模拟token
    if (token === 'mock-token-123456' && isProduction()) {
      logError('警告: 尝试在生产环境中保存模拟token，操作已取消');
      return;
    }
    
    // 检查token格式是否正确
    if (!token.includes('.') && isProduction()) {
      logError('警告: token格式不正确，不包含"."字符，操作已取消:', token);
      return;
    }
    
    // 记录token信息，便于调试
    log('设置token:', token.substring(0, 20) + '...');
    log('设置username:', username);
    
    const userData = {
      id: '1',
      username: username,
      token: token
    };
    
    // 将userData转换为JSON字符串并保存到localStorage
    const userDataString = JSON.stringify(userData);
    localStorage.setItem('user', userDataString);
    
    // 验证token是否正确保存
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      log('验证保存的token:', parsedUser.token.substring(0, 20) + '...');
    }
    
    // 同时保存到内存中
    memoryToken = token;
  } catch (error) {
    console.warn('无法访问localStorage，使用内存存储');
    
    // 在生产环境中，如果无法访问localStorage，则不保存模拟token
    if (isProduction() && token === 'mock-token-123456') {
      logError('警告: 无法访问localStorage，且尝试保存模拟token，操作已取消');
      return;
    }
    
    memoryToken = token;
  }
};

// 清除token
export const clearToken = (): void => {
  try {
    localStorage.removeItem('user');
  } catch (error) {
    console.warn('无法访问localStorage，清除内存存储');
  }
  memoryToken = null;
};

// 创建带有认证头的请求选项
const createAuthHeaders = (): HeadersInit => {
  const token = getToken();
  
  // 记录token信息，便于调试
  if (token) {
    log('使用token创建认证头:', token.substring(0, 20) + '...');
    
    // 检查token格式是否正确
    if (!token.includes('.')) {
      logError('警告: token格式不正确，不包含"."字符:', token);
      
      // 在生产环境中，如果token格式不正确，则不使用该token
      if (isProduction()) {
        logError('生产环境中token格式不正确，不添加认证头');
        return {
          'Content-Type': 'application/json'
        };
      }
    }
    
    // 检查token是否为模拟token
    if (token === 'mock-token-123456' && isProduction()) {
      logError('警告: 在生产环境中使用了模拟token，不添加认证头');
      return {
        'Content-Type': 'application/json'
      };
    }
    
    // 返回带有Authorization头的请求头
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  } else {
    log('未找到token，不添加认证头');
    
    // 返回不带Authorization头的请求头
    return {
      'Content-Type': 'application/json'
    };
  }
};

// API请求包装器
const apiRequest = async <T>(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  params?: Record<string, string>
): Promise<ApiResponse<T>> => {
  try {
    const headers = createAuthHeaders();
    const url = getApiUrl(endpoint, params);
    log(`发送API请求: ${method} ${url}`);
    
    const options: RequestInit = {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
      // 仅设置mode为cors，不设置credentials
      mode: 'cors',
    };

    // 记录完整的请求信息
    log('请求方法:', method);
    log('请求URL:', url);
    log('请求头:', JSON.stringify(headers));
    if (body) log('请求体:', JSON.stringify(body));

    // 添加请求开始时间
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, options);
      
      // 计算请求耗时
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      log(`收到响应: ${response.status} ${response.statusText}，耗时: ${duration}ms`);
      
      // 检查响应类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        logError('响应不是JSON格式:', contentType);
        logError('响应URL:', response.url);
        
        // 尝试读取响应文本
        try {
          const text = await response.text();
          logError('响应文本:', text.substring(0, 500)); // 只记录前500个字符
        } catch (textError) {
          logError('无法读取响应文本:', textError);
        }
        
        return {
          success: false,
          message: `服务器返回了非JSON响应: ${contentType}，状态码: ${response.status}，URL: ${response.url}`,
        };
      }

      const data = await response.json();
      log('响应数据:', data);

      // 统一响应格式
      if (!('success' in data)) {
        data.success = response.ok;
      }
      
      if (!('message' in data) && !response.ok) {
        data.message = `请求失败: ${response.status} ${response.statusText}`;
      }

      if (!response.ok) {
        // 处理401错误（未授权）
        if (response.status === 401) {
          console.warn('认证失败，重定向到登录页面');
          try {
            localStorage.removeItem('user');
          } catch (e) {
            console.warn('无法访问localStorage，清除内存token');
            memoryToken = null;
          }
          window.location.href = '/login';
        }
      }

      return data;
    } catch (fetchError) {
      logError('Fetch错误:', fetchError);
      throw fetchError; // 重新抛出错误，让外层catch处理
    }
  } catch (error) {
    logError('API请求错误:', error);
    // 显示更详细的错误信息
    let errorMessage = '请求过程中发生错误';
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      errorMessage = '无法连接到服务器，请检查网络连接或服务器状态';
    } else if (error instanceof Error) {
      errorMessage = `请求错误: ${error.message}`;
    }
    
    return {
      success: false,
      message: errorMessage,
    };
  }
};

// 认证API
export const authApi = {
  // 用户登录
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await apiRequest<any>(
      config.apiPaths.auth.login, 
      'POST', 
      { username, password }
    );
    
    // 记录完整的响应，便于调试
    log('登录API原始响应:', response);
    
    // 确保返回的是LoginResponse类型
    const loginResponse: LoginResponse = {
      success: response.success,
      message: response.message || '',
      token: '',
      username: username
    };
    
    // 将响应转换为any类型，以便访问可能存在的属性
    const anyResponse = response as any;
    
    // 尝试直接从响应中获取token和username
    if (anyResponse.token) {
      loginResponse.token = anyResponse.token;
      loginResponse.username = anyResponse.username || username;
      log('从响应直接获取到token:', anyResponse.token.substring(0, 20) + '...');
    } 
    // 尝试从data字段获取token和username
    else if (response.data && response.data.token) {
      loginResponse.token = response.data.token;
      loginResponse.username = response.data.username || username;
      log('从响应data字段获取到token:', response.data.token.substring(0, 20) + '...');
    }
    // 如果响应本身就是LoginResponse格式
    else {
      // 尝试将整个响应作为LoginResponse处理
      try {
        if (typeof anyResponse === 'object' && 'success' in anyResponse) {
          if ('token' in anyResponse) {
            loginResponse.token = anyResponse.token || '';
            loginResponse.username = anyResponse.username || username;
            log('将整个响应作为LoginResponse处理，获取到token:', anyResponse.token.substring(0, 20) + '...');
          }
        }
      } catch (e) {
        logError('处理登录响应时出错:', e);
      }
    }
    
    // 检查token是否获取成功
    if (!loginResponse.token) {
      logError('警告: 未能从登录响应中获取token');
    }
    
    return loginResponse;
  },
  
  // 用户注册
  register: (username: string, email: string, password: string) => 
    apiRequest<LoginResponse>(
      config.apiPaths.auth.register, 
      'POST', 
      { username, email, password }
    ),
  
  // 用户登出
  logout: () => apiRequest<void>(config.apiPaths.auth.logout, 'POST'),
};

// 聊天会话API
export const chatApi = {
  // 获取用户的所有聊天会话
  getSessions: () => 
    apiRequest<GetSessionsResponse>(config.apiPaths.chat.sessions),
  
  // 获取特定会话的详情
  getSession: (sessionId: string) => 
    apiRequest<ChatSession>(
      config.apiPaths.chat.session,
      'GET',
      undefined,
      { sessionId }
    ),
  
  // 创建新的聊天会话
  createSession: (title: string) => 
    apiRequest<CreateSessionResponse>(
      config.apiPaths.chat.sessions, 
      'POST', 
      { title }
    ),
  
  // 关闭聊天会话
  closeSession: (sessionId: string) => 
    apiRequest<void>(
      config.apiPaths.chat.session,
      'PUT',
      { status: 'CLOSED' },
      { sessionId }
    ),
  
  // 删除聊天会话
  deleteSession: (sessionId: string) => 
    apiRequest<void>(
      config.apiPaths.chat.session,
      'DELETE',
      undefined,
      { sessionId }
    ),
  
  // 发送消息
  sendMessage: async (sessionId: string, content: string) => {
    const response = await apiRequest<any>(
      config.apiPaths.chat.messages,
      'POST', 
      { 
        session_id: sessionId,
        message: content
      }
    );
    
    // 记录完整的响应，便于调试
    log('发送消息API响应:', response);
    
    // 确保返回的是正确的格式
    return response;
  },
  
  // 获取会话的所有消息
  getMessages: (sessionId: string) => 
    apiRequest<ApiMessage[]>(
      config.apiPaths.chat.messages,
      'GET',
      undefined,
      { sessionId }
    ),
};

// 将API消息转换为应用消息
export const convertApiMessageToMessage = (apiMessage: ApiMessage): Message => {
  return {
    id: apiMessage.id,
    content: apiMessage.content,
    role: apiMessage.messageType === 'USER' ? 'user' : 'assistant',
    timestamp: new Date(apiMessage.createTime),
    messageType: apiMessage.messageType,
    medicalInfo: apiMessage.medicalInfo,
    relatedQuestions: apiMessage.relatedQuestions || [],
  };
}; 
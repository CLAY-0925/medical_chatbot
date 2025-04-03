// 聊天消息类型
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  messageType?: 'USER' | 'BOT';
  medicalInfo?: any;
  relatedQuestions?: string[];
}

// 聊天会话类型
export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  status: 'ACTIVE' | 'CLOSED';
  createTime: string;
  updateTime: string;
  messages?: Message[];
}

// 知识库类型
export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documents: Document[];
}

// 文档类型
export interface Document {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'pdf' | 'image';
  url?: string;
}

// 大模型类型
export type ModelType = 'deepseek' | 'chatgpt4' | 'glm4';

// 应用设置类型
export interface AppSettings {
  theme: 'light' | 'dark';
  model: ModelType;
  enableMedicalAgent: boolean;
  enableIntentPrediction: boolean;
  enableCaseSummary: boolean;
  enableWebSearch: boolean;
}

// 搜索结果类型
export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  url: string;
}

// 病例类型
export interface MedicalCase {
  id: string;
  patientInfo: {
    name?: string;
    age?: number;
    gender?: 'male' | 'female' | 'other';
  };
  symptoms: string[];
  diagnosis?: string;
  treatment?: string;
  notes?: string;
}

// 用户类型
export interface User {
  id: string;
  username: string;
  email?: string;
  token?: string;
}

// 登录请求类型
export interface LoginRequest {
  username: string;
  password: string;
}

// 注册请求类型
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// 通用API响应类型
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// 登录响应类型
export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  username?: string;
}

// 创建会话响应类型
export interface CreateSessionResponse {
  success: boolean;
  message: string;
  sessionId?: string;
  title?: string;
}

// 获取会话列表响应类型
export interface GetSessionsResponse {
  success: boolean;
  sessions?: ChatSession[];
}

// 聊天消息API类型
export interface ApiMessage {
  id: string;
  userId: string;
  sessionId: string;
  messageType: 'USER' | 'BOT';
  content: string;
  medicalInfo: any | null;
  relatedQuestions: string[] | null;
  createTime: string;
} 
import { Message } from '../types';
import { log, logError, getWsUrl } from '../utils/config';

// WebSocket连接状态
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// WebSocket消息处理器
type MessageHandler = (message: Message) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private messageHandlers: MessageHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private sessionId: string | null = null;

  // 获取连接状态
  getStatus(): ConnectionStatus {
    return this.status;
  }

  // 连接WebSocket
  connect(sessionId: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      log('WebSocket已连接');
      return;
    }

    this.sessionId = sessionId;
    this.status = 'connecting';
    
    try {
      const url = getWsUrl(`/chat/ws?sessionId=${sessionId}`);
      log(`正在连接WebSocket: ${url}`);
      
      this.socket = new WebSocket(url);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      logError('WebSocket连接错误:', error);
      this.status = 'error';
      this.attemptReconnect();
    }
  }

  // 断开WebSocket连接
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.status = 'disconnected';
    this.sessionId = null;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.reconnectAttempts = 0;
  }

  // 发送消息
  sendMessage(content: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      logError('WebSocket未连接，无法发送消息');
      return;
    }
    
    const message = {
      type: 'USER_MESSAGE',
      content,
      timestamp: new Date().toISOString()
    };
    
    log('发送WebSocket消息:', message);
    this.socket.send(JSON.stringify(message));
  }

  // 添加消息处理器
  addMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  // 移除消息处理器
  removeMessageHandler(handler: MessageHandler): void {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  // 处理WebSocket打开事件
  private handleOpen(): void {
    log('WebSocket连接成功');
    this.status = 'connected';
    this.reconnectAttempts = 0;
  }

  // 处理WebSocket消息事件
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      log('收到WebSocket消息:', data);
      
      // 将消息转换为应用消息格式
      const message: Message = {
        id: data.id || `msg-${Date.now()}`,
        content: data.content,
        role: data.role || 'assistant',
        timestamp: new Date(data.timestamp || Date.now()),
        messageType: data.messageType || 'ASSISTANT',
        medicalInfo: data.medicalInfo || null,
        relatedQuestions: data.relatedQuestions || [],
      };
      
      // 调用所有消息处理器
      this.messageHandlers.forEach(handler => handler(message));
    } catch (error) {
      logError('处理WebSocket消息错误:', error);
    }
  }

  // 处理WebSocket关闭事件
  private handleClose(event: CloseEvent): void {
    log(`WebSocket连接关闭: ${event.code} ${event.reason}`);
    this.status = 'disconnected';
    this.socket = null;
    
    // 尝试重新连接
    if (event.code !== 1000) { // 1000表示正常关闭
      this.attemptReconnect();
    }
  }

  // 处理WebSocket错误事件
  private handleError(event: Event): void {
    logError('WebSocket错误:', event);
    this.status = 'error';
  }

  // 尝试重新连接
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.sessionId) {
      log('达到最大重连次数或没有会话ID，停止重连');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    log(`将在${delay}ms后尝试重新连接 (尝试 ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.sessionId) {
        this.connect(this.sessionId);
      }
    }, delay);
  }
}

// 导出WebSocket服务实例
export const webSocketService = new WebSocketService(); 
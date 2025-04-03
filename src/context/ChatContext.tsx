import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatSession, Message, CreateSessionResponse, GetSessionsResponse } from '../types';
import { chatApi, convertApiMessageToMessage } from '../services/api';
import { webSocketService, ConnectionStatus } from '../services/websocket';
import { log } from '../utils/config';

interface ChatContextType {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  error: string | null;
  wsStatus: ConnectionStatus;
  createSession: () => void;
  selectSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>('disconnected');

  // 计算当前会话
  const currentSession = currentSessionId
    ? sessions.find(session => session.id === currentSessionId) || null
    : null;

  // 处理WebSocket消息
  const handleWebSocketMessage = (message: Message) => {
    if (currentSessionId) {
      setSessions(prevSessions =>
        prevSessions.map(session => {
          if (session.id === currentSessionId) {
            // 确保messages数组存在
            const messages = session.messages || [];
            
            // 检查消息是否已存在
            const messageExists = messages.some(msg => msg.id === message.id);
            if (messageExists) {
              return session;
            }
            
            return {
              ...session,
              messages: [...messages, message],
              updateTime: new Date().toISOString(),
            };
          }
          return session;
        })
      );
    }
  };

  // 监听WebSocket状态
  useEffect(() => {
    const checkWsStatus = setInterval(() => {
      setWsStatus(webSocketService.getStatus());
    }, 1000);
    
    return () => {
      clearInterval(checkWsStatus);
    };
  }, []);

  // 注册WebSocket消息处理器
  useEffect(() => {
    webSocketService.addMessageHandler(handleWebSocketMessage);
    
    return () => {
      webSocketService.removeMessageHandler(handleWebSocketMessage);
    };
  }, [currentSessionId]);

  // 当会话改变时，连接到相应的WebSocket
  useEffect(() => {
    if (currentSessionId) {
      webSocketService.connect(currentSessionId);
    } else {
      webSocketService.disconnect();
    }
    
    return () => {
      // 组件卸载时断开WebSocket
      webSocketService.disconnect();
    };
  }, [currentSessionId]);

  // 加载会话列表
  const loadSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await chatApi.getSessions();
      if (response.success && response.data && response.data.sessions) {
        // 初始化会话列表，为每个会话添加空的消息数组
        const sessionsWithMessages = response.data.sessions.map(session => ({
          ...session,
          messages: session.messages || [],
        }));
        
        setSessions(sessionsWithMessages);
        
        // 如果有会话，选择第一个
        if (sessionsWithMessages.length > 0 && !currentSessionId) {
          setCurrentSessionId(sessionsWithMessages[0].id);
        }
      } else {
        setError(response.message || '加载会话失败');
      }
    } catch (err) {
      console.error('加载会话失败:', err);
      setError('加载会话时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 加载会话消息
  const loadSessionMessages = async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await chatApi.getMessages(sessionId);
      if (response.success && response.data) {
        // 将API消息转换为应用消息
        const messages = response.data.map(convertApiMessageToMessage);
        
        // 更新会话的消息
        setSessions(prevSessions =>
          prevSessions.map(session => {
            if (session.id === sessionId) {
              return {
                ...session,
                messages,
              };
            }
            return session;
          })
        );
      } else {
        setError(response.message || '加载消息失败');
      }
    } catch (err) {
      console.error('加载消息失败:', err);
      setError('加载消息时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化加载会话
  useEffect(() => {
    loadSessions();
  }, []);

  // 当选择会话时，加载该会话的消息
  useEffect(() => {
    if (currentSessionId) {
      loadSessionMessages(currentSessionId);
    }
  }, [currentSessionId]);

  const createSession = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const title = `新会话 ${sessions.length + 1}`;
      const response = await chatApi.createSession(title);
      
      // 记录完整的响应，便于调试
      log('创建会话响应:', response);
      
      // 将响应转换为any类型，以便访问可能存在的属性
      const anyResponse = response as any;
      
      // 检查响应是否成功，并且是否包含sessionId
      // 首先尝试直接从响应中获取sessionId
      if (response.success && anyResponse.sessionId) {
        // 创建一个新的会话对象
        const newSession: ChatSession = {
          id: anyResponse.sessionId,
          userId: '1', // 假设当前用户ID为1
          title: anyResponse.title || title,
          status: 'ACTIVE',
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
          messages: [],
        };
        
        log('创建新会话:', newSession);
        
        setSessions(prevSessions => [...prevSessions, newSession]);
        setCurrentSessionId(newSession.id);
      } 
      // 然后尝试从data字段获取sessionId
      else if (response.data && response.data.sessionId) {
        // 创建一个新的会话对象
        const newSession: ChatSession = {
          id: response.data.sessionId,
          userId: '1', // 假设当前用户ID为1
          title: response.data.title || title,
          status: 'ACTIVE',
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
          messages: [],
        };
        
        log('创建新会话(从data字段):', newSession);
        
        setSessions(prevSessions => [...prevSessions, newSession]);
        setCurrentSessionId(newSession.id);
      } else {
        setError(response.message || '创建会话失败');
      }
    } catch (err) {
      console.error('创建会话失败:', err);
      setError('创建会话时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  const selectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const deleteSession = async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await chatApi.deleteSession(sessionId);
      
      if (response.success) {
        setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
        
        // 如果删除的是当前会话，则选择第一个会话或者设为null
        if (currentSessionId === sessionId) {
          const remainingSessions = sessions.filter(session => session.id !== sessionId);
          setCurrentSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
        }
      } else {
        setError(response.message || '删除会话失败');
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
      setError('删除会话时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!currentSession) {
      // 如果没有当前会话，则创建一个新会话
      await createSession();
    }
    
    if (!currentSessionId) {
      setError('无法发送消息：没有选择会话');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 先乐观地更新UI
      const tempUserMessage: Message = {
        id: uuidv4(),
        content,
        role: 'user',
        timestamp: new Date(),
      };
      
      setSessions(prevSessions =>
        prevSessions.map(session => {
          if (session.id === currentSessionId) {
            // 确保messages数组存在
            const messages = session.messages || [];
            
            return {
              ...session,
              messages: [...messages, tempUserMessage],
              updateTime: new Date().toISOString(),
            };
          }
          return session;
        })
      );
      
      // 尝试通过WebSocket发送消息
      if (wsStatus === 'connected') {
        webSocketService.sendMessage(content);
        setIsLoading(false);
        return;
      }
      
      // 如果WebSocket未连接，则使用HTTP API
      const response = await chatApi.sendMessage(currentSessionId, content);
      
      // 记录完整的响应，便于调试
      log('发送消息响应:', response);
      
      // 将响应转换为any类型，以便访问可能存在的属性
      const anyResponse = response as any;
      
      if (response.success) {
        // 检查响应中是否包含reply字段
        if (anyResponse.reply) {
          // 将API消息转换为应用消息
          const botMessage = convertApiMessageToMessage(anyResponse.reply);
          
          // 更新会话的消息
          setSessions(prevSessions =>
            prevSessions.map(session => {
              if (session.id === currentSessionId) {
                // 确保messages数组存在
                const messages = session.messages || [];
                
                return {
                  ...session,
                  messages: [...messages, botMessage],
                  updateTime: new Date().toISOString(),
                };
              }
              return session;
            })
          );
          
          log('添加机器人回复:', botMessage);
        } 
        // 如果没有reply字段，则尝试从data字段获取消息
        else if (response.data) {
          // 加载最新的消息列表
          await loadSessionMessages(currentSessionId);
        } 
        // 如果既没有reply字段也没有data字段，则尝试重新加载消息
        else {
          log('响应中没有reply或data字段，尝试重新加载消息');
          await loadSessionMessages(currentSessionId);
        }
      } else {
        setError(response.message || '发送消息失败');
        
        // 回滚乐观更新
        setSessions(prevSessions =>
          prevSessions.map(session => {
            if (session.id === currentSessionId) {
              // 确保messages数组存在
              const messages = session.messages || [];
              
              return {
                ...session,
                messages: messages.filter(msg => msg.id !== tempUserMessage.id),
              };
            }
            return session;
          })
        );
      }
    } catch (err) {
      console.error('发送消息失败:', err);
      setError('发送消息时发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    if (currentSessionId) {
      setSessions(prevSessions =>
        prevSessions.map(session => {
          if (session.id === currentSessionId) {
            return {
              ...session,
              messages: [],
              updateTime: new Date().toISOString(),
            };
          }
          return session;
        })
      );
    }
  };

  return (
    <ChatContext.Provider
      value={{
        sessions,
        currentSession,
        isLoading,
        error,
        wsStatus,
        createSession,
        selectSession,
        deleteSession,
        sendMessage,
        clearMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 
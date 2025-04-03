import React from 'react';
import { Message } from '../../types';
import { FaUser, FaRobot } from 'react-icons/fa';
import IconWrapper from '../common/IconWrapper';

interface ChatMessageProps {
  message: Message;
  onSuggestedQuestionClick?: (question: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSuggestedQuestionClick }) => {
  const isUser = message.role === 'user';
  
  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`flex max-w-[80%] ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        <div
          className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
            isUser
              ? 'bg-primary-main text-white ml-3'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white mr-3'
          }`}
        >
          {isUser ? <IconWrapper icon={FaUser} /> : <IconWrapper icon={FaRobot} />}
        </div>
        
        <div className="flex flex-col">
          <div
            className={`py-3 px-4 rounded-2xl ${
              isUser
                ? 'bg-primary-main text-white rounded-tr-none'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-none'
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
            <div
              className={`text-xs mt-1 ${
                isUser ? 'text-primary-light' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
          
          {/* 相关问题建议 */}
          {!isUser && message.relatedQuestions && message.relatedQuestions.length > 0 && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-1">相关问题：</p>
              <div className="flex flex-wrap gap-2">
                {message.relatedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestedQuestionClick && onSuggestedQuestionClick(question)}
                    className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 
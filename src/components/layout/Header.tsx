import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import { ModelType } from '../../types';
import { FaBars, FaSun, FaMoon } from 'react-icons/fa';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { settings, setModel } = useAppSettings();

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setModel(e.target.value as ModelType);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md py-3 px-4 flex items-center justify-between">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="mr-4 text-gray-700 dark:text-gray-300 hover:text-primary-main dark:hover:text-primary-light transition-colors"
          aria-label="Toggle Sidebar"
        >
          <span className="text-xl">
            <FaBars />
          </span>
        </button>
        <h1 className="text-xl font-bold text-primary-main dark:text-primary-light">
          AI医学知识助手
        </h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <select
            value={settings.model}
            onChange={handleModelChange}
            className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md py-2 px-4 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-primary-main dark:focus:ring-primary-light"
          >
            <option value="deepseek">DeepSeek</option>
            <option value="chatgpt4">ChatGPT-4</option>
            <option value="glm4">GLM-4</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
        
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
        >
          {theme === 'light' ? (
            <span>
              <FaMoon />
            </span>
          ) : (
            <span>
              <FaSun />
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header; 
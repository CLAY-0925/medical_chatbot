import React, { useState } from 'react';
import { useAppSettings } from '../../context/AppSettingsContext';
import { FaTimes, FaSearch, FaFileAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { MedicalCase, SearchResult } from '../../types';

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// 模拟数据
const mockMedicalCase: MedicalCase = {
  id: '1',
  patientInfo: {
    name: '张三',
    age: 45,
    gender: 'male',
  },
  symptoms: ['持续性头痛', '视力模糊', '恶心'],
  diagnosis: '偏头痛',
  treatment: '建议服用布洛芬缓解疼痛，避免强光刺激，保持充分休息',
  notes: '患者有家族偏头痛病史，建议定期复查',
};

const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    title: '偏头痛的症状与治疗 - 医学百科',
    snippet: '偏头痛是一种常见的神经系统疾病，特点是反复发作的中度至重度头痛，通常伴有恶心、呕吐、对光线和声音敏感等症状...',
    url: 'https://example.com/migraine',
  },
  {
    id: '2',
    title: '最新研究：偏头痛与基因变异的关系 - 医学期刊',
    snippet: '最新研究表明，特定基因变异可能与偏头痛的发病机制有关，这为开发新的治疗方法提供了方向...',
    url: 'https://example.com/migraine-research',
  },
  {
    id: '3',
    title: '如何区分偏头痛和紧张性头痛？- 健康指南',
    snippet: '偏头痛和紧张性头痛是两种常见的头痛类型，它们的症状、原因和治疗方法有所不同...',
    url: 'https://example.com/headache-types',
  },
];

const RightPanel: React.FC<RightPanelProps> = ({ isOpen, onClose }) => {
  const { settings } = useAppSettings();
  const [activeTab, setActiveTab] = useState<'case' | 'search'>('case');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-80 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('case')}
                className={`flex items-center text-sm font-medium ${
                  activeTab === 'case'
                    ? 'text-primary-main dark:text-primary-light'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <FaFileAlt className="mr-2" />
                病例信息
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`flex items-center text-sm font-medium ${
                  activeTab === 'search'
                    ? 'text-primary-main dark:text-primary-light'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <FaSearch className="mr-2" />
                搜索结果
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              aria-label="关闭面板"
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'case' && settings.enableCaseSummary && (
              <div className="space-y-4">
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    患者信息
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600 dark:text-gray-400">姓名：</div>
                    <div className="text-gray-900 dark:text-white">{mockMedicalCase.patientInfo.name}</div>
                    <div className="text-gray-600 dark:text-gray-400">年龄：</div>
                    <div className="text-gray-900 dark:text-white">{mockMedicalCase.patientInfo.age}岁</div>
                    <div className="text-gray-600 dark:text-gray-400">性别：</div>
                    <div className="text-gray-900 dark:text-white">
                      {mockMedicalCase.patientInfo.gender === 'male' ? '男' : '女'}
                    </div>
                  </div>
                </div>
                
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    症状
                  </h3>
                  <ul className="list-disc list-inside text-sm text-gray-900 dark:text-white">
                    {mockMedicalCase.symptoms.map((symptom, index) => (
                      <li key={index}>{symptom}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    诊断
                  </h3>
                  <p className="text-sm text-gray-900 dark:text-white">{mockMedicalCase.diagnosis}</p>
                </div>
                
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    治疗方案
                  </h3>
                  <p className="text-sm text-gray-900 dark:text-white">{mockMedicalCase.treatment}</p>
                </div>
                
                {mockMedicalCase.notes && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      备注
                    </h3>
                    <p className="text-sm text-gray-900 dark:text-white">{mockMedicalCase.notes}</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'search' && settings.enableWebSearch && (
              <div className="space-y-4">
                {mockSearchResults.map(result => (
                  <div key={result.id} className="card hover:shadow-lg transition-shadow">
                    <h3 className="text-md font-semibold text-primary-main dark:text-primary-light mb-1">
                      <a href={result.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {result.title}
                      </a>
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{result.snippet}</p>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 dark:text-gray-400 hover:underline truncate block"
                    >
                      {result.url}
                    </a>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'case' && !settings.enableCaseSummary && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FaFileAlt className="text-4xl text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  请在侧边栏启用病例总结功能
                </p>
              </div>
            )}
            
            {activeTab === 'search' && !settings.enableWebSearch && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FaSearch className="text-4xl text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  请在侧边栏启用联网搜索功能
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RightPanel; 
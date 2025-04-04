import React, { useState } from 'react';
import { useAppSettings } from '../../context/AppSettingsContext';
import { FaTimes, FaSearch, FaFileAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { MedicalCase, SearchResult, Message } from '../../types';
import { useChat } from '../../context/ChatContext';
import { Box, Typography, Paper, LinearProgress, Grid, Divider } from '@mui/material';

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

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
  const { currentSession } = useChat();
  const [activeTab, setActiveTab] = useState<'case' | 'search'>('case');

  const latestAssistantMessageWithRecord = currentSession?.messages
    ?.slice()
    .reverse()
    .find(msg => msg.role === 'assistant' && msg.medicalRecord);
    
  const medicalRecord = latestAssistantMessageWithRecord?.medicalRecord;

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
            {activeTab === 'case' && (
              settings.enableCaseSummary ? (
                medicalRecord ? (
                  <Paper elevation={0} sx={{ bgcolor: 'transparent' }}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                        诊疗进度
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            信息收集进度
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={medicalRecord.stage.信息收集} 
                                sx={{ 
                                  height: 8, 
                                  borderRadius: 4,
                                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: '#4CAF50'
                                  }
                                }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 35 }}>
                              {medicalRecord.stage.信息收集}%
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            鉴别诊断进度
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={medicalRecord.stage.鉴别诊断} 
                                sx={{ 
                                  height: 8, 
                                  borderRadius: 4,
                                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: '#2196F3'
                                  }
                                }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 35 }}>
                              {medicalRecord.stage.鉴别诊断}%
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
              
                    <Divider sx={{ my: 2 }} />
              
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                        患者信息
                      </Typography>
                      <Grid container spacing={1}>
                        {Object.entries(medicalRecord.confirmed_info).map(([key, value]) => (
                          value && (
                            <Grid item xs={12} key={key}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.2 }}>
                                {key}
                              </Typography>
                              <Typography variant="body1" sx={{ color: 'text.primary' }}>
                                {value}
                              </Typography>
                            </Grid>
                          )
                        ))}
                      </Grid>
                    </Box>
              
                    <Divider sx={{ my: 2 }} />
              
                    <Box>
                      <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                        待确认信息
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.2 }}>
                            待确认症状
                          </Typography>
                          <Typography variant="body1" sx={{ color: 'warning.main' }}>
                            {medicalRecord.pending_clues.待确认症状}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.2 }}>
                            需澄清细节
                          </Typography>
                          <Typography variant="body1" sx={{ color: 'warning.main' }}>
                            {medicalRecord.pending_clues.需澄清细节}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Paper>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                    <FaFileAlt className="text-4xl mb-4" />
                    <p>当前会话暂无病例信息</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                  <FaFileAlt className="text-4xl mb-4" />
                  <p>请在侧边栏启用病例总结功能</p>
                </div>
              )
            )}
            
            {activeTab === 'search' && (
              settings.enableWebSearch ? (
                <div className="space-y-4">
                  {mockSearchResults.map(result => (
                    <Paper key={result.id} elevation={1} sx={{ p: 2, bgcolor: 'background.default', '&:hover': { boxShadow: 3 } }}>
                      <Typography variant="h6" component="h3" sx={{ mb: 1, color: 'primary.main' }}>
                        <a href={result.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {result.title}
                        </a>
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{result.snippet}</Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ wordBreak: 'break-all' }}>
                        <a href={result.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {result.url}
                        </a>
                      </Typography>
                    </Paper>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                  <FaSearch className="text-4xl mb-4" />
                  <p>请在侧边栏启用联网搜索功能</p>
                </div>
              )
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RightPanel; 
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';

export default function Message({ role, content, image }) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
    >
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mb-1 ${
          isUser 
          ? 'ml-3 bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
          : 'mr-3 bg-slate-800 text-blue-400 border border-slate-700 shadow-xl'
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>
        
        <div className={`relative px-6 py-4 rounded-[2rem] shadow-sm border ${
          isUser
          ? 'bg-blue-600 text-white border-blue-500 rounded-br-none'
          : 'bg-slate-800/50 backdrop-blur-md text-slate-100 border-slate-700/50 rounded-bl-none'
        }`}>
          {image && (
            <div className="mb-4 overflow-hidden rounded-2xl border border-white/10">
              <img src={image} className="max-w-full h-auto object-cover" alt="attachment" />
            </div>
          )}
          
          <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-slate dark:prose-invert'}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
          
          {!isUser && content === '' && (
            <div className="flex space-x-1 items-center py-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

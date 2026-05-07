import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';

export default function Message({ role, content, image }) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-12`}
    >
      <div className={`flex max-w-[90%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-6`}>
        <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${
          isUser 
          ? 'bg-white text-black' 
          : 'bg-white/[0.03] text-blue-500 border border-white/5'
        }`}>
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>
        
        <div className="flex flex-col gap-3">
          {image && (
            <div className="overflow-hidden rounded-3xl border border-white/5 shadow-2xl">
              <img src={image} className="max-w-md h-auto object-cover" alt="attachment" />
            </div>
          )}
          
          <div className={`text-sm leading-relaxed ${isUser ? 'text-white font-medium text-right' : 'text-slate-300'}`}>
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          </div>
          
          {!isUser && content === '' && (
            <div className="flex space-x-2 items-center h-6">
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

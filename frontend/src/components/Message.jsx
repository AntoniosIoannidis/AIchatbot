import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { User, Bot, Copy, Check, Volume2, VolumeX } from 'lucide-react';

export default function Message({ role, content, image }) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!content) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-10 group`}
    >
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>
        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${
          isUser 
          ? 'bg-gradient-to-br from-white to-slate-200 text-black' 
          : 'bg-white/[0.03] text-blue-500 border border-white/10'
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>
        
        <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
          {image && (
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl mb-2 cursor-zoom-in"
            >
              <img src={image} className="max-w-md h-auto object-cover" alt="attachment" />
            </motion.div>
          )}
          
          <div className={`relative px-6 py-4 rounded-3xl text-sm leading-relaxed ${
            isUser 
            ? 'bg-blue-600 text-white font-medium rounded-tr-none' 
            : 'bg-white/[0.03] text-slate-200 border border-white/5 rounded-tl-none backdrop-blur-sm'
          }`}>
            <div className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>

            {/* Actions (Visible on hover for non-user messages) */}
            {!isUser && content && (
              <div className="absolute -bottom-8 left-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={handleCopy}
                  className="p-1.5 text-slate-500 hover:text-white transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
                <button 
                  onClick={handleSpeak}
                  className="p-1.5 text-slate-500 hover:text-white transition-colors"
                  title="Listen"
                >
                  {isSpeaking ? <VolumeX size={14} className="text-blue-500" /> : <Volume2 size={14} />}
                </button>
              </div>
            )}
          </div>
          
          {!isUser && content === '' && (
            <div className="flex space-x-1.5 items-center px-4 py-3 bg-white/[0.03] border border-white/5 rounded-2xl rounded-tl-none">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

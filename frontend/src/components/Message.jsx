import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Copy, Check, Volume2, VolumeX, Sparkles, User } from 'lucide-react';

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
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
    >
      <div className={`bubble ${isUser ? 'bubble-user' : 'bubble-bot'}`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
              <Sparkles size={12} className="text-indigo-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">JimyAI</span>
          </div>
        )}

        {image && (
          <div className="mb-4">
            <img src={image} className="max-w-[400px] w-full rounded-2xl border border-white/10 shadow-xl" alt="attachment" />
          </div>
        )}
        
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>

        {!isUser && content === '' && (
          <div className="flex space-x-2 items-center py-2">
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
          </div>
        )}

        {!isUser && content && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
            <button onClick={handleCopy} className="text-slate-400 hover:text-white transition-all">
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
            <button onClick={handleSpeak} className="text-slate-400 hover:text-white transition-all">
              {isSpeaking ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} />}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

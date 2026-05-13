import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Volume2, VolumeX, Sparkles, User, Terminal } from 'lucide-react';
import { toast } from 'sonner';

export default function Message({ role, content, image }) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCopy = (text, isCode = false) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (isCode) {
      toast.success("Code copied to clipboard");
    } else {
      setCopied(true);
      toast.success("Message copied");
      setTimeout(() => setCopied(false), 2000);
    }
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
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full`}
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
            <img 
              src={image} 
              className="max-w-full sm:max-w-[400px] rounded-2xl border border-white/10 shadow-xl" 
              alt="attachment" 
            />
          </div>
        )}
        
        <div className="prose prose-invert max-w-none prose-sm sm:prose-base">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                
                if (!inline && language) {
                  return (
                    <div className="relative group my-4 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117]">
                      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <Terminal size={12} className="text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language}</span>
                        </div>
                        <button 
                          onClick={() => handleCopy(String(children).replace(/\n$/, ''), true)}
                          className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={language}
                        PreTag="div"
                        className="!bg-transparent !m-0 !p-4 !text-sm custom-scrollbar"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  );
                }
                return (
                  <code className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-300 font-medium" {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
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
            <button 
              onClick={() => handleCopy(content)} 
              className="text-slate-400 hover:text-white transition-all flex items-center gap-1.5"
              title="Copy Message"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              <span className="text-[10px] font-bold uppercase tracking-wider">Copy</span>
            </button>
            <button 
              onClick={handleSpeak} 
              className="text-slate-400 hover:text-white transition-all flex items-center gap-1.5"
              title="Speak Message"
            >
              {isSpeaking ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} />}
              <span className="text-[10px] font-bold uppercase tracking-wider">{isSpeaking ? 'Stop' : 'Speak'}</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

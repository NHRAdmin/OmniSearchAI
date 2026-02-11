
import React from 'react';
import { ChatMessage, MessageRole } from '../types';
import GroundingSources from './GroundingSources';

interface ChatBubbleProps {
  message: ChatMessage;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === MessageRole.USER;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-2xl shadow-sm ${
          isUser 
            ? 'bg-blue-600 text-white rounded-tr-none' 
            : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
        }`}>
          {message.isDeepSearch && !isUser && (
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-purple-400 uppercase tracking-widest bg-slate-900/50 px-2 py-1 rounded w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              Deep Search Agent
            </div>
          )}
          <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
          {!isUser && message.sources && <GroundingSources sources={message.sources} />}
        </div>
        <span className="text-[10px] text-slate-500 mt-1 font-medium px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default ChatBubble;

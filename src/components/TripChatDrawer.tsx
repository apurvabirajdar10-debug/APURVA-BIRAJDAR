import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User, Minimize2, Maximize2, Compass } from 'lucide-react';
import { Trip } from '../types/travel';
import { api } from '../lib/api';

interface TripChatDrawerProps {
  trip: Trip | null;
  isOpen: boolean;
  onToggle: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

const QUICK_PROMPTS = [
  'What should I pack for this trip?',
  'Recommend local dinners near our sights',
  'Best transit tips between our cities',
  'Indoor backups in case of rain',
];

export const TripChatDrawer: React.FC<TripChatDrawerProps> = ({
  trip,
  isOpen,
  onToggle,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content: trip
        ? `Hello! I'm your Globe Trotter Assistant for **${trip.name}**. Ask me anything about your ${trip.stops?.length || 0} cities, restaurant picks, transit tricks, or packing tips!`
        : `Hello! I am your Globe Trotter travel concierge. Feel free to ask about any city, packing lists, transit advice, or dining ideas!`,
      time: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.sendTripChat(trip?.id, text, historyPayload);

      const aiMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: res.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: 'I had trouble connecting to the travel knowledge base. Please try asking again in a moment.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  // If closed, render floating trigger button
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 text-white rounded-full shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
      >
        <Sparkles className="w-5 h-5 text-amber-300 animate-pulse-glow" />
        <span className="text-xs font-bold tracking-wide">Trip Assistant</span>
        {trip && (
          <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1 animate-ping" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full sm:w-96 max-w-[calc(100vw-2rem)] h-[540px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 text-white flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h3 className="font-bold text-xs">Conversational Concierge</h3>
            <p className="text-[10px] text-white/80 truncate max-w-[190px]">
              {trip ? `Context: ${trip.name}` : 'General Travel Advisor'}
            </p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[10px] font-medium shrink-0 hover:bg-violet-50 hover:border-violet-200 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-2 ${
              msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs ${
                msg.role === 'user' ? 'bg-sky-600 text-white' : 'bg-violet-600 text-white'
              }`}
            >
              {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-sky-600 text-white rounded-br-xs shadow-xs'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-2xs whitespace-pre-line'
              }`}
            >
              {msg.content}
              <div
                className={`text-[9px] mt-1 text-right ${
                  msg.role === 'user' ? 'text-sky-200' : 'text-slate-400'
                }`}
              >
                {msg.time}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2 text-xs text-slate-500 flex items-center space-x-1.5 shadow-2xs">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce delay-100" />
              <div className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce delay-200" />
              <span className="text-[10px] ml-1">Globe Trotter is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 bg-white border-t border-slate-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about stops, dining, transit..."
            disabled={loading}
            className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { sendMessage, subscribeToMessages } from '../services/chatService';
import { Message } from '../types';
import { Send } from 'lucide-react';

interface ChatWindowProps {
  currentUserId: string;
  targetUserId: string;
  onClose: () => void;
}

export default function ChatWindow({ currentUserId, targetUserId, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(currentUserId, targetUserId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [currentUserId, targetUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    await sendMessage(currentUserId, targetUserId, newMessage);
    setNewMessage('');
  };

  return (
    <div className="fixed bottom-20 right-4 w-80 h-96 bg-quantum-card border border-quantum-cyan rounded-2xl shadow-2xl flex flex-col z-50">
      <div className="p-3 border-b border-white/10 flex justify-between items-center text-white font-bold">
        <span>Chat</span>
        <button onClick={onClose}>X</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={`p-2 rounded-lg text-sm ${m.senderId === currentUserId ? 'bg-quantum-cyan/20 ml-auto' : 'bg-white/10 mr-auto'}`}>
            {m.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-2 border-t border-white/10 flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 bg-white/5 rounded-lg px-2 py-1 text-sm text-white"
          placeholder="Mensagem..."
        />
        <button onClick={handleSend} className="p-1 text-quantum-cyan">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

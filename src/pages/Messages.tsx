import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Paperclip,
  Image as ImageIcon,
  Mic,
  Smile,
  Search,
  Plus,
  MoreVertical,
  CheckCheck,
  Users,
  Settings
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';

export interface ChatMessage {
  id: string;
  senderName: string;
  senderAvatar: string;
  isMe: boolean;
  text: string;
  timestamp: string;
}

export interface ConversationItem {
  id: string;
  title: string;
  isGroup: boolean;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

const initialConversations: ConversationItem[] = [
  {
    id: 'conv-1',
    title: 'Team Alpha: group',
    isGroup: true,
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=120',
    lastMessage: 'Google feedback looks good for Liam...',
    timestamp: '1h ago',
    unreadCount: 3,
  },
  {
    id: 'conv-2',
    title: 'Ervara Mahiral',
    isGroup: false,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    lastMessage: 'Are the assignments ready for review?',
    timestamp: '1h ago',
    unreadCount: 0,
  },
  {
    id: 'conv-3',
    title: 'Liam Hayes',
    isGroup: false,
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=120',
    lastMessage: 'Finalize Amazon candidate shortlist...',
    timestamp: '1h ago',
    unreadCount: 1,
  },
  {
    id: 'conv-4',
    title: 'Jamel Names',
    isGroup: false,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    lastMessage: 'Meeting scheduled for tomorrow 10 AM...',
    timestamp: '1h ago',
    unreadCount: 1,
  },
];

const initialMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    senderName: 'Ervara',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    isMe: false,
    text: 'Hi Team, the Google technical round feedback looks good for Liam.',
    timestamp: '10:14 AM',
  },
  {
    id: 'msg-2',
    senderName: 'Liam',
    senderAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=120',
    isMe: false,
    text: 'Yes, and the Amazon EE role results are in. Finalizing.',
    timestamp: '10:15 AM',
  },
  {
    id: 'msg-3',
    senderName: 'Me',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    isMe: true,
    text: 'Great work, Team. Finalize the Amazon list and check the Python assignments.',
    timestamp: '10:16 AM',
  },
];

export const MessagesPage: React.FC = () => {
  const { success, info } = useToast();
  const [conversations, setConversations] = useState<ConversationItem[]>(initialConversations);
  const [activeConv, setActiveConv] = useState<ConversationItem>(initialConversations[0]);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewConvOpen, setIsNewConvOpen] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderName: 'Me',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
      isMe: true,
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, newMsg]);
    setInputText('');
    success('Message Sent', 'Sent message to conversation thread.');
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Messages' }, { label: 'Team Chats' }]} />
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-1">
            Internal Messaging Console
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              Live Team Channel
            </span>
          </h1>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsNewConvOpen(true)}
          className="font-extrabold text-xs"
        >
          Start New Conversation
        </Button>
      </div>

      {/* THREE COLUMN MESSAGING CHAT LAYOUT strictly matching Design Internal Messaging.jpg */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (3.5 cols): Active Conversations List */}
        <Card className="lg:col-span-4 p-5 space-y-4 bg-[#101726] border-[#202D42] flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-white border-b border-[#202D42] pb-3">
              Active Conversations
            </h2>
            <SearchInput
              placeholder="Search contacts & groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="space-y-2 pt-1">
              {conversations.map((conv) => {
                const isActive = conv.id === activeConv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 border ${
                      isActive
                        ? 'bg-[#162032] border-[#A3E635]/60 shadow-[0_0_12px_rgba(163,230,53,0.2)]'
                        : 'bg-[#101726] border-[#202D42] hover:bg-[#162032]/60'
                    }`}
                  >
                    <Avatar src={conv.avatar} name={conv.title} size="md" online />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-white text-xs truncate">{conv.title}</h4>
                        <span className="text-[10px] text-[#64748B] font-bold">{conv.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">{conv.lastMessage}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="bg-[#A3E635] text-[#0B0F17] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* MIDDLE COLUMN (5 cols): Active Chat Window strictly matching design */}
        <Card className="lg:col-span-5 p-5 space-y-4 border-[#202D42] flex flex-col justify-between">
          
          {/* Chat Window Header */}
          <div className="flex items-center justify-between border-b border-[#202D42] pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-white">Conversation: {activeConv.title}</h3>
              <p className="text-[10px] text-[#A3E635]">4 Active Team Members Online</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => info('Chat Settings', 'Opened thread settings.')}>
              <MoreVertical className="w-4 h-4 text-[#94A3B8]" />
            </Button>
          </div>

          {/* Messages Thread Container */}
          <div className="space-y-4 py-2 min-h-[300px] max-h-[420px] overflow-y-auto pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 items-end ${msg.isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!msg.isMe && <Avatar src={msg.senderAvatar} name={msg.senderName} size="xs" />}
                
                <div
                  className={`p-4 rounded-2xl max-w-[80%] text-xs space-y-1 ${
                    msg.isMe
                      ? 'bg-[#A3E635] text-[#0B0F17] rounded-br-none shadow-[0_0_15px_rgba(163,230,53,0.3)] font-medium'
                      : 'bg-[#101726] border border-[#202D42] text-white rounded-bl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-extrabold text-[10px] uppercase opacity-80">{msg.senderName}</span>
                    <span className="text-[9px] opacity-70">{msg.timestamp}</span>
                  </div>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input Bar strictly matching Design Internal Messaging.jpg */}
          <form onSubmit={handleSendMessage} className="space-y-2 pt-2 border-t border-[#202D42]">
            <div className="bg-[#101726] border border-[#202D42] rounded-2xl p-2.5 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-transparent text-xs text-white placeholder-[#64748B] outline-none px-2"
              />

              <div className="flex items-center gap-1 text-[#94A3B8]">
                <button
                  type="button"
                  onClick={() => info('Attachment', 'Select PDF or document to upload')}
                  className="p-1.5 hover:text-white transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => info('Image Upload', 'Select image artifact')}
                  className="p-1.5 hover:text-white transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => info('Voice Note', 'Microphone recording active')}
                  className="p-1.5 hover:text-white transition-colors"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              <Button type="submit" variant="primary" size="sm" className="font-extrabold px-4 text-xs">
                Send
              </Button>
            </div>
          </form>

        </Card>

        {/* RIGHT COLUMN (3.5 cols): Chat Details Panel strictly matching design */}
        <Card className="lg:col-span-3 p-5 space-y-4 bg-[#101726] border-[#202D42]">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-white border-b border-[#202D42] pb-3">
            Chat Details: {activeConv.title}
          </h3>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-[#162032] border border-[#202D42]">
              <Avatar src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" name="Ervara" size="sm" online />
              <div>
                <span className="font-bold text-white text-xs block">Ervara Mahiral</span>
                <span className="text-[10px] text-[#A3E635]">Contributor • Online</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 rounded-xl bg-[#162032] border border-[#202D42]">
              <Avatar src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=120" name="Liam" size="sm" online />
              <div>
                <span className="font-bold text-white text-xs block">Liam Hayes</span>
                <span className="text-[10px] text-[#A3E635]">Contributor • Online</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 rounded-xl bg-[#162032] border border-[#202D42]">
              <Avatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120" name="Jamel" size="sm" online />
              <div>
                <span className="font-bold text-white text-xs block">Jamel Names</span>
                <span className="text-[10px] text-[#A3E635]">Contributor • Online</span>
              </div>
            </div>
          </div>
        </Card>

      </div>

      {/* FOOTER ACTIONS BAR strictly matching Design Internal Messaging.jpg */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#202D42]">
        <Button variant="secondary" size="md" onClick={() => info('Conversation Settings', 'Thread settings opened.')}>
          Conversation Settings
        </Button>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4 text-[#0B0F17]" />}
          onClick={() => setIsNewConvOpen(true)}
          className="px-6 font-extrabold shadow-[0_0_15px_rgba(163,230,53,0.3)]"
        >
          Start New Conversation
        </Button>
      </div>

      {/* NEW CONVERSATION MODAL */}
      <Modal
        isOpen={isNewConvOpen}
        onClose={() => setIsNewConvOpen(false)}
        title="Start New Conversation"
        subtitle="Initiate a private or group chat thread."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setIsNewConvOpen(false);
            success('Chat Started', 'New conversation thread initiated.');
          }}
          className="space-y-4"
        >
          <Input label="Group / Participant Name" placeholder="e.g. Placement Team Channel" required />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={() => setIsNewConvOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Start Chat
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

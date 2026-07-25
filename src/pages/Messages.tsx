import React, { useState, useEffect, useRef } from 'react';
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
  Settings,
  RefreshCw,
  Trash2,
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import {
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
  createConversation,
  markMessageRead,
} from '../api/chat.api';

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

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  // API State
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [loadingConvs, setLoadingConvs] = useState<boolean>(true);
  const [loadingMsgs, setLoadingMsgs] = useState<boolean>(false);
  const [sendingMsg, setSendingMsg] = useState<boolean>(false);

  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewConvOpen, setIsNewConvOpen] = useState(false);
  const [newConvTitle, setNewConvTitle] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversationsData = async () => {
    setLoadingConvs(true);
    try {
      const res = await getConversations();
      const rawList = res.data?.conversations || [];

      const formattedList: ConversationItem[] = rawList.map((c: any) => ({
        id: c.id,
        title: c.title || (c.participants?.[0]?.users?.full_name ? c.participants[0].users.full_name : 'Team Channel'),
        isGroup: !!c.is_group,
        avatar: c.avatar_url || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=120',
        lastMessage: c.last_message || 'Active conversation thread.',
        timestamp: c.updated_at ? new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
        unreadCount: c.unread_count || 0,
      }));

      setConversations(formattedList);
      if (formattedList.length > 0 && !activeConv) {
        setActiveConv(formattedList[0]);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load conversations list.';
      toastError('Error Loading Conversations', msg);
    } finally {
      setLoadingConvs(false);
    }
  };

  const fetchMessagesForConv = async (convId: string) => {
    setLoadingMsgs(true);
    try {
      const res = await getMessages(convId);
      const rawMsgs = res.data?.messages || [];

      const formattedMsgs: ChatMessage[] = rawMsgs.map((m: any) => ({
        id: m.id,
        senderName: m.sender?.full_name || m.sender?.name || (m.sender_id === user?.id ? 'Me' : 'Team Member'),
        senderAvatar: m.sender?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
        isMe: m.sender_id === user?.id,
        text: m.content || m.text || '',
        timestamp: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
      }));

      setMessages(formattedMsgs);
    } catch (err: any) {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    fetchConversationsData();
  }, []);

  useEffect(() => {
    if (activeConv) {
      fetchMessagesForConv(activeConv.id);
    }
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    const contentToSend = inputText;
    setInputText('');
    setSendingMsg(true);

    try {
      const res = await sendMessage({
        conversation_id: activeConv.id,
        content: contentToSend,
      });

      const newMsgItem: ChatMessage = {
        id: res.data?.message?.id || `msg-${Date.now()}`,
        senderName: 'Me',
        senderAvatar: user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
        isMe: true,
        text: contentToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, newMsgItem]);
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConv.id ? { ...c, lastMessage: contentToSend, timestamp: 'Now' } : c))
      );
    } catch (err: any) {
      toastError('Send Error', err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleCreateNewConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConvTitle) return;

    try {
      const res = await createConversation({
        title: newConvTitle,
        participant_ids: [],
        is_group: true,
      });

      setIsNewConvOpen(false);
      setNewConvTitle('');
      success('Conversation Started', `Created chat room "${newConvTitle}".`);
      fetchConversationsData();
    } catch (err: any) {
      toastError('Error', err.response?.data?.message || 'Failed to create conversation.');
    }
  };

  const handleDeleteMsg = async (msgId: string) => {
    try {
      await deleteMessage(msgId);
      setMessages(messages.filter((m) => m.id !== msgId));
      success('Message Deleted', 'Message removed from chat thread.');
    } catch (err: any) {
      toastError('Delete Error', err.response?.data?.message || 'Failed to delete message.');
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
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

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loadingConvs ? 'animate-spin' : ''}`} />}
            onClick={fetchConversationsData}
            disabled={loadingConvs}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsNewConvOpen(true)}
            className="font-extrabold text-xs shrink-0"
          >
            Start New Conversation
          </Button>
        </div>
      </div>

      {/* THREE COLUMN MESSAGING CHAT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (4 cols): Active Conversations List */}
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

            <div className="space-y-2 pt-1 max-h-[500px] overflow-y-auto">
              {loadingConvs ? (
                <p className="text-xs text-[#94A3B8] text-center py-6">Loading conversations...</p>
              ) : conversations.length === 0 ? (
                <p className="text-xs text-[#94A3B8] text-center py-6">No active conversations found.</p>
              ) : (
                conversations.map((conv) => {
                  const isActive = activeConv?.id === conv.id;
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
                })
              )}
            </div>
          </div>
        </Card>

        {/* MIDDLE COLUMN (8 cols): Active Chat Window */}
        <Card className="lg:col-span-8 p-5 space-y-4 border-[#202D42] flex flex-col justify-between min-h-[550px]">
          {activeConv ? (
            <>
              {/* Chat Window Header */}
              <div className="flex items-center justify-between border-b border-[#202D42] pb-3">
                <div className="flex items-center gap-3">
                  <Avatar src={activeConv.avatar} name={activeConv.title} size="md" online />
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{activeConv.title}</h3>
                    <p className="text-[10px] text-[#A3E635]">Live Channel Session</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[#94A3B8]">
                  <button className="p-1.5 rounded-lg hover:bg-[#202D42] hover:text-white">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Messages Timeline */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 my-2 max-h-[380px]">
                {loadingMsgs ? (
                  <p className="text-xs text-[#94A3B8] text-center py-10">Loading message history...</p>
                ) : messages.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] text-center py-10">No messages in this chat thread yet. Say hello!</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 text-xs ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <Avatar src={msg.senderAvatar} name={msg.senderName} size="sm" />
                      <div className={`max-w-[75%] space-y-1 ${msg.isMe ? 'text-right' : 'text-left'}`}>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
                          <span className="font-bold text-[#94A3B8]">{msg.senderName}</span>
                          <span>•</span>
                          <span>{msg.timestamp}</span>
                        </div>

                        <div
                          className={`p-3 rounded-2xl inline-block leading-relaxed relative group ${
                            msg.isMe
                              ? 'bg-[#A3E635] text-[#0B0F17] font-semibold rounded-tr-none'
                              : 'bg-[#101726] border border-[#202D42] text-white rounded-tl-none'
                          }`}
                        >
                          <p>{msg.text}</p>
                          {msg.isMe && (
                            <button
                              onClick={() => handleDeleteMsg(msg.id)}
                              className="absolute -left-7 top-2 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-rose-500/10 rounded-md"
                              title="Delete Message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="pt-3 border-t border-[#202D42] flex items-center gap-2">
                <Input
                  placeholder="Write a message to team thread..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  leftIcon={<Send className="w-4 h-4" />}
                  isLoading={sendingMsg}
                  disabled={!inputText.trim() || sendingMsg}
                >
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-[#94A3B8] text-sm">
              Select a conversation to open chat thread.
            </div>
          )}
        </Card>
      </div>

      {/* START NEW CONVERSATION MODAL */}
      <Modal
        isOpen={isNewConvOpen}
        onClose={() => setIsNewConvOpen(false)}
        title="Start New Conversation"
        subtitle="Create a direct message or group channel."
      >
        <form onSubmit={handleCreateNewConversation} className="space-y-4">
          <Input
            label="Chat Room / Contact Name"
            placeholder="e.g. Placement Core Team"
            value={newConvTitle}
            onChange={(e) => setNewConvTitle(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={() => setIsNewConvOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Create Channel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

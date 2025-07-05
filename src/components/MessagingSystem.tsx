import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  Search, 
  Users, 
  Phone, 
  Video, 
  MoreVertical,
  Paperclip,
  Image,
  Smile,
  ArrowLeft,
  Online,
  Badge,
  Star,
  Calendar,
  MapPin,
  CheckCheck,
  Check
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  type: 'text' | 'image' | 'file' | 'system';
  edited_at?: string;
  deleted_at?: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    verified: boolean;
  };
}

interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'event' | 'space';
  name?: string;
  created_at: string;
  updated_at: string;
  event_id?: string;
  space_id?: string;
  participants?: {
    user_id: string;
    role: 'admin' | 'moderator' | 'member';
    joined_at: string;
    last_read_message_id?: string;
    user: {
      id: string;
      full_name: string;
      avatar_url?: string;
      verified: boolean;
    };
  }[];
  last_message?: Message;
  unread_count?: number;
}

interface MessagingSystemProps {
  isOpen: boolean;
  onClose: () => void;
  initialConversationId?: string;
}

const MessagingSystem: React.FC<MessagingSystemProps> = ({
  isOpen,
  onClose,
  initialConversationId
}) => {
  const { user } = useAuthContext();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(initialConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadConversations();
      setupRealtimeSubscription();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      markAsRead(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations!inner(
            id,
            type,
            name,
            created_at,
            updated_at,
            event_id,
            space_id
          )
        `)
        .eq('user_id', user.id);

      if (data) {
        const conversationIds = data.map(d => d.conversation_id);
        
        // Load full conversation details with participants
        const { data: fullConversations } = await supabase
          .from('conversations')
          .select(`
            *,
            participants:conversation_participants(
              user_id,
              role,
              joined_at,
              last_read_message_id,
              user:profiles!conversation_participants_user_id_fkey(
                id,
                full_name,
                avatar_url,
                verified
              )
            )
          `)
          .in('id', conversationIds)
          .order('updated_at', { ascending: false });

        setConversations(fullConversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(
            id,
            full_name,
            avatar_url,
            verified
          )
        `)
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('sent_at', { ascending: true })
        .limit(50);

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.conversation_id === selectedConversation) {
            setMessages(prev => [...prev, newMessage]);
          }
          // Update conversation list
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: selectedConversation,
          sender_id: user.id,
          content: newMessage.trim(),
          type: 'text'
        }]);

      if (error) throw error;

      setNewMessage('');
      messageInputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      // Get the latest message in the conversation
      const { data: latestMessage } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: false })
        .limit(1)
        .single();

      if (latestMessage) {
        await supabase
          .from('conversation_participants')
          .update({ last_read_message_id: latestMessage.id })
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants?.find(p => p.user_id !== user?.id);
      return otherParticipant?.user.full_name || 'Unknown User';
    }
    
    return `${conversation.type} conversation`;
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants?.find(p => p.user_id !== user?.id);
      return otherParticipant?.user.avatar_url || 'https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=100';
    }
    
    return 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=100';
  };

  const filteredConversations = conversations.filter(conv =>
    getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="h-full flex">
        {/* Conversations Sidebar */}
        <div className={`${showMobileChat ? 'hidden' : 'flex'} lg:flex w-full lg:w-1/3 border-r border-forest-100 flex-col`}>
          {/* Header */}
          <div className="p-4 border-b border-forest-100 bg-gradient-to-r from-forest-50 to-earth-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-forest-800">Messages</h2>
              <button
                onClick={onClose}
                className="lg:hidden p-2 text-forest-600 hover:bg-forest-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-forest-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white/80"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-forest-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-forest-800 mb-2">No conversations</h3>
                <p className="text-forest-600">Start a conversation by joining events or booking spaces!</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => {
                    setSelectedConversation(conversation.id);
                    setShowMobileChat(true);
                  }}
                  className={`w-full p-4 text-left hover:bg-forest-50 transition-colors border-b border-forest-50/50 ${
                    selectedConversation === conversation.id ? 'bg-forest-100 border-r-4 border-r-forest-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <img
                        src={getConversationAvatar(conversation)}
                        alt={getConversationName(conversation)}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {conversation.type === 'group' && (
                        <div className="absolute -bottom-1 -right-1 bg-earth-400 text-white p-1 rounded-full">
                          <Users className="h-2 w-2" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-forest-800 truncate">
                          {getConversationName(conversation)}
                        </h4>
                        <span className="text-xs text-forest-500">
                          {conversation.last_message && formatTime(conversation.last_message.sent_at)}
                        </span>
                      </div>
                      
                      {conversation.type === 'group' && (
                        <p className="text-xs text-forest-500 mb-1">
                          {conversation.participants?.length} participants
                        </p>
                      )}
                      
                      <p className="text-sm text-forest-600 truncate">
                        {conversation.last_message?.content || 'No messages yet'}
                      </p>
                      
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <div className="mt-2">
                          <span className="bg-earth-500 text-white text-xs px-2 py-1 rounded-full">
                            {conversation.unread_count}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${showMobileChat ? 'flex' : 'hidden'} lg:flex flex-1 flex-col`}>
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-forest-100 bg-gradient-to-r from-forest-50 to-earth-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowMobileChat(false)}
                      className="lg:hidden p-2 text-forest-600 hover:bg-white/60 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    
                    <img
                      src={getConversationAvatar(selectedConv)}
                      alt={getConversationName(selectedConv)}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    
                    <div>
                      <h3 className="font-semibold text-forest-800">
                        {getConversationName(selectedConv)}
                      </h3>
                      <p className="text-sm text-forest-600">
                        {selectedConv.type === 'group' 
                          ? `${selectedConv.participants?.length} participants`
                          : 'Direct message'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {selectedConv.type === 'direct' && (
                      <>
                        <button className="p-2 text-forest-600 hover:bg-white/60 rounded-lg transition-colors">
                          <Phone className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-forest-600 hover:bg-white/60 rounded-lg transition-colors">
                          <Video className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button className="p-2 text-forest-600 hover:bg-white/60 rounded-lg transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-forest-25">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end space-x-2 max-w-xs sm:max-w-md ${
                      message.sender_id === user?.id ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                    }`}>
                      {message.sender_id !== user?.id && (
                        <img
                          src={message.sender?.avatar_url || 'https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=100'}
                          alt={message.sender?.full_name || 'User'}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      
                      <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                        message.sender_id === user?.id
                          ? 'bg-gradient-to-r from-forest-600 to-forest-700 text-white'
                          : 'bg-white text-forest-800 border border-forest-100'
                      }`}>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <div className={`flex items-center justify-between mt-2 ${
                          message.sender_id === user?.id ? 'text-forest-200' : 'text-forest-500'
                        }`}>
                          <p className="text-xs">{formatTime(message.sent_at)}</p>
                          {message.sender_id === user?.id && (
                            <div className="flex items-center ml-2">
                              <CheckCheck className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-forest-100 bg-gradient-to-r from-forest-50 to-earth-50">
                <div className="flex items-end space-x-3">
                  <div className="flex space-x-2">
                    <button className="p-2 text-forest-600 hover:bg-white/60 rounded-lg transition-colors">
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-forest-600 hover:bg-white/60 rounded-lg transition-colors">
                      <Image className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="flex-1 relative">
                    <input
                      ref={messageInputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      className="w-full px-4 py-3 pr-12 border border-forest-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white/80 backdrop-blur-sm"
                    />
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-forest-600 hover:bg-forest-100 rounded-lg transition-colors">
                      <Smile className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || loading}
                    className={`p-3 rounded-2xl transition-all duration-200 transform hover:scale-105 ${
                      newMessage.trim() && !loading
                        ? 'bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-700 hover:to-forest-800 text-white shadow-sm hover:shadow-md'
                        : 'bg-forest-200 text-forest-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-forest-25 to-earth-25">
              <div className="text-center max-w-md mx-auto p-8">
                <div className="bg-forest-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="h-10 w-10 text-forest-600" />
                </div>
                <h3 className="text-xl font-semibold text-forest-800 mb-2">
                  Select a conversation
                </h3>
                <p className="text-forest-600 mb-6">
                  Choose a conversation from the sidebar to start messaging.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingSystem;
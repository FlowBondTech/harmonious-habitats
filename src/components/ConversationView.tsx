import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  Video, 
  MoreVertical, 
  Info, 
  Users, 
  Badge, 
  Calendar,
  CheckCheck,
  Clock,
  Heart,
  ThumbsUp,
  MessageSquare,
  Reply,
  Trash2,
  Edit,
  Copy,
  AlertTriangle,
  Image as ImageIcon,
  FileText,
  Download,
  User
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase } from '../lib/supabase';
import MessageComposer from './MessageComposer';

interface ConversationViewProps {
  conversationId: string | null;
  onBack: () => void;
  onInfoClick?: () => void;
}

const ConversationView: React.FC<ConversationViewProps> = ({
  conversationId,
  onBack,
  onInfoClick
}) => {
  const { user } = useAuthContext();
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [showContextMenu, setShowContextMenu] = useState<{id: string, x: number, y: number} | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId && user) {
      loadConversation();
      loadMessages();
      markAsRead();
      setupRealtimeSubscription();
    }
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    if (!conversationId || !user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user_id,
            role,
            joined_at,
            typing_at,
            user:profiles!conversation_participants_user_id_fkey(
              id,
              full_name,
              avatar_url,
              verified,
              username
            )
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      setConversation(data);
    } catch (error) {
      console.error('Error loading conversation:', error);
      setError('Failed to load conversation');
    }
  };

  const loadMessages = async () => {
    if (!conversationId || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(
            id,
            full_name,
            avatar_url,
            verified
          ),
          attachments:message_attachments(*)
        `)
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('sent_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!conversationId || !user) return;

    try {
      await supabase.rpc('mark_messages_as_read', {
        p_conversation_id: conversationId,
        p_user_id: user.id
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!conversationId) return;

    // Subscribe to new messages
    const messageSubscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          // Fetch the complete message with sender info
          fetchMessage(payload.new.id);
        }
      )
      .subscribe();

    // Subscribe to typing indicators
    const typingSubscription = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_participants',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          updateTypingUsers();
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
      typingSubscription.unsubscribe();
    };
  };

  const fetchMessage = async (messageId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(
            id,
            full_name,
            avatar_url,
            verified
          ),
          attachments:message_attachments(*)
        `)
        .eq('id', messageId)
        .single();

      if (error) throw error;
      
      if (data) {
        setMessages(prev => [...prev, data]);
        markAsRead();
      }
    } catch (error) {
      console.error('Error fetching new message:', error);
    }
  };

  const updateTypingUsers = async () => {
    if (!conversationId || !user) return;

    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          user_id,
          typing_at,
          user:profiles!conversation_participants_user_id_fkey(
            full_name
          )
        `)
        .eq('conversation_id', conversationId)
        .not('user_id', 'eq', user.id)
        .not('typing_at', 'is', null);

      if (error) throw error;
      
      // Only consider users who were typing in the last 5 seconds
      const fiveSecondsAgo = new Date();
      fiveSecondsAgo.setSeconds(fiveSecondsAgo.getSeconds() - 5);
      
      const recentTypers = data?.filter(p => 
        p.typing_at && new Date(p.typing_at) > fiveSecondsAgo
      ) || [];
      
      setTypingUsers(recentTypers.map(p => p.user.full_name));
    } catch (error) {
      console.error('Error updating typing users:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const shouldShowDate = (index: number) => {
    if (index === 0) return true;
    
    const currentDate = new Date(messages[index].sent_at).toDateString();
    const prevDate = new Date(messages[index - 1].sent_at).toDateString();
    
    return currentDate !== prevDate;
  };

  const handleReaction = async (messageId: string, reaction: string) => {
    if (!user) return;

    try {
      // Check if reaction already exists
      const { data: existingReaction } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('reaction', reaction)
        .single();

      if (existingReaction) {
        // Remove reaction
        await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id)
          .eq('reaction', reaction);
      } else {
        // Add reaction
        await supabase
          .from('message_reactions')
          .insert([{
            message_id: messageId,
            user_id: user.id,
            reaction
          }]);
      }

      setShowReactions(null);
      // Reload messages to show updated reactions
      loadMessages();
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    setShowContextMenu({
      id: messageId,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;
      
      // Update the message in the UI
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: 'This message was deleted', deleted_at: new Date().toISOString() } 
          : msg
      ));
      
      setShowContextMenu(null);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    setShowContextMenu(null);
  };

  const getConversationName = () => {
    if (!conversation) return '';
    
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants?.find(
        (p: any) => p.user_id !== user?.id
      );
      return otherParticipant?.user?.full_name || 'Unknown User';
    }
    
    if (conversation.type === 'event') {
      return 'Event Chat';
    }
    
    if (conversation.type === 'space') {
      return 'Space Chat';
    }
    
    return 'Group Chat';
  };

  const getConversationAvatar = () => {
    if (!conversation) return '';
    
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants?.find(
        (p: any) => p.user_id !== user?.id
      );
      return otherParticipant?.user?.avatar_url || 'https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=100';
    }
    
    if (conversation.type === 'event') {
      return 'https://images.pexels.com/photos/3822647/pexels-photo-3822647.jpeg?auto=compress&cs=tinysrgb&w=100';
    }
    
    if (conversation.type === 'space') {
      return 'https://images.pexels.com/photos/8633077/pexels-photo-8633077.jpeg?auto=compress&cs=tinysrgb&w=100';
    }
    
    return 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=100';
  };

  const getTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    } else {
      return 'Several people are typing...';
    }
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-forest-25 to-earth-25">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-forest-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="h-10 w-10 text-forest-600" />
          </div>
          <h3 className="text-xl font-semibold text-forest-800 mb-2">
            Select a conversation
          </h3>
          <p className="text-forest-600 mb-6">
            Choose a conversation from the sidebar to start messaging.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-forest-25 to-earth-25">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-forest-800 mb-2">
            Error Loading Conversation
          </h3>
          <p className="text-forest-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-forest-100 bg-gradient-to-r from-forest-50 to-earth-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="lg:hidden p-2 text-forest-600 hover:bg-white/60 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            <div className="relative">
              <img
                src={getConversationAvatar()}
                alt={getConversationName()}
                className="w-10 h-10 rounded-full object-cover"
              />
              
              {conversation?.type === 'direct' && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
              
              {conversation?.type !== 'direct' && (
                <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${
                  conversation?.type === 'group' ? 'bg-earth-400' :
                  conversation?.type === 'event' ? 'bg-blue-500' :
                  'bg-purple-500'
                } text-white`}>
                  {conversation?.type === 'group' && <Users className="h-2 w-2" />}
                  {conversation?.type === 'event' && <Calendar className="h-2 w-2" />}
                  {conversation?.type === 'space' && <Calendar className="h-2 w-2" />}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-forest-800">
                {getConversationName()}
              </h3>
              <p className="text-xs text-forest-600">
                {conversation?.type === 'direct' 
                  ? 'Direct message' 
                  : `${conversation?.participants?.length || 0} participants`
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {conversation?.type === 'direct' && (
              <>
                <button className="p-2 text-forest-600 hover:bg-white/60 rounded-lg transition-colors">
                  <Phone className="h-4 w-4" />
                </button>
                <button className="p-2 text-forest-600 hover:bg-white/60 rounded-lg transition-colors">
                  <Video className="h-4 w-4" />
                </button>
              </>
            )}
            <button 
              onClick={onInfoClick}
              className="p-2 text-forest-600 hover:bg-white/60 rounded-lg transition-colors"
            >
              <Info className="h-4 w-4" />
            </button>
            <button className="p-2 text-forest-600 hover:bg-white/60 rounded-lg transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-forest-25"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-forest-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-forest-800 mb-2">No messages yet</h3>
              <p className="text-forest-600">Start the conversation by sending a message below!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <React.Fragment key={message.id}>
                {/* Date Separator */}
                {shouldShowDate(index) && (
                  <div className="flex items-center justify-center my-6">
                    <div className="bg-forest-100 text-forest-600 px-4 py-1 rounded-full text-xs font-medium">
                      {formatDate(message.sent_at)}
                    </div>
                  </div>
                )}
                
                {/* Message */}
                <div
                  className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  onContextMenu={(e) => handleContextMenu(e, message.id)}
                >
                  <div className={`flex items-end space-x-2 max-w-xs sm:max-w-md lg:max-w-lg ${
                    message.sender_id === user?.id ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                  }`}>
                    {message.sender_id !== user?.id && (
                      <img
                        src={message.sender?.avatar_url || 'https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=100'}
                        alt={message.sender?.full_name || 'User'}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                    
                    <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                      message.sender_id === user?.id
                        ? 'bg-gradient-to-r from-forest-600 to-forest-700 text-white'
                        : 'bg-white text-forest-800 border border-forest-100'
                    }`}>
                      {/* Message Content */}
                      {message.deleted_at ? (
                        <p className="text-sm italic opacity-70">This message was deleted</p>
                      ) : (
                        <>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          
                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map((attachment: any) => (
                                <div 
                                  key={attachment.id}
                                  className={`rounded-lg overflow-hidden border ${
                                    message.sender_id === user?.id
                                      ? 'border-forest-500'
                                      : 'border-forest-200'
                                  }`}
                                >
                                  {attachment.file_type.startsWith('image/') ? (
                                    <div className="relative">
                                      <img
                                        src={attachment.file_url}
                                        alt={attachment.file_name}
                                        className="max-w-full rounded-lg max-h-48 object-contain"
                                      />
                                      <a 
                                        href={attachment.file_url}
                                        download={attachment.file_name}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`absolute bottom-2 right-2 p-2 rounded-full ${
                                          message.sender_id === user?.id
                                            ? 'bg-white/20 hover:bg-white/30'
                                            : 'bg-forest-100 hover:bg-forest-200'
                                        }`}
                                      >
                                        <Download className="h-4 w-4" />
                                      </a>
                                    </div>
                                  ) : (
                                    <div className={`flex items-center p-3 ${
                                      message.sender_id === user?.id
                                        ? 'bg-forest-500 text-white'
                                        : 'bg-forest-50 text-forest-700'
                                    }`}>
                                      <FileText className="h-5 w-5 mr-3" />
                                      <div className="flex-1 min-w-0">
                                        <p className="truncate text-sm font-medium">{attachment.file_name}</p>
                                        <p className="text-xs opacity-80">
                                          {Math.round(attachment.file_size / 1024)} KB
                                        </p>
                                      </div>
                                      <a 
                                        href={attachment.file_url}
                                        download={attachment.file_name}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`p-2 rounded-full ${
                                          message.sender_id === user?.id
                                            ? 'bg-white/20 hover:bg-white/30'
                                            : 'bg-forest-100 hover:bg-forest-200'
                                        }`}
                                      >
                                        <Download className="h-4 w-4" />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Message Metadata */}
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
                      
                      {/* Reactions (simplified) */}
                      {!message.deleted_at && (
                        <div className="relative">
                          {/* Reaction Button */}
                          <button
                            onClick={() => setShowReactions(showReactions === message.id ? null : message.id)}
                            className={`absolute -bottom-3 ${
                              message.sender_id === user?.id ? 'left-0' : 'right-0'
                            } p-1 rounded-full ${
                              message.sender_id === user?.id
                                ? 'bg-forest-500 hover:bg-forest-600'
                                : 'bg-white hover:bg-forest-50 border border-forest-200'
                            }`}
                          >
                            <Heart className={`h-3 w-3 ${
                              message.sender_id === user?.id ? 'text-white' : 'text-forest-600'
                            }`} />
                          </button>
                          
                          {/* Reaction Picker */}
                          {showReactions === message.id && (
                            <div className={`absolute -bottom-12 ${
                              message.sender_id === user?.id ? 'left-0' : 'right-0'
                            } bg-white rounded-full shadow-lg border border-forest-100 p-1 flex space-x-1`}>
                              {['❤️', '👍', '👏', '😊', '🙏'].map((reaction) => (
                                <button
                                  key={reaction}
                                  onClick={() => handleReaction(message.id, reaction)}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-forest-50 rounded-full text-xl"
                                >
                                  {reaction}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
            
            {/* Context Menu */}
            {showContextMenu && (
              <div 
                className="fixed bg-white rounded-lg shadow-lg border border-forest-100 py-1 z-50"
                style={{
                  top: showContextMenu.y,
                  left: showContextMenu.x
                }}
              >
                <button
                  onClick={() => {
                    const message = messages.find(m => m.id === showContextMenu.id);
                    if (message) handleCopyMessage(message.content);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-left hover:bg-forest-50"
                >
                  <Copy className="h-4 w-4 text-forest-600" />
                  <span className="text-sm">Copy</span>
                </button>
                
                <button
                  className="w-full flex items-center space-x-2 px-4 py-2 text-left hover:bg-forest-50"
                >
                  <Reply className="h-4 w-4 text-forest-600" />
                  <span className="text-sm">Reply</span>
                </button>
                
                {messages.find(m => m.id === showContextMenu.id)?.sender_id === user?.id && (
                  <>
                    <button
                      className="w-full flex items-center space-x-2 px-4 py-2 text-left hover:bg-forest-50"
                    >
                      <Edit className="h-4 w-4 text-forest-600" />
                      <span className="text-sm">Edit</span>
                    </button>
                    
                    <button
                      onClick={() => handleDeleteMessage(showContextMenu.id)}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-left hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="text-sm">Delete</span>
                    </button>
                  </>
                )}
              </div>
            )}
            
            {/* Click anywhere to close context menu */}
            {showContextMenu && (
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowContextMenu(null)}
              />
            )}
            
            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center space-x-2 text-forest-600 text-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-forest-500 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-forest-500 animate-pulse delay-100"></div>
                  <div className="w-2 h-2 rounded-full bg-forest-500 animate-pulse delay-200"></div>
                </div>
                <span>{getTypingIndicator()}</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Composer */}
      <MessageComposer
        conversationId={conversationId}
        onMessageSent={() => {
          // This will be called after a message is sent
          scrollToBottom();
        }}
        disabled={loading}
      />
    </div>
  );
};

export default ConversationView;
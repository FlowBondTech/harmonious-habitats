import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  Plus, 
  Filter, 
  MessageCircle, 
  Calendar, 
  Home,
  Badge,
  Star,
  Bell,
  BellOff,
  Pin,
  MoreVertical,
  CheckCheck,
  Clock,
  User
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase } from '../lib/supabase';

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId: string | null;
  onNewConversation: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
  selectedConversationId,
  onNewConversation
}) => {
  const { user } = useAuthContext();
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, direct, group, event, space

  useEffect(() => {
    if (user) {
      loadConversations();
      setupRealtimeSubscription();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_conversations_with_details', { p_user_id: user.id });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('conversation_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          // Refresh conversations when new messages arrive
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const getConversationName = (conversation: any) => {
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

  const getConversationAvatar = (conversation: any) => {
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

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getLastMessagePreview = (conversation: any) => {
    if (!conversation.last_message) return 'No messages yet';
    
    const content = conversation.last_message.content;
    if (content.length > 30) {
      return content.substring(0, 30) + '...';
    }
    return content;
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || conv.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-forest-100 bg-gradient-to-r from-forest-50 to-earth-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-forest-800">Messages</h2>
          <button
            onClick={onNewConversation}
            className="p-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors"
            title="New Message"
          >
            <Plus className="h-5 w-5" />
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
        
        {/* Filters */}
        <div className="flex space-x-2 mt-3 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
              filter === 'all' 
                ? 'bg-forest-600 text-white' 
                : 'bg-forest-100 text-forest-600 hover:bg-forest-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('direct')}
            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 whitespace-nowrap ${
              filter === 'direct' 
                ? 'bg-forest-600 text-white' 
                : 'bg-forest-100 text-forest-600 hover:bg-forest-200'
            }`}
          >
            <User className="h-3 w-3" />
            <span>Direct</span>
          </button>
          <button
            onClick={() => setFilter('group')}
            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 whitespace-nowrap ${
              filter === 'group' 
                ? 'bg-forest-600 text-white' 
                : 'bg-forest-100 text-forest-600 hover:bg-forest-200'
            }`}
          >
            <Users className="h-3 w-3" />
            <span>Groups</span>
          </button>
          <button
            onClick={() => setFilter('event')}
            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 whitespace-nowrap ${
              filter === 'event' 
                ? 'bg-forest-600 text-white' 
                : 'bg-forest-100 text-forest-600 hover:bg-forest-200'
            }`}
          >
            <Calendar className="h-3 w-3" />
            <span>Events</span>
          </button>
          <button
            onClick={() => setFilter('space')}
            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 whitespace-nowrap ${
              filter === 'space' 
                ? 'bg-forest-600 text-white' 
                : 'bg-forest-100 text-forest-600 hover:bg-forest-200'
            }`}
          >
            <Home className="h-3 w-3" />
            <span>Spaces</span>
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-forest-600">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="h-12 w-12 text-forest-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-forest-800 mb-2">No conversations found</h3>
            <p className="text-forest-600 mb-4">
              {searchQuery 
                ? 'Try a different search term' 
                : 'Start a conversation by joining events or connecting with neighbors'}
            </p>
            <button
              onClick={onNewConversation}
              className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Message</span>
            </button>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`w-full p-4 text-left hover:bg-forest-50 active:bg-forest-100 transition-colors border-b border-forest-50/50 ${
                selectedConversationId === conversation.id ? 'bg-forest-100 border-r-4 border-r-forest-500' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="relative flex-shrink-0">
                  <img
                    src={getConversationAvatar(conversation)}
                    alt={getConversationName(conversation)}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  
                  {/* Conversation Type Indicator */}
                  {conversation.type !== 'direct' && (
                    <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${
                      conversation.type === 'group' ? 'bg-earth-400' :
                      conversation.type === 'event' ? 'bg-blue-500' :
                      'bg-purple-500'
                    } text-white`}>
                      {conversation.type === 'group' && <Users className="h-2 w-2" />}
                      {conversation.type === 'event' && <Calendar className="h-2 w-2" />}
                      {conversation.type === 'space' && <Home className="h-2 w-2" />}
                    </div>
                  )}
                  
                  {/* Online Status for direct messages */}
                  {conversation.type === 'direct' && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-forest-800 truncate">
                      {getConversationName(conversation)}
                    </h4>
                    <span className="text-xs text-forest-500 flex-shrink-0 ml-2">
                      {formatTime(conversation.last_message?.sent_at || conversation.updated_at)}
                    </span>
                  </div>
                  
                  {conversation.type !== 'direct' && (
                    <p className="text-xs text-forest-500 mb-1">
                      {conversation.participants?.length || 0} participants
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-forest-600 truncate">
                      {getLastMessagePreview(conversation)}
                    </p>
                    
                    {conversation.unread_count > 0 && (
                      <span className="bg-earth-500 text-white text-xs px-2 py-1 rounded-full font-medium ml-2 flex-shrink-0">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
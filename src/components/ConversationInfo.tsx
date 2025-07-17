import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Bell, 
  BellOff, 
  Trash2, 
  LogOut, 
  User, 
  Calendar, 
  Home, 
  Star, 
  Badge, 
  UserPlus,
  UserMinus,
  ShieldAlert,
  Image,
  Share2
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase } from '../lib/supabase';

interface ConversationInfoProps {
  conversationId: string;
  onClose: () => void;
}

interface ConversationParticipant {
  user_id: string;
  role: string;
  joined_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string;
    verified: boolean;
    username: string;
    neighborhood: string;
  };
}

interface ConversationData {
  id: string;
  name?: string;
  type: string;
  participants?: ConversationParticipant[];
  event?: {
    id: string;
    title: string;
    date: string;
    location_name: string;
    image_url?: string;
  };
  space?: {
    id: string;
    name: string;
    type: string;
    address: string;
    image_urls?: string[];
  };
}

interface UserSearchResult {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  verified: boolean;
  neighborhood: string;
}

const ConversationInfo: React.FC<ConversationInfoProps> = ({
  conversationId,
  onClose
}) => {
  const { user } = useAuthContext();
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    muted: false,
    pinned: false,
    theme: 'default',
    notificationLevel: 'all'
  });
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);

  const loadConversation = useCallback(async () => {
    if (!conversationId || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user_id,
            role,
            joined_at,
            user:profiles!conversation_participants_user_id_fkey(
              id,
              full_name,
              avatar_url,
              verified,
              username,
              neighborhood
            )
          ),
          event:events(
            id,
            title,
            date,
            location_name,
            image_url
          ),
          space:spaces(
            id,
            name,
            type,
            address,
            image_urls
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      setConversation(data);
    } catch (error) {
      console.error('Error loading conversation:', error);
      setError('Failed to load conversation details');
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  const loadSettings = useCallback(async () => {
    if (!conversationId || !user) return;

    try {
      const { data, error } = await supabase
        .from('conversation_settings')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Settings don't exist yet, create default
          await supabase
            .from('conversation_settings')
            .insert([{
              conversation_id: conversationId,
              updated_by: user.id
            }]);
        } else {
          throw error;
        }
      } else if (data) {
        setSettings({
          muted: data.muted || false,
          pinned: data.pinned || false,
          theme: data.theme || 'default',
          notificationLevel: data.notification_level || 'all'
        });
      }
    } catch (error) {
      console.error('Error loading conversation settings:', error);
    }
  }, [conversationId, user]);

  const searchUsers = useCallback(async () => {
    if (!user || searchQuery.length < 3) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, verified, neighborhood')
        .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .neq('id', user.id)
        .limit(10);
      
      // Filter out users who are already participants
      const existingParticipantIds = conversation?.participants?.map((p: ConversationParticipant) => p.user_id) || [];
      const filteredResults = data?.filter(u => !existingParticipantIds.includes(u.id)) || [];
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  }, [user, searchQuery, conversation?.participants]);

  useEffect(() => {
    if (conversationId && user) {
      loadConversation();
      loadSettings();
    }
  }, [conversationId, user, loadConversation, loadSettings]);

  useEffect(() => {
    if (showAddParticipants && searchQuery.length > 2) {
      searchUsers();
    }
  }, [searchQuery, showAddParticipants, searchUsers]);


  const updateSettings = async (updates: Partial<typeof settings>) => {
    if (!conversationId || !user) return;

    try {
      const { error } = await supabase
        .from('conversation_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq('conversation_id', conversationId);

      if (error) throw error;
      
      setSettings(prev => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const leaveConversation = async () => {
    if (!conversationId || !user || !confirm('Are you sure you want to leave this conversation?')) return;

    try {
      const { error } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      onClose();
      // Redirect to conversations list
      window.location.href = '/messages';
    } catch (error) {
      console.error('Error leaving conversation:', error);
    }
  };

  const addParticipant = async (userId: string) => {
    if (!conversationId || !user) return;

    try {
      const { error } = await supabase
        .from('conversation_participants')
        .insert([{
          conversation_id: conversationId,
          user_id: userId,
          role: 'member',
          joined_at: new Date().toISOString()
        }]);

      if (error) throw error;
      
      // Add system message
      const userToAdd = searchResults.find(u => u.id === userId);
      if (userToAdd) {
        await supabase
          .from('messages')
          .insert([{
            conversation_id: conversationId,
            sender_id: user.id,
            content: `${userToAdd.full_name} was added to the conversation`,
            type: 'system'
          }]);
      }
      
      // Refresh conversation data
      loadConversation();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding participant:', error);
    }
  };

  const removeParticipant = async (userId: string) => {
    if (!conversationId || !user || !confirm('Are you sure you want to remove this participant?')) return;

    try {
      const { error } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;
      
      // Add system message
      const userToRemove = conversation?.participants?.find((p: ConversationParticipant) => p.user_id === userId);
      if (userToRemove) {
        await supabase
          .from('messages')
          .insert([{
            conversation_id: conversationId,
            sender_id: user.id,
            content: `${userToRemove.user.full_name} was removed from the conversation`,
            type: 'system'
          }]);
      }
      
      // Refresh conversation data
      loadConversation();
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  };

  const isAdmin = () => {
    if (!user || !conversation) return false;
    
    const userParticipant = conversation.participants?.find((p: ConversationParticipant) => p.user_id === user.id);
    return userParticipant?.role === 'admin';
  };

  const getConversationTitle = () => {
    if (!conversation) return '';
    
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants?.find(
        (p: ConversationParticipant) => p.user_id !== user?.id
      );
      return otherParticipant?.user?.full_name || 'Unknown User';
    }
    
    if (conversation.type === 'event') {
      return conversation.event?.title || 'Event Chat';
    }
    
    if (conversation.type === 'space') {
      return conversation.space?.name || 'Space Chat';
    }
    
    return 'Group Chat';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={onClose}
          className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Conversation Header */}
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-3">
          {conversation?.type === 'direct' ? (
            // Direct message avatar
            <img
              src={conversation.participants?.find((p: ConversationParticipant) => p.user_id !== user?.id)?.user?.avatar_url || 'https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=100'}
              alt={getConversationTitle()}
              className="w-full h-full rounded-full object-cover"
            />
          ) : conversation?.type === 'event' ? (
            // Event image
            <div className="w-full h-full rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
              {conversation.event?.image_url ? (
                <img
                  src={conversation.event.image_url}
                  alt={conversation.event?.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Calendar className="h-10 w-10 text-blue-600" />
              )}
            </div>
          ) : conversation?.type === 'space' ? (
            // Space image
            <div className="w-full h-full rounded-full overflow-hidden bg-purple-100 flex items-center justify-center">
              {conversation.space?.image_urls?.[0] ? (
                <img
                  src={conversation.space.image_urls[0]}
                  alt={conversation.space?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Home className="h-10 w-10 text-purple-600" />
              )}
            </div>
          ) : (
            // Group chat icon
            <div className="w-full h-full rounded-full bg-earth-100 flex items-center justify-center">
              <Users className="h-10 w-10 text-earth-600" />
            </div>
          )}
          
          {/* Type indicator */}
          <div className={`absolute -bottom-1 -right-1 p-2 rounded-full ${
            conversation?.type === 'direct' ? 'bg-forest-600' :
            conversation?.type === 'group' ? 'bg-earth-500' :
            conversation?.type === 'event' ? 'bg-blue-500' :
            'bg-purple-500'
          } text-white`}>
            {conversation?.type === 'direct' && <User className="h-4 w-4" />}
            {conversation?.type === 'group' && <Users className="h-4 w-4" />}
            {conversation?.type === 'event' && <Calendar className="h-4 w-4" />}
            {conversation?.type === 'space' && <Home className="h-4 w-4" />}
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-forest-800">{getConversationTitle()}</h3>
        <p className="text-sm text-forest-600">
          {conversation?.type === 'direct' 
            ? 'Direct message' 
            : `${conversation?.participants?.length || 0} participants`
          }
        </p>
      </div>

      {/* Conversation Settings */}
      <div className="space-y-4">
        <h4 className="font-medium text-forest-800">Settings</h4>
        
        <div className="space-y-2">
          <button
            onClick={() => updateSettings({ muted: !settings.muted })}
            className="w-full flex items-center justify-between p-3 bg-forest-50 hover:bg-forest-100 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              {settings.muted ? (
                <BellOff className="h-5 w-5 text-forest-600" />
              ) : (
                <Bell className="h-5 w-5 text-forest-600" />
              )}
              <span className="text-forest-700">
                {settings.muted ? 'Unmute conversation' : 'Mute conversation'}
              </span>
            </div>
          </button>
          
          <button
            onClick={() => updateSettings({ pinned: !settings.pinned })}
            className="w-full flex items-center justify-between p-3 bg-forest-50 hover:bg-forest-100 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Star className={`h-5 w-5 ${settings.pinned ? 'text-yellow-500 fill-current' : 'text-forest-600'}`} />
              <span className="text-forest-700">
                {settings.pinned ? 'Unpin from top' : 'Pin to top'}
              </span>
            </div>
          </button>
          
          <button
            className="w-full flex items-center justify-between p-3 bg-forest-50 hover:bg-forest-100 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Image className="h-5 w-5 text-forest-600" />
              <span className="text-forest-700">Media & Files</span>
            </div>
          </button>
          
          <button
            className="w-full flex items-center justify-between p-3 bg-forest-50 hover:bg-forest-100 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Share2 className="h-5 w-5 text-forest-600" />
              <span className="text-forest-700">Share Conversation</span>
            </div>
          </button>
        </div>
      </div>

      {/* Participants */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-forest-800">Participants</h4>
          
          {conversation?.type === 'group' && isAdmin() && (
            <button
              onClick={() => setShowAddParticipants(!showAddParticipants)}
              className="text-sm text-forest-600 hover:text-forest-800 flex items-center space-x-1"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add</span>
            </button>
          )}
        </div>
        
        {/* Add Participants UI */}
        {showAddParticipants && (
          <div className="space-y-3 p-3 bg-forest-50 rounded-lg">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people to add..."
              className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
            
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {searchResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                    <div className="flex items-center space-x-2">
                      <img
                        src={result.avatar_url || 'https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=100'}
                        alt={result.full_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-forest-800">{result.full_name}</p>
                        <p className="text-xs text-forest-600">
                          {result.username ? `@${result.username}` : ''} 
                          {result.neighborhood ? ` • ${result.neighborhood}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => addParticipant(result.id)}
                      className="p-1 bg-forest-100 hover:bg-forest-200 text-forest-700 rounded-full"
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {searchQuery.length > 2 && searchResults.length === 0 && (
              <p className="text-sm text-forest-600 text-center py-2">No users found</p>
            )}
          </div>
        )}
        
        {/* Participants List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {conversation?.participants?.map((participant: ConversationParticipant) => (
            <div key={participant.user_id} className="flex items-center justify-between p-3 bg-forest-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={participant.user?.avatar_url || 'https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=100'}
                    alt={participant.user?.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {participant.user?.verified && (
                    <div className="absolute -top-1 -right-1 bg-forest-600 text-white p-1 rounded-full">
                      <Badge className="h-2 w-2" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-forest-800">
                      {participant.user?.full_name}
                    </p>
                    {participant.role === 'admin' && (
                      <span className="text-xs bg-forest-100 text-forest-700 px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                    {participant.user_id === user?.id && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-forest-600">
                    {participant.user?.username ? `@${participant.user.username}` : ''} 
                    {participant.user?.neighborhood ? ` • ${participant.user.neighborhood}` : ''}
                  </p>
                </div>
              </div>
              
              {isAdmin() && participant.user_id !== user?.id && conversation?.type === 'group' && (
                <button
                  onClick={() => removeParticipant(participant.user_id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  title="Remove from conversation"
                >
                  <UserMinus className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Related Content */}
      {conversation?.type === 'event' && conversation.event && (
        <div className="space-y-4">
          <h4 className="font-medium text-forest-800">Related Event</h4>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-forest-800">{conversation.event.title}</p>
                <p className="text-sm text-forest-600">
                  {new Date(conversation.event.date).toLocaleDateString()} • {conversation.event.location_name}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {conversation?.type === 'space' && conversation.space && (
        <div className="space-y-4">
          <h4 className="font-medium text-forest-800">Related Space</h4>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Home className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-forest-800">{conversation.space.name}</p>
                <p className="text-sm text-forest-600">
                  {conversation.space.type.replace('_', ' ')} • {conversation.space.address}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="pt-6 border-t border-forest-100">
        <div className="space-y-3">
          {conversation?.type !== 'direct' && isAdmin() && (
            <button className="w-full flex items-center justify-center space-x-2 p-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors">
              <Trash2 className="h-4 w-4" />
              <span>Delete Conversation</span>
            </button>
          )}
          
          <button
            onClick={leaveConversation}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-forest-50 hover:bg-forest-100 text-forest-700 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Leave Conversation</span>
          </button>
          
          <button className="w-full flex items-center justify-center space-x-2 p-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg transition-colors">
            <ShieldAlert className="h-4 w-4" />
            <span>Report Conversation</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationInfo;
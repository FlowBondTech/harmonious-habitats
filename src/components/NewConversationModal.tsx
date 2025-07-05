import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Users, 
  User, 
  MessageCircle, 
  Calendar, 
  Home,
  Plus,
  Check,
  ArrowRight,
  Badge
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase } from '../lib/supabase';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  onConversationCreated
}) => {
  const { user } = useAuthContext();
  const [step, setStep] = useState(1); // 1: Select type, 2: Select recipients, 3: Create
  const [conversationType, setConversationType] = useState<'direct' | 'group' | 'event' | 'space'>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedSpace, setSelectedSpace] = useState<any>(null);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [spaces, setSpaces] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, conversationType]);

  const loadInitialData = async () => {
    if (!user) return;

    try {
      // Load user's events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', user.id)
        .eq('status', 'active');
      
      setEvents(eventsData || []);

      // Load user's spaces
      const { data: spacesData } = await supabase
        .from('spaces')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', 'available');
      
      setSpaces(spacesData || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const performSearch = async () => {
    if (!user || searchQuery.length < 3) return;

    try {
      if (conversationType === 'direct' || conversationType === 'group') {
        // Search for users
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, verified, neighborhood')
          .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
          .neq('id', user.id)
          .limit(10);
        
        setSearchResults(data || []);
      } else if (conversationType === 'event') {
        // Search for events
        const { data } = await supabase
          .from('events')
          .select('*')
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .eq('status', 'active')
          .limit(10);
        
        setSearchResults(data || []);
      } else if (conversationType === 'space') {
        // Search for spaces
        const { data } = await supabase
          .from('spaces')
          .select('*')
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .eq('status', 'available')
          .limit(10);
        
        setSearchResults(data || []);
      }
    } catch (error) {
      console.error('Error performing search:', error);
    }
  };

  const handleSelectUser = (user: any) => {
    if (conversationType === 'direct') {
      setSelectedUsers([user]);
      setStep(3);
    } else {
      // For group chats, add to the selection
      const isAlreadySelected = selectedUsers.some(u => u.id === user.id);
      
      if (isAlreadySelected) {
        setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
      } else {
        setSelectedUsers(prev => [...prev, user]);
      }
    }
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setStep(3);
  };

  const handleSelectSpace = (space: any) => {
    setSelectedSpace(space);
    setStep(3);
  };

  const handleCreateConversation = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let conversationId;
      
      if (conversationType === 'direct') {
        if (selectedUsers.length !== 1) {
          throw new Error('Please select a user to message');
        }
        
        // Use the function to get or create a direct conversation
        const { data, error } = await supabase
          .rpc('get_or_create_direct_conversation', {
            p_user_id1: user.id,
            p_user_id2: selectedUsers[0].id
          });
          
        if (error) throw error;
        conversationId = data;
      } else if (conversationType === 'group') {
        if (selectedUsers.length === 0) {
          throw new Error('Please select at least one user');
        }
        
        if (!groupName.trim()) {
          throw new Error('Please enter a group name');
        }
        
        // Create a new group conversation
        const { data, error } = await supabase
          .rpc('create_conversation', {
            p_creator_id: user.id,
            p_type: 'group',
            p_name: groupName.trim(),
            p_participant_ids: selectedUsers.map(u => u.id)
          });
          
        if (error) throw error;
        conversationId = data;
      } else if (conversationType === 'event') {
        if (!selectedEvent) {
          throw new Error('Please select an event');
        }
        
        // Create an event conversation
        const { data, error } = await supabase
          .rpc('create_conversation', {
            p_creator_id: user.id,
            p_type: 'event',
            p_name: selectedEvent.title,
            p_participant_ids: [], // Will be populated by event participants
            p_event_id: selectedEvent.id
          });
          
        if (error) throw error;
        conversationId = data;
      } else if (conversationType === 'space') {
        if (!selectedSpace) {
          throw new Error('Please select a space');
        }
        
        // Create a space conversation
        const { data, error } = await supabase
          .rpc('create_conversation', {
            p_creator_id: user.id,
            p_type: 'space',
            p_name: selectedSpace.name,
            p_participant_ids: [], // Will be populated by space users
            p_space_id: selectedSpace.id
          });
          
        if (error) throw error;
        conversationId = data;
      }
      
      if (conversationId) {
        onConversationCreated(conversationId);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create conversation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-forest-600 to-earth-500 text-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">New Conversation</h2>
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center space-x-4 mt-6">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNum ? 'bg-white text-forest-600' : 'bg-forest-400 text-forest-100'
                  }`}>
                    {step > stepNum ? <Check className="h-5 w-5" /> : stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div className={`w-12 h-1 mx-2 ${
                      step > stepNum ? 'bg-white' : 'bg-forest-400'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Step 1: Select Conversation Type */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-forest-800">Select Conversation Type</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setConversationType('direct');
                      setStep(2);
                    }}
                    className="w-full flex items-center p-4 bg-forest-50 hover:bg-forest-100 rounded-xl transition-colors"
                  >
                    <div className="bg-forest-100 p-3 rounded-lg mr-4">
                      <User className="h-6 w-6 text-forest-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-forest-800">Direct Message</h4>
                      <p className="text-sm text-forest-600">One-on-one conversation with a community member</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-forest-400" />
                  </button>
                  
                  <button
                    onClick={() => {
                      setConversationType('group');
                      setStep(2);
                    }}
                    className="w-full flex items-center p-4 bg-forest-50 hover:bg-forest-100 rounded-xl transition-colors"
                  >
                    <div className="bg-earth-100 p-3 rounded-lg mr-4">
                      <Users className="h-6 w-6 text-earth-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-forest-800">Group Chat</h4>
                      <p className="text-sm text-forest-600">Create a conversation with multiple people</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-forest-400" />
                  </button>
                  
                  <button
                    onClick={() => {
                      setConversationType('event');
                      setStep(2);
                    }}
                    className="w-full flex items-center p-4 bg-forest-50 hover:bg-forest-100 rounded-xl transition-colors"
                  >
                    <div className="bg-blue-100 p-3 rounded-lg mr-4">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-forest-800">Event Chat</h4>
                      <p className="text-sm text-forest-600">Create a conversation for event participants</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-forest-400" />
                  </button>
                  
                  <button
                    onClick={() => {
                      setConversationType('space');
                      setStep(2);
                    }}
                    className="w-full flex items-center p-4 bg-forest-50 hover:bg-forest-100 rounded-xl transition-colors"
                  >
                    <div className="bg-purple-100 p-3 rounded-lg mr-4">
                      <Home className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-forest-800">Space Chat</h4>
                      <p className="text-sm text-forest-600">Create a conversation for a shared space</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-forest-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Select Recipients */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-forest-800">
                  {conversationType === 'direct' && 'Select Person'}
                  {conversationType === 'group' && 'Select Group Members'}
                  {conversationType === 'event' && 'Select Event'}
                  {conversationType === 'space' && 'Select Space'}
                </h3>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-forest-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${
                      conversationType === 'direct' || conversationType === 'group' 
                        ? 'people' 
                        : conversationType === 'event'
                        ? 'events'
                        : 'spaces'
                    }...`}
                    className="w-full pl-10 pr-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </div>
                
                {/* Selected Users (for group) */}
                {conversationType === 'group' && selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedUsers.map((user) => (
                      <div key={user.id} className="bg-forest-100 rounded-full px-3 py-1 flex items-center space-x-2">
                        <span className="text-sm text-forest-700">{user.full_name}</span>
                        <button
                          onClick={() => handleSelectUser(user)}
                          className="text-forest-500 hover:text-forest-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Search Results */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.length === 0 && searchQuery.length > 2 ? (
                    <div className="text-center py-4">
                      <p className="text-forest-600">No results found</p>
                    </div>
                  ) : (
                    searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => {
                          if (conversationType === 'direct' || conversationType === 'group') {
                            handleSelectUser(result);
                          } else if (conversationType === 'event') {
                            handleSelectEvent(result);
                          } else if (conversationType === 'space') {
                            handleSelectSpace(result);
                          }
                        }}
                        className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                          (conversationType === 'group' && selectedUsers.some(u => u.id === result.id)) ||
                          (conversationType === 'direct' && selectedUsers[0]?.id === result.id) ||
                          (conversationType === 'event' && selectedEvent?.id === result.id) ||
                          (conversationType === 'space' && selectedSpace?.id === result.id)
                            ? 'bg-forest-100'
                            : 'hover:bg-forest-50'
                        }`}
                      >
                        {/* User Result */}
                        {(conversationType === 'direct' || conversationType === 'group') && (
                          <>
                            <div className="relative mr-3">
                              <img
                                src={result.avatar_url || 'https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=100'}
                                alt={result.full_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              {result.verified && (
                                <div className="absolute -top-1 -right-1 bg-forest-600 text-white p-1 rounded-full">
                                  <Badge className="h-2 w-2" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <h4 className="font-medium text-forest-800">{result.full_name}</h4>
                              <p className="text-xs text-forest-600">
                                {result.username ? `@${result.username}` : ''} 
                                {result.neighborhood ? ` • ${result.neighborhood}` : ''}
                              </p>
                            </div>
                            {conversationType === 'group' && (
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                selectedUsers.some(u => u.id === result.id)
                                  ? 'bg-forest-600 text-white'
                                  : 'bg-forest-100 text-forest-600'
                              }`}>
                                {selectedUsers.some(u => u.id === result.id) ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Event Result */}
                        {conversationType === 'event' && (
                          <>
                            <div className="bg-blue-100 p-2 rounded-lg mr-3">
                              <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1 text-left">
                              <h4 className="font-medium text-forest-800">{result.title}</h4>
                              <p className="text-xs text-forest-600">
                                {new Date(result.date).toLocaleDateString()} • {result.location_name}
                              </p>
                            </div>
                          </>
                        )}
                        
                        {/* Space Result */}
                        {conversationType === 'space' && (
                          <>
                            <div className="bg-purple-100 p-2 rounded-lg mr-3">
                              <Home className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="flex-1 text-left">
                              <h4 className="font-medium text-forest-800">{result.name}</h4>
                              <p className="text-xs text-forest-600">
                                {result.type.replace('_', ' ')} • {result.address}
                              </p>
                            </div>
                          </>
                        )}
                      </button>
                    ))
                  )}
                </div>
                
                {/* Quick Access Lists */}
                {searchQuery.length < 3 && (
                  <>
                    {conversationType === 'event' && events.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium text-forest-800 mb-2">Your Events</h4>
                        <div className="space-y-2">
                          {events.map((event) => (
                            <button
                              key={event.id}
                              onClick={() => handleSelectEvent(event)}
                              className="w-full flex items-center p-3 hover:bg-forest-50 rounded-lg transition-colors"
                            >
                              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                <Calendar className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="flex-1 text-left">
                                <h4 className="font-medium text-forest-800">{event.title}</h4>
                                <p className="text-xs text-forest-600">
                                  {new Date(event.date).toLocaleDateString()} • {event.location_name}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {conversationType === 'space' && spaces.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium text-forest-800 mb-2">Your Spaces</h4>
                        <div className="space-y-2">
                          {spaces.map((space) => (
                            <button
                              key={space.id}
                              onClick={() => handleSelectSpace(space)}
                              className="w-full flex items-center p-3 hover:bg-forest-50 rounded-lg transition-colors"
                            >
                              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                                <Home className="h-6 w-6 text-purple-600" />
                              </div>
                              <div className="flex-1 text-left">
                                <h4 className="font-medium text-forest-800">{space.name}</h4>
                                <p className="text-xs text-forest-600">
                                  {space.type.replace('_', ' ')} • {space.address}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {/* Group Name Input (for group chats) */}
                {conversationType === 'group' && selectedUsers.length > 0 && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Enter a name for your group"
                      className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                    />
                  </div>
                )}
                
                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  
                  <button
                    onClick={() => {
                      if (conversationType === 'direct' && selectedUsers.length === 1) {
                        setStep(3);
                      } else if (conversationType === 'group' && selectedUsers.length > 0 && groupName.trim()) {
                        setStep(3);
                      } else if (conversationType === 'event' && selectedEvent) {
                        setStep(3);
                      } else if (conversationType === 'space' && selectedSpace) {
                        setStep(3);
                      } else {
                        setError('Please make a selection to continue');
                      }
                    }}
                    className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-forest-800">Create Conversation</h3>
                
                <div className="bg-forest-50 rounded-xl p-4">
                  <h4 className="font-medium text-forest-800 mb-3">Conversation Details</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        conversationType === 'direct' ? 'bg-forest-100 text-forest-600' :
                        conversationType === 'group' ? 'bg-earth-100 text-earth-600' :
                        conversationType === 'event' ? 'bg-blue-100 text-blue-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {conversationType === 'direct' && <User className="h-5 w-5" />}
                        {conversationType === 'group' && <Users className="h-5 w-5" />}
                        {conversationType === 'event' && <Calendar className="h-5 w-5" />}
                        {conversationType === 'space' && <Home className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-forest-800 capitalize">
                          {conversationType} Conversation
                        </p>
                        <p className="text-sm text-forest-600">
                          {conversationType === 'direct' && 'One-on-one messaging'}
                          {conversationType === 'group' && `${selectedUsers.length} participants`}
                          {conversationType === 'event' && 'Event participants chat'}
                          {conversationType === 'space' && 'Space-related discussions'}
                        </p>
                      </div>
                    </div>
                    
                    {conversationType === 'direct' && selectedUsers.length === 1 && (
                      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                        <img
                          src={selectedUsers[0].avatar_url || 'https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=100'}
                          alt={selectedUsers[0].full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-forest-800">{selectedUsers[0].full_name}</p>
                          <p className="text-sm text-forest-600">
                            {selectedUsers[0].username ? `@${selectedUsers[0].username}` : ''} 
                            {selectedUsers[0].neighborhood ? ` • ${selectedUsers[0].neighborhood}` : ''}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {conversationType === 'group' && (
                      <div className="space-y-2">
                        <div className="p-3 bg-white rounded-lg">
                          <p className="font-medium text-forest-800">{groupName}</p>
                          <p className="text-sm text-forest-600">{selectedUsers.length} participants</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedUsers.map((user) => (
                            <div key={user.id} className="flex items-center space-x-2 bg-earth-100 rounded-full px-3 py-1">
                              <span className="text-xs text-earth-700">{user.full_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {conversationType === 'event' && selectedEvent && (
                      <div className="p-3 bg-white rounded-lg">
                        <p className="font-medium text-forest-800">{selectedEvent.title}</p>
                        <p className="text-sm text-forest-600">
                          {new Date(selectedEvent.date).toLocaleDateString()} • {selectedEvent.location_name}
                        </p>
                      </div>
                    )}
                    
                    {conversationType === 'space' && selectedSpace && (
                      <div className="p-3 bg-white rounded-lg">
                        <p className="font-medium text-forest-800">{selectedSpace.name}</p>
                        <p className="text-sm text-forest-600">
                          {selectedSpace.type.replace('_', ' ')} • {selectedSpace.address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-2 text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  
                  <button
                    onClick={handleCreateConversation}
                    disabled={loading}
                    className="bg-forest-600 hover:bg-forest-700 disabled:bg-forest-300 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4" />
                        <span>Start Conversation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal;
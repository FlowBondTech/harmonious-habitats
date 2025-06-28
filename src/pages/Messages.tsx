import React, { useState } from 'react';
import { 
  MessageCircle, 
  Search, 
  Users, 
  Calendar,
  MapPin,
  Clock,
  Send,
  MoreVertical,
  Star,
  Badge,
  ArrowLeft,
  Phone,
  Video,
  Info,
  Image,
  Paperclip,
  Smile
} from 'lucide-react';

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);

  const conversations = [
    {
      id: 1,
      name: 'Emma Thompson',
      lastMessage: 'Looking forward to yoga tomorrow! 🧘‍♀️',
      time: '2 min ago',
      unread: 2,
      avatar: 'https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=100',
      verified: true,
      type: 'direct',
      online: true
    },
    {
      id: 2,
      name: 'Community Garden Group',
      lastMessage: 'Sarah: The tomatoes are ready for harvest! 🍅',
      time: '15 min ago',
      unread: 0,
      avatar: 'https://images.pexels.com/photos/4503273/pexels-photo-4503273.jpeg?auto=compress&cs=tinysrgb&w=100',
      verified: false,
      type: 'group',
      participants: 12,
      online: false
    },
    {
      id: 3,
      name: 'Dr. Michael Chen',
      lastMessage: 'Thanks for joining the fermentation workshop!',
      time: '1 hour ago',
      unread: 0,
      avatar: 'https://images.pexels.com/photos/4057663/pexels-photo-4057663.jpeg?auto=compress&cs=tinysrgb&w=100',
      verified: true,
      type: 'direct',
      online: false
    },
    {
      id: 4,
      name: 'Riverside Neighbors',
      lastMessage: 'Planning our spring celebration 🌸',
      time: '3 hours ago',
      unread: 5,
      avatar: 'https://images.pexels.com/photos/8633077/pexels-photo-8633077.jpeg?auto=compress&cs=tinysrgb&w=100',
      verified: false,
      type: 'group',
      participants: 28,
      online: false
    },
    {
      id: 5,
      name: 'Maya Patel',
      lastMessage: 'The meditation session was so peaceful',
      time: '1 day ago',
      unread: 0,
      avatar: 'https://images.pexels.com/photos/3823488/pexels-photo-3823488.jpeg?auto=compress&cs=tinysrgb&w=100',
      verified: true,
      type: 'direct',
      online: true
    }
  ];

  const messages = [
    {
      id: 1,
      sender: 'Emma Thompson',
      content: "Hi! I wanted to check if you're still planning to join us for morning yoga tomorrow?",
      time: '10:30 AM',
      isOwn: false,
      avatar: 'https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=100',
      status: 'delivered'
    },
    {
      id: 2,
      sender: 'You',
      content: "Absolutely! I've been looking forward to it all week. Should I bring my own mat?",
      time: '10:32 AM',
      isOwn: true,
      status: 'read'
    },
    {
      id: 3,
      sender: 'Emma Thompson',
      content: "We have extra mats available, but feel free to bring yours if you prefer. We start at 7:30 AM sharp at the pavilion.",
      time: '10:35 AM',
      isOwn: false,
      avatar: 'https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=100',
      status: 'delivered'
    },
    {
      id: 4,
      sender: 'You',
      content: "Perfect! I'll be there. Looking forward to meeting other neighbors too.",
      time: '10:40 AM',
      isOwn: true,
      status: 'read'
    },
    {
      id: 5,
      sender: 'Emma Thompson',
      content: "Looking forward to yoga tomorrow! 🧘‍♀️",
      time: '2 min ago',
      isOwn: false,
      avatar: 'https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=100',
      status: 'delivered'
    }
  ];

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConversationSelect = (id: number) => {
    setSelectedConversation(id);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedConversation(null);
  };

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // Add message logic here
      setMessageText('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-forest-800 mb-2">Messages</h1>
          <p className="text-forest-600">Connect with your neighbors and community</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-forest-50" style={{ height: '75vh' }}>
          <div className="flex h-full">
            {/* Conversations Sidebar */}
            <div className={`${showMobileChat ? 'hidden' : 'flex'} lg:flex w-full lg:w-1/3 border-r border-forest-100 flex-col`}>
              {/* Search */}
              <div className="p-4 sm:p-6 border-b border-forest-100 bg-gradient-to-r from-forest-50 to-earth-50">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-forest-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-3 border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="h-12 w-12 text-forest-300 mx-auto mb-4" />
                    <p className="text-forest-500">No conversations found</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => handleConversationSelect(conversation.id)}
                      className={`w-full p-4 sm:p-5 text-left hover:bg-forest-50 active:bg-forest-100 transition-all duration-200 border-b border-forest-50/50 ${
                        selectedConversation === conversation.id ? 'bg-forest-100 border-r-4 border-r-forest-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={conversation.avatar}
                            alt={conversation.name}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                          />
                          {conversation.online && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                          {conversation.verified && (
                            <div className="absolute -top-1 -right-1 bg-forest-600 text-white p-1 rounded-full">
                              <Badge className="h-2 w-2" />
                            </div>
                          )}
                          {conversation.type === 'group' && (
                            <div className="absolute -bottom-1 -right-1 bg-earth-400 text-white p-1 rounded-full">
                              <Users className="h-2 w-2" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-forest-800 truncate text-sm sm:text-base">
                              {conversation.name}
                            </h3>
                            <span className="text-xs text-forest-500 flex-shrink-0 ml-2">
                              {conversation.time}
                            </span>
                          </div>
                          {conversation.type === 'group' && (
                            <p className="text-xs text-forest-500 mb-1">
                              {conversation.participants} participants
                            </p>
                          )}
                          <p className="text-sm text-forest-600 truncate mb-2">
                            {conversation.lastMessage}
                          </p>
                          {conversation.unread > 0 && (
                            <div className="flex justify-start">
                              <span className="bg-earth-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                {conversation.unread}
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
                  <div className="p-4 sm:p-6 border-b border-forest-100 bg-gradient-to-r from-forest-50 to-earth-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={handleBackToList}
                          className="lg:hidden p-2 text-forest-600 hover:bg-white/60 rounded-xl transition-colors"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="relative">
                          <img
                            src={selectedConv.avatar}
                            alt={selectedConv.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                          />
                          {selectedConv.online && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                          {selectedConv.verified && (
                            <div className="absolute -top-1 -right-1 bg-forest-600 text-white p-1 rounded-full">
                              <Badge className="h-2 w-2" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h2 className="font-semibold text-forest-800 text-sm sm:text-base">
                            {selectedConv.name}
                          </h2>
                          {selectedConv.type === 'group' ? (
                            <p className="text-xs sm:text-sm text-forest-600">
                              {selectedConv.participants} participants
                            </p>
                          ) : (
                            <p className="text-xs sm:text-sm text-forest-600">
                              {selectedConv.online ? 'Online' : 'Verified neighbor • 0.7 miles away'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        {selectedConv.type === 'direct' && (
                          <>
                            <button className="p-2 text-forest-600 hover:bg-white/60 rounded-xl transition-colors">
                              <Phone className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-forest-600 hover:bg-white/60 rounded-xl transition-colors">
                              <Video className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button className="p-2 text-forest-600 hover:bg-white/60 rounded-xl transition-colors">
                          <Calendar className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-forest-600 hover:bg-white/60 rounded-xl transition-colors">
                          <Info className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-forest-600 hover:bg-white/60 rounded-xl transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-white to-forest-25">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-end space-x-2 max-w-xs sm:max-w-md lg:max-w-lg ${
                          message.isOwn ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                        }`}>
                          {!message.isOwn && (
                            <img
                              src={message.avatar}
                              alt={message.sender}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          )}
                          <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                            message.isOwn
                              ? 'bg-gradient-to-r from-forest-600 to-forest-700 text-white'
                              : 'bg-white text-forest-800 border border-forest-100'
                          }`}>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <div className={`flex items-center justify-between mt-2 ${
                              message.isOwn ? 'text-forest-200' : 'text-forest-500'
                            }`}>
                              <p className="text-xs">{message.time}</p>
                              {message.isOwn && (
                                <div className="flex items-center ml-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    message.status === 'read' ? 'bg-forest-200' : 'bg-forest-300'
                                  }`}></div>
                                  <div className={`w-2 h-2 rounded-full ml-1 ${
                                    message.status === 'read' ? 'bg-forest-200' : 'bg-forest-400'
                                  }`}></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 sm:p-6 border-t border-forest-100 bg-gradient-to-r from-forest-50 to-earth-50">
                    <div className="flex items-end space-x-3">
                      <div className="flex space-x-2">
                        <button className="p-2 text-forest-600 hover:bg-white/60 rounded-xl transition-colors">
                          <Paperclip className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-forest-600 hover:bg-white/60 rounded-xl transition-colors">
                          <Image className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="Type your message..."
                          className="w-full px-4 py-3 pr-12 border border-forest-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent bg-white/80 backdrop-blur-sm resize-none"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-forest-600 hover:bg-forest-100 rounded-lg transition-colors">
                          <Smile className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        className={`p-3 rounded-2xl transition-all duration-200 transform hover:scale-105 ${
                          messageText.trim()
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
                      Welcome to Messages
                    </h3>
                    <p className="text-forest-600 mb-6">
                      Select a conversation to start connecting with your neighbors and community.
                    </p>
                    <div className="space-y-2 text-sm text-forest-500">
                      <p>💬 Chat with event organizers</p>
                      <p>🤝 Connect with neighbors</p>
                      <p>📅 Coordinate community activities</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
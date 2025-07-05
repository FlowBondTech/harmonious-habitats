import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import ConversationList from './ConversationList';
import ConversationView from './ConversationView';
import NewConversationModal from './NewConversationModal';
import ConversationInfo from './ConversationInfo';

interface EnhancedMessagingSystemProps {
  isOpen: boolean;
  onClose: () => void;
  initialConversationId?: string;
}

const EnhancedMessagingSystem: React.FC<EnhancedMessagingSystemProps> = ({
  isOpen,
  onClose,
  initialConversationId
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(initialConversationId || null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (initialConversationId) {
      setSelectedConversation(initialConversationId);
      setShowMobileChat(true);
    }
  }, [initialConversationId]);

  const handleClose = () => {
    onClose();
    // If we're on the messages page, navigate back to home
    if (location.pathname === '/messages') {
      navigate('/');
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  const handleNewConversation = () => {
    setShowNewConversationModal(true);
  };

  const handleConversationCreated = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setShowMobileChat(true);
    setShowNewConversationModal(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="h-full flex">
        {/* Conversations Sidebar */}
        <div className={`${showMobileChat ? 'hidden' : 'flex'} lg:flex w-full lg:w-1/3 border-r border-forest-100 flex-col`}>
          <ConversationList
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversation}
            onNewConversation={handleNewConversation}
          />
        </div>

        {/* Chat Area */}
        <div className={`${showMobileChat ? 'flex' : 'hidden'} lg:flex flex-1 flex-col`}>
          <ConversationView
            conversationId={selectedConversation}
            onBack={handleBackToList}
            onInfoClick={() => setShowConversationInfo(true)}
          />
        </div>

        {/* New Conversation Modal */}
        <NewConversationModal
          isOpen={showNewConversationModal}
          onClose={() => setShowNewConversationModal(false)}
          onConversationCreated={handleConversationCreated}
        />

        {/* Conversation Info Sidebar */}
        {showConversationInfo && selectedConversation && (
          <div className="fixed inset-y-0 right-0 w-full sm:w-80 bg-white border-l border-forest-100 shadow-xl z-50 overflow-y-auto">
            <div className="p-4 border-b border-forest-100 flex items-center justify-between">
              <h3 className="font-semibold text-forest-800">Conversation Info</h3>
              <button
                onClick={() => setShowConversationInfo(false)}
                className="p-2 text-forest-600 hover:bg-forest-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <ConversationInfo
              conversationId={selectedConversation}
              onClose={() => setShowConversationInfo(false)}
            />
          </div>
        )}

        {/* Close Button (visible on large screens) */}
        <button
          onClick={handleClose}
          className="fixed top-4 right-4 bg-white p-2 rounded-full shadow-md border border-forest-100 z-50"
        >
          <X className="h-5 w-5 text-forest-600" />
        </button>

        {/* We're removing the close button here since it's now handled in the parent component */}
      </div>
    </div>
  );
};

export default EnhancedMessagingSystem;
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import EnhancedMessagingSystem from '../components/EnhancedMessagingSystem';

const Messages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [initialConversationId, setInitialConversationId] = useState<string | null>(null);
  const [showMessaging, setShowMessaging] = useState(true);
  
  // Check for conversation ID in URL params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      setInitialConversationId(conversationId);
    }
  }, [location]);

  const handleClose = () => {
    setShowMessaging(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-forest-800 mb-2">Messages</h1>
          <p className="text-forest-600">Connect with your neighbors and community</p>
        </div>

        {showMessaging && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-forest-50 relative" style={{ height: '75vh' }}>
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-50 bg-white p-2 rounded-full shadow-md border border-forest-100"
            >
              <X className="h-5 w-5 text-forest-600" />
            </button>
            <EnhancedMessagingSystem 
              isOpen={true}
              onClose={handleClose}
              initialConversationId={initialConversationId || undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
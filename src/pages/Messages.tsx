import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import EnhancedMessagingSystem from '../components/EnhancedMessagingSystem';

const Messages = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [initialConversationId, setInitialConversationId] = useState<string | null>(null);
  
  // Check for conversation ID in URL params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      setInitialConversationId(conversationId);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-forest-800 mb-2">Messages</h1>
          <p className="text-forest-600">Connect with your neighbors and community</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-forest-50" style={{ height: '75vh' }}>
          <EnhancedMessagingSystem 
            isOpen={true}
            onClose={() => {}}
            initialConversationId={initialConversationId || undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default Messages;
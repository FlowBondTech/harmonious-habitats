import React, { useState, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Image, 
  Smile, 
  Mic, 
  X, 
  Camera,
  FileText,
  Video,
  Link,
  MapPin
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase } from '../lib/supabase';

interface MessageComposerProps {
  conversationId: string;
  onMessageSent?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  conversationId,
  onMessageSent,
  placeholder = "Type your message...",
  disabled = false
}) => {
  const { user } = useAuthContext();
  const [message, setMessage] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [recentEmojis, setRecentEmojis] = useState<string[]>(['❤️', '👍', '😊', '🙏', '✨']);
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = async () => {
    if (!user || (!message.trim() && attachments.length === 0) || disabled) return;

    setLoading(true);
    try {
      // First, upload any attachments
      const attachmentUrls = [];
      
      if (attachments.length > 0) {
        for (const file of attachments) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `attachments/${conversationId}/${fileName}`;
          
          const { error: uploadError, data } = await supabase.storage
            .from('message-attachments')
            .upload(filePath, file);
            
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('message-attachments')
            .getPublicUrl(filePath);
            
          attachmentUrls.push({
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: publicUrl,
            thumbnail_url: file.type.startsWith('image/') ? publicUrl : null
          });
        }
      }
      
      // Send the message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: user.id,
          content: message.trim(),
          type: 'text'
        }])
        .select()
        .single();
        
      if (messageError) throw messageError;
      
      // Add attachments if any
      if (attachmentUrls.length > 0 && messageData) {
        const attachmentRecords = attachmentUrls.map(attachment => ({
          message_id: messageData.id,
          ...attachment
        }));
        
        const { error: attachmentError } = await supabase
          .from('message_attachments')
          .insert(attachmentRecords);
          
        if (attachmentError) throw attachmentError;
      }
      
      // Update conversation's updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      
      // Clear the input and attachments
      setMessage('');
      setAttachments([]);
      onMessageSent?.();
      
      // Update typing indicator
      await updateTypingStatus(false);
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles].slice(0, 5)); // Limit to 5 attachments
      setShowAttachMenu(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttachClick = (type: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type;
      fileInputRef.current.click();
    }
    setShowAttachMenu(false);
  };

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!user) return;
    
    try {
      await supabase
        .from('conversation_participants')
        .update({ 
          typing_at: isTyping ? new Date().toISOString() : null 
        })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    updateTypingStatus(e.target.value.length > 0);
  };

  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    // Add to recent emojis if not already there
    if (!recentEmojis.includes(emoji)) {
      setRecentEmojis(prev => [emoji, ...prev.slice(0, 4)]);
    }
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setAttachments(prev => [...prev, file].slice(0, 5));
        }
      }
    }
  };

  return (
    <div className="p-4 border-t border-forest-100 bg-gradient-to-r from-forest-50 to-earth-50">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((file, index) => (
            <div key={index} className="relative bg-white rounded-lg overflow-hidden border border-forest-200 w-16 h-16">
              {file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-forest-50">
                  <FileText className="h-6 w-6 text-forest-600" />
                </div>
              )}
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end space-x-3">
        {/* Attachment Button */}
        <div className="relative">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-2 text-forest-600 hover:bg-white/60 rounded-xl transition-colors"
            disabled={disabled}
          >
            <Paperclip className="h-5 w-5" />
          </button>
          
          {/* Attachment Menu */}
          {showAttachMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-forest-100 p-2 w-48">
              <div className="space-y-1">
                <button
                  onClick={() => handleAttachClick('image/*')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-forest-50 rounded-lg transition-colors"
                >
                  <Image className="h-4 w-4 text-forest-600" />
                  <span className="text-sm text-forest-700">Photo</span>
                </button>
                <button
                  onClick={() => handleAttachClick('video/*')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-forest-50 rounded-lg transition-colors"
                >
                  <Video className="h-4 w-4 text-forest-600" />
                  <span className="text-sm text-forest-700">Video</span>
                </button>
                <button
                  onClick={() => handleAttachClick('application/pdf,text/*')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-forest-50 rounded-lg transition-colors"
                >
                  <FileText className="h-4 w-4 text-forest-600" />
                  <span className="text-sm text-forest-700">Document</span>
                </button>
                <button
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-forest-50 rounded-lg transition-colors"
                >
                  <MapPin className="h-4 w-4 text-forest-600" />
                  <span className="text-sm text-forest-700">Location</span>
                </button>
              </div>
            </div>
          )}
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
        </div>
        
        {/* Camera Button */}
        <button
          onClick={() => handleAttachClick('image/*')}
          className="p-2 text-forest-600 hover:bg-white/60 rounded-xl transition-colors"
          disabled={disabled}
        >
          <Camera className="h-5 w-5" />
        </button>
        
        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={messageInputRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-3 pr-12 border border-forest-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent bg-white/80 backdrop-blur-sm resize-none min-h-[44px] max-h-32"
            rows={1}
            style={{ height: 'auto', minHeight: '44px', maxHeight: '120px' }}
          />
          
          {/* Emoji Button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-forest-600 hover:bg-forest-100 rounded-lg transition-colors"
            disabled={disabled}
          >
            <Smile className="h-5 w-5" />
          </button>
          
          {/* Emoji Picker (simplified) */}
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-lg border border-forest-100 p-3 w-64">
              <div className="mb-2">
                <h4 className="text-xs font-medium text-forest-700 mb-1">Recent</h4>
                <div className="flex space-x-1">
                  {recentEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => addEmoji(emoji)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-forest-50 rounded-lg text-xl"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <h4 className="text-xs font-medium text-forest-700 mb-1">Common</h4>
              <div className="grid grid-cols-6 gap-1">
                {['😊', '😂', '❤️', '👍', '🙏', '🎉', '🌱', '✨', '🔥', '👋', '🤔', '😍', '🌿', '🌎', '🙌', '🌈', '👏', '🥰'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => addEmoji(emoji)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-forest-50 rounded-lg text-xl"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Voice Message Button */}
        <button
          onClick={() => setIsRecording(!isRecording)}
          className={`p-3 rounded-xl transition-colors ${
            isRecording 
              ? 'bg-red-500 text-white' 
              : 'text-forest-600 hover:bg-white/60'
          }`}
          disabled={disabled}
        >
          <Mic className="h-5 w-5" />
        </button>
        
        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          disabled={(!message.trim() && attachments.length === 0) || loading || disabled}
          className={`p-3 rounded-2xl transition-all duration-200 transform hover:scale-105 ${
            message.trim() || attachments.length > 0
              ? 'bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-700 hover:to-forest-800 text-white shadow-sm hover:shadow-md'
              : 'bg-forest-200 text-forest-400 cursor-not-allowed'
          }`}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default MessageComposer;
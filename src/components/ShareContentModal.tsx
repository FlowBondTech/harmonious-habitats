import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Twitter,
  Facebook,
  MessageCircle,
  Mail,
  Link2,
  QrCode
} from 'lucide-react';
import { Event, Space } from '../lib/supabase';
import QRCode from 'qrcode';

interface ShareContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: Event | Space;
  contentType: 'event' | 'space';
}

const ShareContentModal: React.FC<ShareContentModalProps> = ({
  isOpen,
  onClose,
  content,
  contentType
}) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  // Generate share URL
  let shareUrl = window.location.origin;
  const shareTitle = 'title' in content ? content.title : content.name;

  if (contentType === 'space') {
    // For spaces, generate slug from name
    const spaceSlug = content.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || content.id;
    shareUrl = `${window.location.origin}/spaces/${spaceSlug}`;
  } else {
    // For events, link to the event detail page
    shareUrl = `${window.location.origin}/events/${content.id}`;
  }

  // Generate share text
  const shareText = contentType === 'event'
    ? `Join me at "${shareTitle}" - a holistic community event!`
    : `Check out "${shareTitle}" - an amazing community space!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleShowQR = async () => {
    try {
      const qr = await QRCode.toDataURL(shareUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1a3d2e', // forest-600
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qr);
      setShowQR(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: copied ? Check : Copy,
      color: 'from-gray-600 to-gray-700',
      onClick: handleCopyLink,
      description: 'Copy link to clipboard'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'from-green-500 to-green-600',
      onClick: () => {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`,
          '_blank'
        );
      },
      description: 'Share on WhatsApp'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'from-blue-400 to-blue-500',
      onClick: () => {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank'
        );
      },
      description: 'Share on Twitter'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'from-blue-600 to-blue-700',
      onClick: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          '_blank'
        );
      },
      description: 'Share on Facebook'
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'from-red-500 to-red-600',
      onClick: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
      },
      description: 'Share via email'
    },
    {
      name: 'QR Code',
      icon: QrCode,
      color: 'from-purple-500 to-purple-600',
      onClick: handleShowQR,
      description: 'Show QR code'
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        // Only close if clicking the backdrop, not the modal content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Modal Container */}
      <div
        className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl transform animate-slide-up sm:animate-fade-in max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle - Mobile Only */}
        <div className="flex sm:hidden justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-forest-100 to-earth-100 rounded-lg">
              <Share2 className="h-5 w-5 text-forest-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-forest-800">
                Share {contentType === 'event' ? 'Event' : 'Space'}
              </h3>
              <p className="text-sm text-forest-600">{shareTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showQR ? (
            <>
              {/* Native Share Button - Mobile Only */}
              {navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="w-full mb-4 p-4 bg-gradient-to-r from-forest-600 to-forest-700 text-white rounded-xl font-medium hover:from-forest-700 hover:to-forest-800 transition-all flex items-center justify-center space-x-2 shadow-lg"
                >
                  <Share2 className="h-5 w-5" />
                  <span>Share via System</span>
                </button>
              )}

              {/* Share Options Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {shareOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.name}
                      onClick={option.onClick}
                      className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-gray-200 hover:border-forest-300 hover:bg-forest-50 transition-all group"
                    >
                      <div className={`p-3 rounded-full bg-gradient-to-r ${option.color} mb-2 group-hover:scale-110 transition-transform`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 text-center">
                        {option.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Direct Link */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Direct Link
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`p-2 rounded-lg transition-all ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-forest-600 text-white hover:bg-forest-700'
                    }`}
                  >
                    {copied ? <Check className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
                  </button>
                </div>
                {copied && (
                  <p className="mt-2 text-sm text-green-600 animate-fade-in">
                    Link copied to clipboard!
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* QR Code Display */}
              <div className="text-center">
                <h4 className="text-lg font-semibold text-forest-800 mb-4">
                  Scan to View
                </h4>
                {qrCodeUrl && (
                  <div className="inline-block p-4 bg-white rounded-xl border-2 border-forest-200 shadow-lg">
                    <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                  </div>
                )}
                <p className="mt-4 text-sm text-gray-600">
                  Scan this QR code with your phone camera to view {contentType === 'event' ? 'the event' : 'the space'}
                </p>
                <button
                  onClick={() => setShowQR(false)}
                  className="mt-4 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Back to Share Options
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareContentModal;

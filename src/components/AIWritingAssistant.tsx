import React, { useState, useEffect, useRef } from 'react'
import { X, Sparkles, Send, Loader2 } from 'lucide-react'

export type AIAssistantMode =
  | 'event_creation'
  | 'space_description'
  | 'community_request'
  | 'profile_bio'
  | 'recommendations'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIWritingAssistantProps {
  isOpen: boolean
  onClose: () => void
  mode: AIAssistantMode
  onComplete?: (generatedContent: string) => void
  initialContext?: Record<string, any>
}

// Demo conversation flows for each mode
const getDemoFlow = (mode: AIAssistantMode): Message[] => {
  const baseMessages: Message[] = []

  switch (mode) {
    case 'event_creation':
      return [
        {
          id: '1',
          role: 'assistant',
          content: "Hi! I'm here to help you create a compelling event. Let's start with the basics. What type of event are you planning?",
          timestamp: new Date()
        }
      ]

    case 'space_description':
      return [
        {
          id: '1',
          role: 'assistant',
          content: "I'll help you write an engaging space description that attracts the right community members. First, what makes your space special? What's the vibe or atmosphere you want to convey?",
          timestamp: new Date()
        }
      ]

    case 'community_request':
      return [
        {
          id: '1',
          role: 'assistant',
          content: "I'll help you articulate your community request clearly. What do you need help with? Feel free to describe it in your own words, and I'll help structure it.",
          timestamp: new Date()
        }
      ]

    case 'profile_bio':
      return [
        {
          id: '1',
          role: 'assistant',
          content: "Let's create a bio that showcases your expertise and personality! Tell me about your background, what you specialize in, and what you're passionate about.",
          timestamp: new Date()
        }
      ]

    case 'recommendations':
      return [
        {
          id: '1',
          role: 'assistant',
          content: "I can help you find recommended spaces and related events based on your interests. What kind of activities or practices are you interested in exploring?",
          timestamp: new Date()
        }
      ]

    default:
      return baseMessages
  }
}

const AIWritingAssistant: React.FC<AIWritingAssistantProps> = ({
  isOpen,
  onClose,
  mode,
  onComplete,
  initialContext
}) => {
  const [messages, setMessages] = useState<Message[]>(getDemoFlow(mode))
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [demoStage, setDemoStage] = useState(0)
  const [showComingSoon, setShowComingSoon] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  // Reset when mode changes
  useEffect(() => {
    setMessages(getDemoFlow(mode))
    setDemoStage(0)
    setShowComingSoon(false)
    setInputValue('')
  }, [mode])

  const handleSendMessage = () => {
    if (!inputValue.trim() || isThinking) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsThinking(true)

    // Simulate AI response after delay
    setTimeout(() => {
      // After 2-3 exchanges, show "coming soon" message
      if (demoStage >= 2) {
        const comingSoonMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "🎉 **Feature Coming Soon!**\n\nThis AI writing assistant is currently in development. We're building an intelligent system powered by advanced language models to help you create compelling content effortlessly.\n\n**What to expect:**\n- Natural conversation to understand your needs\n- Context-aware suggestions and improvements\n- Multiple revisions until you're satisfied\n- Integration with all content creation workflows\n\nStay tuned! This feature will be available soon. In the meantime, feel free to create your content manually, and we'll help you enhance it with AI when it's ready.",
          timestamp: new Date()
        }
        setMessages(prev => [...prev, comingSoonMessage])
        setShowComingSoon(true)
        setIsThinking(false)
        return
      }

      // Generate contextual demo responses
      let assistantResponse = ''

      switch (mode) {
        case 'event_creation':
          if (demoStage === 0) {
            assistantResponse = "Great! Let's make this event stand out. Can you tell me more about who would benefit most from attending? Understanding your ideal audience helps me craft a description that resonates."
          } else if (demoStage === 1) {
            assistantResponse = "Perfect! Now, what's the main value or takeaway attendees will get from this event? What makes it worth their time?"
          }
          break

        case 'space_description':
          if (demoStage === 0) {
            assistantResponse = "I love that! Let me capture that essence. Now, what amenities or features does your space offer that enhance the experience?"
          } else if (demoStage === 1) {
            assistantResponse = "Excellent! Last question: What kind of activities or events do you envision happening here? This helps potential members understand if it's the right fit."
          }
          break

        case 'community_request':
          if (demoStage === 0) {
            assistantResponse = "I understand. Let me help you structure this clearly. Is this more of an urgent need or a longer-term request? And would you prefer this to be public to the whole community or just visible to the space owner?"
          } else if (demoStage === 1) {
            assistantResponse = "Got it! And what would a successful outcome look like for you? This helps community members understand how they can best help."
          }
          break

        case 'profile_bio':
          if (demoStage === 0) {
            assistantResponse = "Wonderful! That gives me great material to work with. What's your teaching or facilitation style? How would you describe your approach?"
          } else if (demoStage === 1) {
            assistantResponse = "Excellent! One more thing - what do you hope participants gain from working with you? What transformation or outcome do you facilitate?"
          }
          break

        case 'recommendations':
          if (demoStage === 0) {
            assistantResponse = "Great interests! Let me also ask: are you looking for beginner-friendly events, or do you have experience and want something more advanced?"
          } else if (demoStage === 1) {
            assistantResponse = "Perfect! And are you more interested in one-time events to explore, or are you looking for regular practice spaces to build a routine?"
          }
          break
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
      setDemoStage(prev => prev + 1)
      setIsThinking(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  const modeLabels = {
    event_creation: 'Event Creation Assistant',
    space_description: 'Space Description Writer',
    community_request: 'Community Request Helper',
    profile_bio: 'Profile Bio Writer',
    recommendations: 'Personalized Recommendations'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-forest-50 to-sage-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Sparkles className="w-5 h-5 text-forest-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {modeLabels[mode]}
              </h2>
              <p className="text-xs text-gray-500">AI-Powered Writing Assistance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-forest-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.role === 'assistant' && message.content.includes('Feature Coming Soon') ? (
                  <div className="space-y-2">
                    <div className="whitespace-pre-line">{message.content}</div>
                    <button
                      onClick={onClose}
                      className="w-full mt-3 px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors"
                    >
                      Got it!
                    </button>
                  </div>
                ) : (
                  <p className="whitespace-pre-line text-sm">{message.content}</p>
                )}
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-forest-200' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-forest-600" />
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {!showComingSoon && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isThinking}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-forest-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isThinking}
                className="px-6 py-3 bg-forest-600 text-white rounded-xl hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIWritingAssistant

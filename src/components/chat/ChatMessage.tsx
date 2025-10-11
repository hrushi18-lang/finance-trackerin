import React from 'react';
import { User, Sparkles, Lightbulb, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ChatMessage as ChatMessageType } from '../../services/aiFinancialAssistant';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const navigate = useNavigate();

  // Detect contextual actions based on message content
  const detectActions = (content: string): Array<{label: string; path: string}> => {
    const actions: Array<{label: string; path: string}> = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('bill') || lowerContent.includes('due')) {
      actions.push({ label: 'View Bills', path: '/bills' });
    }
    if (lowerContent.includes('goal')) {
      actions.push({ label: 'Check Goals', path: '/goals' });
    }
    if (lowerContent.includes('budget')) {
      actions.push({ label: 'Review Budgets', path: '/budgets' });
    }
    if (lowerContent.includes('account') || lowerContent.includes('balance')) {
      actions.push({ label: 'View Accounts', path: '/accounts' });
    }
    if (lowerContent.includes('transaction') || lowerContent.includes('spent') || lowerContent.includes('spending')) {
      actions.push({ label: 'See Transactions', path: '/transactions' });
    }
    if (lowerContent.includes('debt') || lowerContent.includes('liabilit')) {
      actions.push({ label: 'Manage Debt', path: '/liabilities' });
    }
    
    return actions.slice(0, 3); // Max 3 actions
  };

  const actions = !isUser ? detectActions(message.content) : [];

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
      <div className={`flex items-start space-x-2 max-w-[85%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
        }`}>
          {isUser ? (
            <User className="w-4 h-4" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`rounded-2xl px-4 py-2 ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
          }`}>
            {/* Format message content with markdown-like formatting */}
            <div className="text-sm whitespace-pre-wrap break-words">
              {formatMessageContent(message.content)}
            </div>

            {/* Quick Actions */}
            {actions.length > 0 && !isUser && (
              <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                <div className="flex flex-wrap gap-2">
                  {actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => navigate(action.path)}
                      className="text-xs px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center space-x-1"
                    >
                      <span>{action.label}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && !isUser && (
              <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600 space-y-1">
                <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <Lightbulb className="w-3 h-3" />
                  <span>Quick Questions:</span>
                </div>
                {message.metadata.suggestions.slice(0, 3).map((suggestion, index) => (
                  <div
                    key={index}
                    className="text-xs bg-white dark:bg-gray-800 rounded-lg p-2 text-gray-700 dark:text-gray-300"
                  >
                    • {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timestamp */}
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper function to format message content
function formatMessageContent(content: string): React.ReactNode {
  // Split by lines
  const lines = content.split('\n');
  
  return lines.map((line, index) => {
    // Headers (lines starting with #)
    if (line.startsWith('###')) {
      return (
        <h3 key={index} className="font-bold text-base mt-3 mb-2">
          {line.replace(/^###\s*/, '')}
        </h3>
      );
    }
    if (line.startsWith('##')) {
      return (
        <h2 key={index} className="font-bold text-lg mt-4 mb-2">
          {line.replace(/^##\s*/, '')}
        </h2>
      );
    }
    if (line.startsWith('#')) {
      return (
        <h1 key={index} className="font-bold text-xl mt-4 mb-3">
          {line.replace(/^#\s*/, '')}
        </h1>
      );
    }

    // Bullet points
    if (line.match(/^[-•*]\s+/)) {
      return (
        <div key={index} className="ml-3 my-1">
          • {line.replace(/^[-•*]\s+/, '')}
        </div>
      );
    }

    // Numbered lists
    if (line.match(/^\d+\.\s+/)) {
      return (
        <div key={index} className="ml-3 my-1">
          {line}
        </div>
      );
    }

    // Bold text (**text**)
    const boldRegex = /\*\*(.+?)\*\*/g;
    if (boldRegex.test(line)) {
      const parts = line.split(boldRegex);
      return (
        <div key={index} className="my-1">
          {parts.map((part, i) => 
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
          )}
        </div>
      );
    }

    // Empty lines
    if (line.trim() === '') {
      return <div key={index} className="h-2" />;
    }

    // Regular text
    return (
      <div key={index} className="my-1">
        {line}
      </div>
    );
  });
}


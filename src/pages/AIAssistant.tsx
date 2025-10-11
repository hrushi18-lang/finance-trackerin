import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Send, Trash2, Download, TrendingUp, Target, 
  DollarSign, PiggyBank, AlertCircle, Lightbulb, MessageCircle,
  BarChart3, Calendar, CreditCard
} from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useFinance } from '../contexts/FinanceContext';
import { ChatMessage } from '../components/chat/ChatMessage';
import { format } from 'date-fns';

export default function AIAssistant() {
  const [input, setInput] = useState('');
  const [showInsights, setShowInsights] = useState(true);
  const [insights, setInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { messages, isLoading, sendMessage, clearChat, isTyping, generateInsights } = useChat();
  const { accounts, transactions, goals, budgets } = useFinance();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load insights on mount
  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setLoadingInsights(true);
    try {
      const newInsights = await generateInsights();
      setInsights(newInsights);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    {
      icon: TrendingUp,
      text: "How am I doing financially this month?",
      color: "from-blue-500 to-blue-600",
      category: "Overview"
    },
    {
      icon: DollarSign,
      text: "What are my biggest expenses?",
      color: "from-orange-500 to-orange-600",
      category: "Spending"
    },
    {
      icon: Target,
      text: "Show my goal progress",
      color: "from-green-500 to-green-600",
      category: "Goals"
    },
    {
      icon: PiggyBank,
      text: "How can I save more money?",
      color: "from-purple-500 to-purple-600",
      category: "Savings"
    },
    {
      icon: BarChart3,
      text: "Analyze my spending patterns",
      color: "from-pink-500 to-pink-600",
      category: "Analysis"
    },
    {
      icon: CreditCard,
      text: "Help me reduce my debt",
      color: "from-red-500 to-red-600",
      category: "Debt"
    },
    {
      icon: Calendar,
      text: "What bills are coming up?",
      color: "from-indigo-500 to-indigo-600",
      category: "Bills"
    },
    {
      icon: AlertCircle,
      text: "Am I overspending in any category?",
      color: "from-yellow-500 to-yellow-600",
      category: "Alerts"
    }
  ];

  const stats = {
    accounts: accounts.filter(a => !a.isArchived).length,
    transactions: transactions.length,
    goals: goals.filter(g => g.status === 'active').length,
    budgets: budgets.length
  };

  const exportChat = () => {
    const chatText = messages
      .map(msg => `[${format(msg.timestamp, 'MMM dd, yyyy HH:mm')}] ${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-assistant-chat-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-3">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">AI Financial Assistant</h1>
                <p className="text-blue-100">Your personal finance advisor, powered by AI</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.accounts}</div>
                <div className="text-blue-100">Accounts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.transactions}</div>
                <div className="text-blue-100">Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.goals}</div>
                <div className="text-blue-100">Active Goals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.budgets}</div>
                <div className="text-blue-100">Budgets</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Quick Actions & Insights */}
          <div className="lg:col-span-1 space-y-6">
            {/* Financial Insights */}
            {showInsights && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Smart Insights
                    </h3>
                  </div>
                  <button
                    onClick={loadInsights}
                    disabled={loadingInsights}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                  >
                    {loadingInsights ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
                
                {loadingInsights ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : insights.length > 0 ? (
                  <div className="space-y-3">
                    {insights.map((insight, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200"
                      >
                        {insight}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No insights available yet. Start chatting to get personalized advice!
                  </p>
                )}
              </div>
            )}

            {/* Quick Questions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Quick Questions
              </h3>
              <div className="space-y-2">
                {quickQuestions.map((q, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInput(q.text);
                      inputRef.current?.focus();
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`bg-gradient-to-r ${q.color} p-2 rounded-lg text-white group-hover:scale-110 transition-transform`}>
                        <q.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400">{q.category}</div>
                        <div className="text-sm text-gray-900 dark:text-white">{q.text}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Chat Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={exportChat}
                  disabled={messages.length === 0}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Chat</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear the chat history?')) {
                      clearChat();
                    }
                  }}
                  disabled={messages.length === 0}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Chat</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Financial Advisor Chat
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {messages.length > 0 ? `${messages.length} messages` : 'Start a conversation'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Welcome to Your AI Financial Assistant
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      I can help you understand your finances, create budgets, track goals, 
                      and provide personalized financial advice based on your data.
                    </p>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Try asking a question or select from the quick questions on the left
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}
                    
                    {isTyping && (
                      <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-sm">AI is analyzing your finances...</span>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-end space-x-3">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your finances..."
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Send className="w-5 h-5" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Powered by OpenAI • Your data is secure
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


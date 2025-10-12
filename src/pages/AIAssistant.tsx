import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Send, Trash2, Download, TrendingUp, Target, 
  DollarSign, PiggyBank, AlertCircle, Lightbulb, MessageCircle,
  BarChart3, Calendar, CreditCard, Menu, X, RefreshCw
} from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useFinance } from '../contexts/FinanceContext';
import { ChatMessage } from '../components/chat/ChatMessage';
import { format } from 'date-fns';
import { Button } from '../components/common/Button';

export default function AIAssistant() {
  const [input, setInput] = useState('');
  const [showInsights, setShowInsights] = useState(true);
  const [insights, setInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Mobile-Optimized Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-lg rounded-xl p-2.5">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Assistant</h1>
                <p className="text-xs text-white/80">Powered by Google Gemini</p>
              </div>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg bg-white/20 backdrop-blur-lg hover:bg-white/30 transition-colors"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Mobile Stats Row */}
          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <div className="font-bold text-lg">{stats.accounts}</div>
              <div className="text-white/70">Accounts</div>
            </div>
            <div>
              <div className="font-bold text-lg">{stats.transactions}</div>
              <div className="text-white/70">Txns</div>
            </div>
            <div>
              <div className="font-bold text-lg">{stats.goals}</div>
              <div className="text-white/70">Goals</div>
            </div>
            <div>
              <div className="font-bold text-lg">{stats.budgets}</div>
              <div className="text-white/70">Budgets</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Slide-in Menu */}
      {showMobileMenu && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 z-50 lg:hidden shadow-2xl transform transition-transform duration-300">
            <div className="p-4 h-full overflow-y-auto space-y-4">
              {/* Close Button */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Menu</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Insights */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Smart Insights</h3>
                  </div>
                  <button
                    onClick={loadInsights}
                    disabled={loadingInsights}
                    className="p-1.5 rounded-lg hover:bg-white/50 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingInsights ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                
                {loadingInsights ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : insights.length > 0 ? (
                  <div className="space-y-2">
                    {insights.map((insight, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg text-sm text-gray-700 dark:text-gray-200 backdrop-blur"
                      >
                        {insight}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-3">
                    Start chatting to get insights!
                  </p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Actions</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={exportChat}
                  disabled={messages.length === 0}
                  className="flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Chat</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    if (confirm('Clear all chat messages?')) {
                      clearChat();
                      setShowMobileMenu(false);
                    }
                  }}
                  disabled={messages.length === 0}
                  className="flex items-center justify-center space-x-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Chat</span>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="px-4 py-4 space-y-4">
        {/* Quick Questions - Horizontal Scroll */}
        <div className="overflow-x-auto -mx-4 px-4 pb-2">
          <div className="flex space-x-3 min-w-max">
            {quickQuestions.slice(0, 6).map((q, index) => (
              <button
                key={index}
                onClick={() => {
                  setInput(q.text);
                  inputRef.current?.focus();
                }}
                className="flex-shrink-0 px-4 py-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <div className="flex items-center space-x-2">
                  <div className={`bg-gradient-to-r ${q.color} p-1.5 rounded-lg text-white`}>
                    <q.icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {q.category}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile-First Chat Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mx-auto">
          {/* Messages Container */}
          <div 
            className="overflow-y-auto p-4 space-y-4"
            style={{ height: 'calc(100vh - 340px)', minHeight: '400px' }}
          >
            {messages.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  AI Financial Assistant
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                  I analyze your finances and provide personalized insights. Ask me anything!
                </p>
                <div className="inline-flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  <span>Tap a chip above to get started</span>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                
                {isTyping && (
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
                      <div className="flex space-x-1.5">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Mobile Input Bar - Fixed at Bottom */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <div className="flex items-end space-x-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your finances..."
                disabled={isLoading}
                rows={1}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed resize-none text-sm"
                style={{ minHeight: '44px', maxHeight: '100px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 w-11 h-11 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-95"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Powered by Google Gemini • Your data stays private
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


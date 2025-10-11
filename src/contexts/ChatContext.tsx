import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useFinance } from './FinanceContext';
import { aiFinancialAssistant, ChatMessage, FinancialContext } from '../services/aiFinancialAssistant';

interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  loadChatHistory: () => Promise<void>;
  generateInsights: () => Promise<string[]>;
  isTyping: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { accounts, transactions, goals, budgets, bills, liabilities } = useFinance();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with personalized proactive welcome message
  useEffect(() => {
    if (user && messages.length === 0) {
      generateProactiveWelcome();
    }
  }, [user, accounts, transactions, goals, budgets, bills, liabilities]);

  const generateProactiveWelcome = () => {
    // Build personalized greeting based on actual data
    let greeting = `👋 Hi! I'm your personal financial assistant.\n\n`;
    
    // Calculate total balance
    const totalBalance = accounts
      .filter(a => !a.isArchived && a.type !== 'credit_card')
      .reduce((sum, a) => sum + (a.balance || 0), 0);

    // Check for urgent bills (next 3 days)
    const urgentBills = bills
      .filter(b => b.isActive)
      .filter(b => {
        const daysUntil = Math.ceil((new Date(b.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntil >= 0 && daysUntil <= 3;
      });

    // Check budget warnings (>85% used)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const criticalBudgets = budgets.filter(b => {
      const spent = transactions
        .filter(t => 
          t.type === 'expense' &&
          t.category === b.category &&
          new Date(t.date) >= monthStart
        )
        .reduce((sum, t) => sum + t.amount, 0);
      return (spent / b.amount) > 0.85;
    });

    // Check goals close to completion (>80%)
    const nearCompletionGoals = goals
      .filter(g => g.status === 'active')
      .filter(g => (g.currentAmount / g.targetAmount) > 0.8);

    // Build greeting with actual data
    if (totalBalance > 0) {
      greeting += `💰 Your total balance: $${totalBalance.toFixed(2)}\n\n`;
    }

    if (urgentBills.length > 0) {
      greeting += `🚨 **Urgent Bills:**\n`;
      urgentBills.slice(0, 2).forEach(b => {
        const daysUntil = Math.ceil((new Date(b.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        greeting += `- ${b.title}: $${b.amount.toFixed(2)} (due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''})\n`;
      });
      greeting += `\n`;
    }

    if (criticalBudgets.length > 0) {
      greeting += `⚠️ **Budget Alert:**\n`;
      const budget = criticalBudgets[0];
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === budget.category && new Date(t.date) >= monthStart)
        .reduce((sum, t) => sum + t.amount, 0);
      const percentUsed = Math.round((spent / budget.amount) * 100);
      greeting += `- ${budget.category}: ${percentUsed}% spent ($${spent.toFixed(2)}/$${budget.amount.toFixed(2)})\n\n`;
    }

    if (nearCompletionGoals.length > 0) {
      greeting += `🎯 **Almost There:**\n`;
      const goal = nearCompletionGoals[0];
      const progress = Math.round((goal.currentAmount / goal.targetAmount) * 100);
      const remaining = goal.targetAmount - goal.currentAmount;
      greeting += `- ${goal.title} is ${progress}% complete - just $${remaining.toFixed(2)} to go!\n\n`;
    }

    // Quick stats
    const activeGoalsCount = goals.filter(g => g.status === 'active').length;
    const activeBudgetsCount = budgets.length;
    const accountsCount = accounts.filter(a => !a.isArchived).length;

    greeting += `📊 **Your Financial Overview:**\n`;
    greeting += `- ${accountsCount} active account${accountsCount !== 1 ? 's' : ''}\n`;
    if (activeGoalsCount > 0) greeting += `- ${activeGoalsCount} goal${activeGoalsCount !== 1 ? 's' : ''} in progress\n`;
    if (activeBudgetsCount > 0) greeting += `- ${activeBudgetsCount} budget${activeBudgetsCount !== 1 ? 's' : ''} tracked\n`;
    
    greeting += `\n**What would you like to know?** I have all your financial data ready!`;

    const welcomeMessage: ChatMessage = {
      id: 'welcome_msg',
      role: 'assistant',
      content: greeting,
      timestamp: new Date(),
      metadata: {
        suggestions: [
          "How am I doing this month?",
          "What bills are coming up?",
          "Show my goal progress",
          "Any spending warnings?",
          "Can I afford to buy something?"
        ]
      }
    };
    
    setMessages([welcomeMessage]);
  };

  // Build financial context
  const getFinancialContext = useCallback((): FinancialContext => {
    return {
      accounts,
      transactions,
      goals,
      budgets,
      bills,
      liabilities,
      timeframe: {
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        end: new Date()
      }
    };
  }, [accounts, transactions, goals, budgets, bills, liabilities]);

  // Send a message with retry logic
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setIsTyping(true);
    setError(null);

    // Add user message
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Get financial context (use current data, not stale)
      const financialContext = getFinancialContext();

      // Get AI response (with built-in retry logic)
      const aiResponse = await aiFinancialAssistant.sendMessage(
        content,
        messages,
        financialContext
      );

      // Add AI response
      setMessages(prev => [...prev, aiResponse]);

      // Save to database (fire and forget, don't block UI)
      saveChatMessage(userMessage).catch(console.error);
      saveChatMessage(aiResponse).catch(console.error);

    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);

      // Add friendly error message with suggestions
      const errorResponse: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${errorMessage}

**What you can try:**
- Wait a moment and try again (service might be busy)
- Rephrase your question more simply
- Ask about a specific topic (accounts, bills, goals)

I'm still learning your financial data and will be ready to help you soon!`,
        timestamp: new Date(),
        metadata: {
          suggestions: [
            "Show my account balances",
            "What bills are due soon?",
            "How are my goals doing?",
            "What's my spending this month?"
          ]
        }
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [messages, isLoading, getFinancialContext]);

  // Save chat message to database
  const saveChatMessage = async (message: ChatMessage) => {
    if (!user) return;

    try {
      await supabase.from('chat_messages').insert({
        id: message.id,
        user_id: user.id,
        role: message.role,
        content: message.content,
        metadata: message.metadata,
        created_at: message.timestamp.toISOString()
      });
    } catch (err) {
      console.error('Error saving chat message:', err);
    }
  };

  // Load chat history
  const loadChatHistory = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedMessages: ChatMessage[] = data.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at),
          metadata: msg.metadata
        }));
        setMessages(loadedMessages);
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  }, [user]);

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Generate insights
  const generateInsights = useCallback(async (): Promise<string[]> => {
    try {
      const financialContext = getFinancialContext();
      return await aiFinancialAssistant.generateInsights(financialContext);
    } catch (err) {
      console.error('Error generating insights:', err);
      return [];
    }
  }, [getFinancialContext]);

  const value: ChatContextType = {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    loadChatHistory,
    generateInsights,
    isTyping
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}


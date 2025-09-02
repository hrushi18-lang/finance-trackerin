import React, { useState, useEffect } from 'react';
import { HelpCircle, X, Lightbulb, BookOpen, Video, MessageCircle, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface HelpItem {
  id: string;
  title: string;
  content: string;
  type: 'tip' | 'guide' | 'video' | 'faq';
  category: string;
  keywords: string[];
  userType?: string[];
  experience?: string[];
}

interface ContextualHelpProps {
  context: string;
  userType?: string;
  experience?: string;
  className?: string;
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  context,
  userType,
  experience,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHelp, setSelectedHelp] = useState<HelpItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Help database - in a real app, this would come from an API
  const helpDatabase: HelpItem[] = [
    // Account Management
    {
      id: 'account-types',
      title: 'Understanding Account Types',
      content: 'Different account types serve different purposes: Bank Savings for long-term savings, Digital Wallets for quick payments, Investment accounts for growing wealth, and Credit Cards for expenses with rewards.',
      type: 'guide',
      category: 'accounts',
      keywords: ['account', 'types', 'bank', 'wallet', 'investment'],
      userType: ['student', 'young_professional', 'freelancer', 'business_owner'],
      experience: ['beginner', 'intermediate']
    },
    {
      id: 'account-balance',
      title: 'Setting Your Account Balance',
      content: 'Enter your current balance accurately. This helps FinTrack provide better insights and recommendations. You can update balances anytime as you make transactions.',
      type: 'tip',
      category: 'accounts',
      keywords: ['balance', 'current', 'amount', 'money'],
      userType: ['student', 'young_professional', 'freelancer', 'business_owner'],
      experience: ['beginner']
    },
    {
      id: 'goals-vault',
      title: 'What is the Goals Vault?',
      content: 'The Goals Vault is a special account that automatically allocates money to your financial goals. When you fund a goal, money moves from your regular account to the Goals Vault, keeping it separate and organized.',
      type: 'guide',
      category: 'goals',
      keywords: ['goals', 'vault', 'allocation', 'savings'],
      userType: ['student', 'young_professional', 'family'],
      experience: ['beginner', 'intermediate']
    },

    // Transactions
    {
      id: 'transaction-types',
      title: 'Transaction Types Explained',
      content: 'Income adds money to your account, Expenses reduce your balance, and Transfers move money between accounts without affecting your net worth.',
      type: 'guide',
      category: 'transactions',
      keywords: ['transaction', 'income', 'expense', 'transfer'],
      userType: ['student', 'young_professional', 'freelancer', 'business_owner'],
      experience: ['beginner']
    },
    {
      id: 'affects-balance',
      title: 'Affects Balance Toggle',
      content: 'Use this toggle for informational transactions that don\'t change your actual account balance, like tracking pending payments or recording future transactions.',
      type: 'tip',
      category: 'transactions',
      keywords: ['balance', 'toggle', 'pending', 'future'],
      userType: ['freelancer', 'business_owner'],
      experience: ['intermediate', 'advanced']
    },

    // Budgeting
    {
      id: 'budget-categories',
      title: 'Budget Categories',
      content: 'Create budgets for different spending categories like Food, Transportation, Entertainment. This helps you control spending and save more money.',
      type: 'guide',
      category: 'budgeting',
      keywords: ['budget', 'categories', 'spending', 'control'],
      userType: ['student', 'young_professional', 'family'],
      experience: ['beginner', 'intermediate']
    },
    {
      id: 'budget-alerts',
      title: 'Budget Alerts',
      content: 'Set up alerts to notify you when you\'re approaching your budget limits. This helps prevent overspending and keeps you on track.',
      type: 'tip',
      category: 'budgeting',
      keywords: ['budget', 'alerts', 'notifications', 'overspending'],
      userType: ['student', 'young_professional', 'family'],
      experience: ['beginner', 'intermediate']
    },

    // Goals
    {
      id: 'goal-funding',
      title: 'How Goal Funding Works',
      content: 'When you fund a goal, money is automatically transferred from your chosen account to the Goals Vault. This creates a paired transaction to maintain accurate balances.',
      type: 'guide',
      category: 'goals',
      keywords: ['goal', 'funding', 'transfer', 'vault'],
      userType: ['student', 'young_professional', 'family'],
      experience: ['beginner', 'intermediate']
    },
    {
      id: 'emergency-fund',
      title: 'Emergency Fund Planning',
      content: 'Aim to save 3-6 months of expenses in your emergency fund. This provides financial security for unexpected situations like job loss or medical emergencies.',
      type: 'tip',
      category: 'goals',
      keywords: ['emergency', 'fund', 'savings', 'security'],
      userType: ['young_professional', 'family', 'freelancer'],
      experience: ['beginner', 'intermediate']
    },

    // Bills & Liabilities
    {
      id: 'bill-management',
      title: 'Managing Bills',
      content: 'Add your recurring bills to track due dates and amounts. You can pay bills directly from the app, which automatically updates your account balance.',
      type: 'guide',
      category: 'bills',
      keywords: ['bills', 'recurring', 'payments', 'due dates'],
      userType: ['student', 'young_professional', 'family'],
      experience: ['beginner', 'intermediate']
    },
    {
      id: 'debt-strategies',
      title: 'Debt Payoff Strategies',
      content: 'Consider the debt avalanche method (pay highest interest first) or debt snowball method (pay smallest balance first). Choose what motivates you most.',
      type: 'guide',
      category: 'liabilities',
      keywords: ['debt', 'payoff', 'strategy', 'interest'],
      userType: ['student', 'young_professional', 'family'],
      experience: ['beginner', 'intermediate']
    },

    // Business & Freelancing
    {
      id: 'business-accounts',
      title: 'Separating Business & Personal',
      content: 'Keep business and personal finances separate. Use different accounts for business income, expenses, and tax savings to simplify accounting.',
      type: 'guide',
      category: 'business',
      keywords: ['business', 'personal', 'separate', 'tax'],
      userType: ['freelancer', 'business_owner'],
      experience: ['intermediate', 'advanced']
    },
    {
      id: 'irregular-income',
      title: 'Managing Irregular Income',
      content: 'For irregular income, create a buffer account and pay yourself a consistent salary. Save extra income for lean months.',
      type: 'tip',
      category: 'business',
      keywords: ['irregular', 'income', 'buffer', 'salary'],
      userType: ['freelancer', 'business_owner'],
      experience: ['intermediate', 'advanced']
    }
  ];

  // Filter help items based on context, user type, and experience
  const getRelevantHelp = () => {
    return helpDatabase.filter(item => {
      const matchesContext = item.category === context || 
                            item.keywords.some(keyword => 
                              context.toLowerCase().includes(keyword) ||
                              keyword.includes(context.toLowerCase())
                            );
      
      const matchesUserType = !item.userType || item.userType.includes(userType || '');
      const matchesExperience = !item.experience || item.experience.includes(experience || '');
      
      return matchesContext && matchesUserType && matchesExperience;
    });
  };

  const relevantHelp = getRelevantHelp();
  const filteredHelp = relevantHelp.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIconForType = (type: string) => {
    switch (type) {
      case 'tip': return Lightbulb;
      case 'guide': return BookOpen;
      case 'video': return Video;
      case 'faq': return MessageCircle;
      default: return HelpCircle;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tip': return 'text-yellow-400 bg-yellow-500/20';
      case 'guide': return 'text-blue-400 bg-blue-500/20';
      case 'video': return 'text-purple-400 bg-purple-500/20';
      case 'faq': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  if (relevantHelp.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        title="Get help"
      >
        <HelpCircle size={20} className="text-gray-400 hover:text-primary-400" />
      </button>

      {/* Help Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-forest-900 border border-forest-600/30 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-forest-600/30">
              <div>
                <h2 className="text-xl font-heading font-semibold text-white">Help & Guidance</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Get personalized help for {context}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedHelp ? (
                // Help Detail View
                <div className="space-y-4">
                  <button
                    onClick={() => setSelectedHelp(null)}
                    className="flex items-center text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    <ChevronRight size={16} className="mr-1 rotate-180" />
                    Back to help topics
                  </button>
                  
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-2 rounded-lg ${getTypeColor(selectedHelp.type)}`}>
                      {React.createElement(getIconForType(selectedHelp.type), { size: 20 })}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{selectedHelp.title}</h3>
                      <span className="text-sm text-gray-400 capitalize">{selectedHelp.type}</span>
                    </div>
                  </div>
                  
                  <div className="bg-forest-800/30 rounded-lg p-4">
                    <p className="text-gray-300 leading-relaxed">{selectedHelp.content}</p>
                  </div>
                </div>
              ) : (
                // Help List View
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search help topics..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-forest-800/30 border border-forest-600/30 text-white rounded-lg px-4 py-2 pl-10 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
                    />
                    <HelpCircle size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>

                  {/* Help Items */}
                  <div className="space-y-3">
                    {filteredHelp.map((item) => {
                      const IconComponent = getIconForType(item.type);
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedHelp(item)}
                          className="w-full p-4 bg-forest-800/30 border border-forest-600/30 rounded-lg hover:border-forest-500/50 hover:bg-forest-700/30 transition-all text-left"
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${getTypeColor(item.type)} flex-shrink-0`}>
                              <IconComponent size={18} />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                              <p className="text-sm text-gray-400 line-clamp-2">{item.content}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                                <ChevronRight size={16} className="text-gray-400" />
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {filteredHelp.length === 0 && (
                    <div className="text-center py-8">
                      <HelpCircle size={48} className="text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No help topics found for your search.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

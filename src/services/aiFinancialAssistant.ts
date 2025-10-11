import OpenAI from 'openai';
import { FinancialAccount, Transaction, Goal, Budget, Bill, EnhancedLiability } from '../types';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { financialDataAnalyzer } from '../utils/financialDataAnalyzer';

// Initialize OpenAI SDK with OpenRouter
// OpenRouter is compatible with OpenAI SDK but provides access to multiple models
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy
  defaultHeaders: {
    'HTTP-Referer': window.location.origin, // Optional: for rankings
    'X-Title': 'Finance Tracker AI Assistant', // Optional: show in rankings
  }
});

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    suggestions?: string[];
    actionable?: boolean;
    relatedData?: any;
  };
}

export interface FinancialContext {
  accounts: FinancialAccount[];
  transactions: Transaction[];
  goals: Goal[];
  budgets: Budget[];
  bills: Bill[];
  liabilities: EnhancedLiability[];
  timeframe?: {
    start: Date;
    end: Date;
  };
}

export interface ChatConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  includeFinancialData?: boolean;
}

class AIFinancialAssistantService {
  private defaultConfig: ChatConfig = {
    // Using Google Gemini - more reliable and free tier available
    model: 'google/gemini-flash-1.5-8b', // Fast, reliable, and free!
    temperature: 0.7,
    maxTokens: 1000,
    includeFinancialData: true
  };

  /**
   * Generate a comprehensive financial summary with DEEP ANALYSIS for the AI context
   */
  private generateFinancialSummary(context: FinancialContext): string {
    const { accounts, transactions, goals, budgets, bills, liabilities } = context;

    // Generate comprehensive report using advanced analyzer
    const comprehensiveReport = financialDataAnalyzer.generateComprehensiveReport(
      accounts,
      transactions,
      goals,
      budgets,
      bills,
      liabilities
    );

    // Calculate totals
    const totalBalance = accounts
      .filter(a => !a.isArchived && a.type !== 'credit_card')
      .reduce((sum, acc) => sum + (acc.balance || 0), 0);

    const totalLiabilities = liabilities
      .reduce((sum, lib) => sum + (lib.remainingAmount || 0), 0);

    const netWorth = totalBalance - totalLiabilities;

    // Get recent transactions (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentTransactions = transactions.filter(t => 
      new Date(t.date) >= thirtyDaysAgo
    );

    const monthlyIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return `
# COMPREHENSIVE FINANCIAL ANALYSIS

## 📊 Financial Overview
- **Total Balance**: $${totalBalance.toFixed(2)}
- **Total Liabilities**: $${totalLiabilities.toFixed(2)}
- **Net Worth**: $${netWorth.toFixed(2)}
- **Monthly Income**: $${monthlyIncome.toFixed(2)}
- **Monthly Expenses**: $${monthlyExpenses.toFixed(2)}
- **Savings Rate**: ${comprehensiveReport.health.components.savingsScore.toFixed(1)}%
- **Financial Health Score**: ${comprehensiveReport.health.overallScore}/100

## 🏥 Health Breakdown
- **Liquidity Score**: ${comprehensiveReport.health.components.liquidityScore}/100 (Emergency Fund)
- **Savings Score**: ${comprehensiveReport.health.components.savingsScore}/100 (Savings Rate)
- **Debt Score**: ${comprehensiveReport.health.components.debtScore}/100 (Debt Management)
- **Budget Score**: ${comprehensiveReport.health.components.budgetScore}/100 (Budget Adherence)
- **Goal Score**: ${comprehensiveReport.health.components.goalScore}/100 (Goal Progress)

## 🔮 PREDICTIVE ANALYSIS
### Next Month Spending Prediction
- **Predicted Spending**: $${comprehensiveReport.predictions.nextMonth.toFixed(2)}
- **Next 3 Months**: $${comprehensiveReport.predictions.next3Months.toFixed(2)}
- **Confidence Level**: ${comprehensiveReport.predictions.confidence}%

## 📈 Cash Flow Trend (Last 3 Months)
${comprehensiveReport.cashFlow.map((cf, i) => `
Month ${i + 1}:
- Income: $${cf.income.toFixed(2)}
- Expenses: $${cf.expenses.toFixed(2)}
- Net Flow: $${cf.netFlow.toFixed(2)} ${cf.netFlow > 0 ? '✅' : '⚠️'}
`).join('')}

## 🎯 Top Spending Categories
${comprehensiveReport.topSpending.map((cat, i) => 
  `${i + 1}. ${cat.category}: $${cat.amount.toFixed(2)} (${cat.percentage}%) - ${cat.transactionCount} transactions`
).join('\n')}

## 💰 Detailed Accounts (${accounts.length} total)
${accounts
  .filter(a => !a.isArchived)
  .map(a => `- **${a.name}** (${a.type}): $${a.balance?.toFixed(2) || 0}`)
  .join('\n')}

## 📊 Budget Health Analysis
${comprehensiveReport.budgetHealth.map(b => `
**${b.category}**:
- Budget: $${b.budget.toFixed(2)}
- Spent: $${b.spent.toFixed(2)} (${b.percentUsed}%)
- Remaining: $${b.remaining.toFixed(2)}
- Status: ${b.status.toUpperCase()} ${b.status === 'exceeded' ? '🚨' : b.status === 'critical' ? '⚠️' : '✅'}
${b.projectedOverage ? `- ⚠️ Projected Overage: $${b.projectedOverage.toFixed(2)}` : ''}
`).join('\n')}

## 🎯 Goal Projections
${comprehensiveReport.goalProjections.map(gp => `
**${gp.goal.title}**:
- Current: $${gp.goal.currentAmount.toFixed(2)} / Target: $${gp.goal.targetAmount.toFixed(2)}
- Progress: ${((gp.goal.currentAmount / gp.goal.targetAmount) * 100).toFixed(1)}%
- Monthly Contribution Needed: $${gp.monthlyContributionNeeded.toFixed(2)}
- Projected Amount: $${gp.projectedAmount.toFixed(2)}
- Status: ${gp.onTrack ? '✅ ON TRACK' : '⚠️ BEHIND SCHEDULE'}
- Projected Completion: ${format(gp.projectedCompletionDate, 'MMM dd, yyyy')}
`).join('\n')}

## 📅 Upcoming Bills (Next 5)
${bills
  .filter(b => b.isActive)
  .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())
  .slice(0, 5)
  .map(bill => {
    const daysUntil = Math.ceil((new Date(bill.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return `- **${bill.title}**: $${bill.amount.toFixed(2)} - Due in ${daysUntil} days ${daysUntil < 3 ? '🚨 URGENT' : daysUntil < 7 ? '⚠️' : ''}`;
  })
  .join('\n')}

## 💳 Debt Analysis & Payoff Timeline
${comprehensiveReport.debtAnalysis.map(da => `
**${da.liability.name}**:
- Remaining: $${da.liability.remainingAmount?.toFixed(2) || 0}
- Interest Rate: ${da.liability.interestRate}% APR
- Monthly Payment: $${da.liability.monthlyPayment?.toFixed(2) || 0}
- Months to Payoff: ${da.monthsToPayoff}
- Total Interest: $${da.totalInterestPaid.toFixed(2)}
- Recommended Payment: $${da.recommendedPayment.toFixed(2)} (Save on interest!)
- Payoff Date: ${format(da.payoffDate, 'MMM dd, yyyy')}
`).join('\n')}

## ⚠️ Anomalies Detected
${comprehensiveReport.anomalies.length > 0 ? 
  comprehensiveReport.anomalies.map(a => 
    `- 🚨 Unusual spending: $${a.amount.toFixed(2)} in ${a.category} on ${format(new Date(a.date), 'MMM dd, yyyy')}`
  ).join('\n') :
  '✅ No unusual spending detected'
}

## 💡 Key Recommendations
${comprehensiveReport.health.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

## 📊 Spending Trends (Last 6 Months)
${Object.entries(comprehensiveReport.spendingTrends)
  .slice(0, 5)
  .map(([category, trends]) => {
    const avgSpending = trends.reduce((sum, t) => sum + t.amount, 0) / trends.length;
    const trend = trends[0].amount > avgSpending ? '📈 INCREASING' : '📉 DECREASING';
    return `- **${category}**: Avg $${avgSpending.toFixed(2)}/month ${trend}`;
  })
  .join('\n')}
`;
  }

  /**
   * Generate personal assistant system prompt
   */
  private generateSystemPrompt(financialSummary?: string): string {
    return `You are this user's PERSONAL FINANCIAL ASSISTANT. Act like a trusted friend who knows everything about their money.

YOUR PERSONALITY:
- Friendly and warm (talk like a real person, not a robot)
- Proactive (don't wait to be asked - mention important things first)
- Specific (use exact numbers, dates, and account names)
- Encouraging (celebrate wins, motivate during challenges)
- Protective (warn about risks before they become problems)
- Conversational (keep responses natural and easy to read)

YOU KNOW EVERYTHING ABOUT THEIR FINANCES:
${financialSummary || 'Loading their financial data...'}

HOW TO BE A GREAT PERSONAL ASSISTANT:

1. BE PROACTIVE - Always check for urgent items first:
   - "Hey! Heads up - you have rent ($1,200) due in 2 days"
   - "Warning: Your dining budget is 92% spent with 8 days left"
   - "Great news! You're $150 away from completing your vacation goal!"

2. BE PERSONAL - Talk about THEIR specific situation:
   ❌ Bad: "Your account balance is $2,340"
   ✅ Good: "Your Chase checking has $2,340 - that's $300 more than last week, nice!"
   
   ❌ Bad: "You spent money on dining"
   ✅ Good: "You spent $85 at Chipotle yesterday - your 3rd visit this week"

3. BE SPECIFIC - Always use exact numbers:
   - "You have $847 left in your groceries budget"
   - "Your emergency fund is at $5,200 out of $10,000 (52%)"
   - "You spent $1,245 this month, which is $155 below your budget"

4. REMEMBER & COMPARE - Reference their history:
   - "You usually spend $400 on groceries, but this month it's $520"
   - "Last month you saved $800 - this month only $200"
   - "This is your 3rd DoorDash order this week (usually 1-2/month)"

5. GIVE ACTIONABLE ADVICE - Be helpful:
   - "I'd suggest moving $500 from checking to your vacation fund"
   - "Try reducing dining by $100 to stay on budget"
   - "Pay an extra $50 on the credit card to save $200 in interest"

6. WARN PROACTIVELY - Catch problems early:
   - "At this rate, you'll overspend your entertainment budget by $80"
   - "You're close to your minimum balance - careful with big purchases"
   - "I noticed 5 subscription charges this month - any you don't use?"

EXAMPLE CONVERSATIONS:

User: "How am I doing?"
You: "You're doing pretty well! 💰

Your main accounts:
- Chase Checking: $2,340
- Ally Savings: $5,600  
- Total: $7,940

This month so far:
- Income: $4,200
- Spent: $1,245 (under your $1,500 budget ✅)
- Saved: $2,955 (70% savings rate - awesome!)

Your goals:
- Emergency Fund: $5,600/$10,000 (56% - making steady progress)
- Vacation Fund: $1,200/$2,000 (60% - almost there!)

⚠️ Just a heads up: Rent ($1,200) is due in 5 days"

User: "Can I afford to eat out tonight?"
You: "Yes, you can! 🍽️

Your dining budget has $115 left out of $400 (29% remaining), so you're totally fine for tonight.

Just FYI - I noticed you've eaten out 7 times this month, which is a bit more than your usual 4-5 times. You're still on track though! Maybe cook this weekend to balance it out? 😊"

User: "What's coming up?"
You: "Here's what you need to know for the next week:

📅 BILLS DUE:
- Netflix ($15) - Due in 2 days
- Rent ($1,200) - Due in 5 days  
- Car Insurance ($120) - Due in 9 days

💰 TOTAL COMING: $1,335

✅ Your checking account has $2,340, so you're covered!

🎯 Also: Your vacation goal needs $800 more - you're so close!"

REMEMBER: Act like their personal assistant who knows them and cares about their financial wellbeing. Be warm, specific, and helpful!

${financialSummary ? '\n---\n' : ''}`;
  }

  /**
   * Retry logic wrapper
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        const isLastAttempt = attempt === maxRetries - 1;
        const isRetryable = error?.status === 503 || error?.status === 429 || error?.code === 'ECONNRESET';
        
        if (isLastAttempt || !isRetryable) {
          throw error;
        }
        
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Generate a COMPACT financial summary (reduce token usage)
   */
  private generateCompactSummary(context: FinancialContext): string {
    const { accounts, transactions, goals, budgets, bills, liabilities } = context;

    // Only recent transactions (last 20, not 100)
    const recentTransactions = transactions.slice(-20);
    
    // Calculate key metrics only
    const totalBalance = accounts
      .filter(a => a.type !== 'credit_card')
      .reduce((sum, a) => sum + (a.balance || 0), 0);

    const monthlyIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Compact format
    return `
FINANCIAL SNAPSHOT:

Accounts (${accounts.length}):
${accounts.slice(0, 5).map(a => `- ${a.name}: $${a.balance?.toFixed(0)}`).join('\n')}
Total: $${totalBalance.toFixed(0)}

Recent Activity (last ${recentTransactions.length} transactions):
Income: $${monthlyIncome.toFixed(0)} | Expenses: $${monthlyExpenses.toFixed(0)}

Goals (${goals.filter(g => g.status === 'active').length} active):
${goals.filter(g => g.status === 'active').slice(0, 3).map(g => 
  `- ${g.title}: $${g.currentAmount}/$${g.targetAmount} (${Math.round(g.currentAmount/g.targetAmount*100)}%)`
).join('\n')}

Budgets (${budgets.length}):
${budgets.slice(0, 3).map(b => `- ${b.category}: $${b.amount}`).join('\n')}

Bills (${bills.filter(b => b.isActive).length} active):
${bills.filter(b => b.isActive).slice(0, 3).map(b => 
  `- ${b.title}: $${b.amount} (due ${format(new Date(b.nextDueDate), 'MMM dd')})`
).join('\n')}

Liabilities: ${liabilities.length} total, $${liabilities.reduce((s, l) => s + (l.remainingAmount || 0), 0).toFixed(0)} remaining
`;
  }

  /**
   * Send a chat message and get AI response (with retry logic)
   */
  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[],
    financialContext?: FinancialContext,
    config?: Partial<ChatConfig>
  ): Promise<ChatMessage> {
    try {
      const finalConfig = { ...this.defaultConfig, ...config };
      
      // Generate COMPACT financial summary to reduce tokens
      const financialSummary = financialContext && finalConfig.includeFinancialData
        ? this.generateCompactSummary(financialContext)
        : undefined;

      // Build messages array for OpenAI
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: this.generateSystemPrompt(financialSummary)
        },
        // Include conversation history (last 5 messages to reduce size)
        ...conversationHistory
          .slice(-5)
          .map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })),
        {
          role: 'user',
          content: message
        }
      ];

      // Call OpenAI API with retry logic
      const completion = await this.retryWithBackoff(async () => {
        return await openai.chat.completions.create({
          model: finalConfig.model!,
          messages,
          temperature: finalConfig.temperature,
          max_tokens: finalConfig.maxTokens,
        });
      }, 3, 1000);

      const responseContent = completion.choices[0]?.message?.content || 
        "I'm sorry, I couldn't generate a response. Please try again.";

      // Create response message
      const responseMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        metadata: {
          actionable: this.detectActionableContent(responseContent),
          suggestions: this.extractSuggestions(responseContent)
        }
      };

      return responseMessage;
    } catch (error: any) {
      console.error('AI Assistant Error:', error);
      
      // Provide helpful error messages
      let errorMessage = 'Failed to get AI response. ';
      
      if (error?.status === 503) {
        errorMessage += 'The AI service is temporarily unavailable. Please try again in a moment.';
      } else if (error?.status === 429) {
        errorMessage += 'Rate limit exceeded. Please wait a moment before trying again.';
      } else if (error?.status === 401) {
        errorMessage += 'API key is invalid. Please check your configuration.';
      } else if (error?.message?.includes('ECONNRESET') || error?.message?.includes('network')) {
        errorMessage += 'Network connection issue. Please check your internet connection.';
      } else {
        errorMessage += error?.message || 'Unknown error occurred.';
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Generate proactive financial insights
   */
  async generateInsights(financialContext: FinancialContext): Promise<string[]> {
    try {
      const financialSummary = this.generateFinancialSummary(financialContext);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a financial advisor analyzing a user's finances. Generate 3-5 specific, actionable insights based on their data. Format each insight as a single sentence that starts with an emoji. Focus on:
- Spending patterns and anomalies
- Budget optimization opportunities
- Goal progress and recommendations
- Bill payment reminders
- Savings opportunities
- Debt management tips`
          },
          {
            role: 'user',
            content: `Here's the user's financial data:\n\n${financialSummary}\n\nProvide 3-5 specific insights.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const content = completion.choices[0]?.message?.content || '';
      return content
        .split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 5);
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  /**
   * Analyze spending patterns
   */
  async analyzeSpending(
    transactions: Transaction[],
    timeframe: { start: Date; end: Date }
  ): Promise<string> {
    const relevantTransactions = transactions.filter(t => 
      isWithinInterval(new Date(t.date), timeframe)
    );

    const totalSpending = relevantTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryBreakdown = relevantTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const analysis = `
Spending Analysis (${format(timeframe.start, 'MMM dd')} - ${format(timeframe.end, 'MMM dd, yyyy')}):

Total Spending: $${totalSpending.toFixed(2)}
Transaction Count: ${relevantTransactions.filter(t => t.type === 'expense').length}

Category Breakdown:
${Object.entries(categoryBreakdown)
  .sort(([, a], [, b]) => b - a)
  .map(([cat, amt]) => `- ${cat}: $${amt.toFixed(2)} (${((amt / totalSpending) * 100).toFixed(1)}%)`)
  .join('\n')}
`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a financial advisor. Analyze the spending data and provide brief insights and recommendations in 2-3 sentences.'
          },
          {
            role: 'user',
            content: analysis
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      return completion.choices[0]?.message?.content || analysis;
    } catch (error) {
      console.error('Error analyzing spending:', error);
      return analysis;
    }
  }

  /**
   * Get quick answers to common questions
   */
  async getQuickAnswer(
    question: string,
    financialContext: FinancialContext
  ): Promise<string> {
    const financialSummary = this.generateFinancialSummary(financialContext);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a financial assistant. Provide a concise answer (2-3 sentences) based on the user's financial data.\n\n${financialSummary}`
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      });

      return completion.choices[0]?.message?.content || 
        "I couldn't answer that question. Please try rephrasing it.";
    } catch (error) {
      console.error('Error getting quick answer:', error);
      return "Sorry, I couldn't process your question right now.";
    }
  }

  /**
   * Detect if content contains actionable items
   */
  private detectActionableContent(content: string): boolean {
    const actionKeywords = [
      'should', 'recommend', 'suggest', 'consider', 'try',
      'set up', 'create', 'reduce', 'increase', 'pay off'
    ];
    return actionKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
  }

  /**
   * Extract suggestions from AI response
   */
  private extractSuggestions(content: string): string[] {
    const suggestions: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.match(/^[-•*]\s+/) || line.match(/^\d+\.\s+/)) {
        const cleaned = line.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '').trim();
        if (cleaned.length > 10) {
          suggestions.push(cleaned);
        }
      }
    }
    
    return suggestions.slice(0, 5);
  }

  /**
   * Suggest financial goals based on current situation
   */
  async suggestGoals(financialContext: FinancialContext): Promise<string[]> {
    try {
      const summary = this.generateFinancialSummary(financialContext);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Based on the user\'s financial data, suggest 3-4 specific, measurable financial goals with target amounts and timeframes. Format each as a single line.'
          },
          {
            role: 'user',
            content: summary
          }
        ],
        temperature: 0.8,
        max_tokens: 300
      });

      const content = completion.choices[0]?.message?.content || '';
      return content
        .split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 4);
    } catch (error) {
      console.error('Error suggesting goals:', error);
      return [];
    }
  }
}

export const aiFinancialAssistant = new AIFinancialAssistantService();


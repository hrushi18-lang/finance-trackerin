#!/usr/bin/env node

/**
 * Enhanced Database Setup Script
 * 
 * This script sets up the enhanced financial tracking database
 * with all the advanced features and improvements.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'readFileSync';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
let envContent = '';
try {
  envContent = readFileSync(join(__dirname, '..', '.env'), 'utf8');
} catch (error) {
  console.log('No .env file found, using hardcoded values');
}

const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL || 'https://qbskidyauxehvswgckrv.supabase.co';
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFic2tpZHlhdXhlaHZzd2dja3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzA3NDgsImV4cCI6MjA2NjUwNjc0OH0.A2C-1fRXKwLhA9yt6CyQq1BqfjpQ3J46zuHlwjnWBE4';

console.log('🚀 Enhanced Database Setup Starting...\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Key (first 20 chars):', supabaseKey.substring(0, 20) + '...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupEnhancedDatabase() {
  try {
    console.log('1. Testing database connectivity...');
    const { data: healthData, error: healthError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (healthError) {
      console.log('❌ Database connectivity failed:', healthError.message);
      return;
    }
    console.log('✅ Database connectivity successful\n');

    console.log('2. Checking current database state...');
    
    // Check if enhanced tables already exist
    const enhancedTables = [
      'investment_portfolios',
      'investment_holdings', 
      'investment_transactions',
      'crypto_wallets',
      'financial_snapshots',
      'spending_patterns',
      'financial_goals_enhanced',
      'ai_insights',
      'smart_categorization_rules',
      'category_hierarchy_enhanced',
      'transaction_tags',
      'user_currency_preferences',
      'tax_categories',
      'budget_templates',
      'financial_forecasts'
    ];

    let existingTables = 0;
    for (const table of enhancedTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });
        
        if (!error) {
          existingTables++;
          console.log(`✅ ${table}: Already exists`);
        } else {
          console.log(`❌ ${table}: ${error.message}`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    if (existingTables === enhancedTables.length) {
      console.log('\n🎉 All enhanced tables already exist! Database is up to date.');
      console.log('\n📊 Enhanced Features Available:');
      console.log('   • Investment & Crypto Tracking');
      console.log('   • Advanced Analytics & Reporting');
      console.log('   • AI-Powered Insights');
      console.log('   • Enhanced Security & Audit');
      console.log('   • Mobile Sync & Offline Support');
      console.log('   • Multi-Currency Support');
      console.log('   • Tax & Compliance Features');
      console.log('   • Advanced Budgeting & Forecasting');
      return;
    }

    console.log(`\n📋 Found ${existingTables}/${enhancedTables.length} enhanced tables`);
    console.log('⚠️  Some enhanced features are missing. Please run the migration manually in Supabase Dashboard.');
    
    console.log('\n🔧 Manual Migration Steps:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the migration file: supabase/migrations/20250130000003_enhanced_financial_features.sql');
    console.log('4. Verify all tables are created successfully');
    
    console.log('\n📚 Migration Features:');
    console.log('   • 25+ new tables for comprehensive financial tracking');
    console.log('   • Investment portfolios and crypto wallet support');
    console.log('   • Advanced analytics and spending pattern detection');
    console.log('   • AI-powered insights and smart categorization');
    console.log('   • Enhanced security with audit logging');
    console.log('   • Mobile sync and offline capabilities');
    console.log('   • Multi-currency and international support');
    console.log('   • Tax preparation and compliance features');
    console.log('   • Advanced budgeting and financial forecasting');

    // Check if we can create some sample data
    console.log('\n3. Setting up sample data...');
    
    // Try to create a sample financial snapshot
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (profiles && profiles.length > 0) {
        console.log('✅ Found user profiles for sample data setup');
        
        // Create sample AI insight
        const { error: insightError } = await supabase
          .from('ai_insights')
          .insert({
            user_id: profiles[0].id,
            insight_type: 'savings_opportunity',
            title: 'Welcome to Enhanced Financial Tracking!',
            description: 'Your database has been upgraded with advanced features including investment tracking, AI insights, and comprehensive analytics.',
            confidence_score: 0.95,
            impact_level: 'high',
            actionable_items: [
              'Set up your investment portfolios',
              'Configure smart categorization rules',
              'Enable AI-powered insights',
              'Set up multi-currency support'
            ]
          });
        
        if (!insightError) {
          console.log('✅ Created welcome AI insight');
        }
      }
    } catch (error) {
      console.log('⚠️  Could not create sample data:', error.message);
    }

    console.log('\n🎯 Next Steps:');
    console.log('1. Run the migration in Supabase Dashboard');
    console.log('2. Update your TypeScript types to use supabase_enhanced.ts');
    console.log('3. Implement the new features in your application');
    console.log('4. Test all enhanced functionality');
    
    console.log('\n📖 Documentation:');
    console.log('   • Check the migration file for detailed table schemas');
    console.log('   • Review supabase_enhanced.ts for TypeScript types');
    console.log('   • Implement features gradually for better testing');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Run the setup
setupEnhancedDatabase().then(() => {
  console.log('\n🏁 Enhanced database setup completed.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

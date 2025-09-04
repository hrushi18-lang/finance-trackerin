#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  log(`\n${colors.cyan}${description}...${colors.reset}`);
  try {
    execSync(command, { stdio: 'inherit' });
    log(`${colors.green}✓ ${description} completed${colors.reset}`);
  } catch (error) {
    log(`${colors.red}✗ ${description} failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

function checkPrerequisites() {
  log(`${colors.bright}Checking prerequisites...${colors.reset}`);
  
  // Check if Node.js is installed
  try {
    execSync('node --version', { stdio: 'pipe' });
    log(`${colors.green}✓ Node.js is installed${colors.reset}`);
  } catch {
    log(`${colors.red}✗ Node.js is not installed${colors.reset}`);
    process.exit(1);
  }
  
  // Check if npm is installed
  try {
    execSync('npm --version', { stdio: 'pipe' });
    log(`${colors.green}✓ npm is installed${colors.reset}`);
  } catch {
    log(`${colors.red}✗ npm is not installed${colors.reset}`);
    process.exit(1);
  }
  
  // Check if Capacitor CLI is installed
  try {
    execSync('npx cap --version', { stdio: 'pipe' });
    log(`${colors.green}✓ Capacitor CLI is available${colors.reset}`);
  } catch {
    log(`${colors.red}✗ Capacitor CLI is not available${colors.reset}`);
    process.exit(1);
  }
}

function buildApp() {
  log(`${colors.bright}Building the app...${colors.reset}`);
  
  // Install dependencies
  execCommand('npm install', 'Installing dependencies');
  
  // Build the web app
  execCommand('npm run build', 'Building web app');
  
  // Verify build output
  const distPath = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distPath)) {
    log(`${colors.red}✗ Build output not found${colors.reset}`);
    process.exit(1);
  }
  
  log(`${colors.green}✓ Build completed successfully${colors.reset}`);
}

function setupMobilePlatforms() {
  log(`${colors.bright}Setting up mobile platforms...${colors.reset}`);
  
  // Add iOS platform if it doesn't exist
  const iosPath = path.join(process.cwd(), 'ios');
  if (!fs.existsSync(iosPath)) {
    execCommand('npx cap add ios', 'Adding iOS platform');
  } else {
    log(`${colors.yellow}⚠ iOS platform already exists${colors.reset}`);
  }
  
  // Add Android platform if it doesn't exist
  const androidPath = path.join(process.cwd(), 'android');
  if (!fs.existsSync(androidPath)) {
    execCommand('npx cap add android', 'Adding Android platform');
  } else {
    log(`${colors.yellow}⚠ Android platform already exists${colors.reset}`);
  }
  
  // Sync the platforms
  execCommand('npx cap sync', 'Syncing platforms');
}

function generateAppIcons() {
  log(`${colors.bright}Generating app icons...${colors.reset}`);
  
  // Check if app icons exist
  const androidIconsPath = path.join(process.cwd(), 'android-assets');
  const iosIconsPath = path.join(process.cwd(), 'ios-assets');
  
  if (fs.existsSync(androidIconsPath) && fs.existsSync(iosIconsPath)) {
    log(`${colors.green}✓ App icons already exist${colors.reset}`);
  } else {
    log(`${colors.yellow}⚠ App icons not found. Please add them manually.${colors.reset}`);
    log(`${colors.cyan}Android icons should be in: android-assets/${colors.reset}`);
    log(`${colors.cyan}iOS icons should be in: ios-assets/${colors.reset}`);
  }
}

function openPlatforms() {
  const platform = process.argv[2];
  
  if (platform === 'ios') {
    log(`${colors.bright}Opening iOS project in Xcode...${colors.reset}`);
    execCommand('npx cap open ios', 'Opening iOS project');
  } else if (platform === 'android') {
    log(`${colors.bright}Opening Android project in Android Studio...${colors.reset}`);
    execCommand('npx cap open android', 'Opening Android project');
  } else {
    log(`${colors.yellow}⚠ No platform specified. Use: node scripts/mobile-deploy.js [ios|android]${colors.reset}`);
    log(`${colors.cyan}To open iOS: node scripts/mobile-deploy.js ios${colors.reset}`);
    log(`${colors.cyan}To open Android: node scripts/mobile-deploy.js android${colors.reset}`);
  }
}

function main() {
  log(`${colors.bright}${colors.magenta}🚀 FinTrack Mobile Deployment Script${colors.reset}`);
  log(`${colors.cyan}=====================================${colors.reset}`);
  
  try {
    checkPrerequisites();
    buildApp();
    setupMobilePlatforms();
    generateAppIcons();
    openPlatforms();
    
    log(`\n${colors.bright}${colors.green}🎉 Mobile deployment setup completed!${colors.reset}`);
    log(`${colors.cyan}Next steps:${colors.reset}`);
    log(`${colors.yellow}1. Configure app icons and splash screens${colors.reset}`);
    log(`${colors.yellow}2. Update app metadata (name, version, etc.)${colors.reset}`);
    log(`${colors.yellow}3. Configure signing certificates${colors.reset}`);
    log(`${colors.yellow}4. Test on devices/emulators${colors.reset}`);
    log(`${colors.yellow}5. Build and submit to app stores${colors.reset}`);
    
  } catch (error) {
    log(`${colors.red}✗ Deployment failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();

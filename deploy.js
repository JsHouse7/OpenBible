#!/usr/bin/env node

/**
 * OpenBible Deployment Script
 * 
 * This script helps deploy the OpenBible application to Vercel
 * with proper environment variable configuration.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...');
  
  const envPath = path.join(__dirname, '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found!');
    console.log('Please create .env.local with required Supabase credentials.');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const missingVars = [];
  
  REQUIRED_ENV_VARS.forEach(varName => {
    if (!envContent.includes(varName)) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:');
    missingVars.forEach(varName => console.log(`  - ${varName}`));
    process.exit(1);
  }
  
  console.log('✅ All required environment variables found.');
}

function runBuild() {
  console.log('🏗️  Building project...');
  
  try {
    // Clean previous build
    if (fs.existsSync('.next')) {
      execSync('rm -rf .next', { stdio: 'inherit' });
    }
    
    // Run build
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully.');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

function checkVercelCLI() {
  console.log('🔍 Checking Vercel CLI...');
  
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    console.log('✅ Vercel CLI is installed.');
  } catch (error) {
    console.error('❌ Vercel CLI not found.');
    console.log('Install it with: npm install -g vercel');
    process.exit(1);
  }
}

function deployToVercel() {
  console.log('🚀 Deploying to Vercel...');
  
  try {
    // Deploy to Vercel
    execSync('vercel --prod', { stdio: 'inherit' });
    console.log('✅ Deployment completed successfully!');
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure you\'re logged in: vercel login');
    console.log('2. Check environment variables in Vercel dashboard');
    console.log('3. Review deployment logs in Vercel dashboard');
    process.exit(1);
  }
}

function main() {
  console.log('🌟 OpenBible Deployment Script\n');
  
  // Pre-deployment checks
  checkEnvironmentVariables();
  checkVercelCLI();
  
  // Build project
  runBuild();
  
  // Deploy
  deployToVercel();
  
  console.log('\n🎉 Deployment process completed!');
  console.log('\nNext steps:');
  console.log('1. Test your deployed application');
  console.log('2. Verify all features work correctly');
  console.log('3. Check Vercel dashboard for deployment details');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentVariables,
  runBuild,
  checkVercelCLI,
  deployToVercel
};
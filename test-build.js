// Simple script to test our build process
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Run the build
console.log('Running build...');
execSync('npm run build', { stdio: 'inherit' });

// Check if special files were copied
console.log('\nChecking for special files in dist:');
const distFiles = fs.readdirSync('dist', { withFileTypes: true })
  .map(entry => entry.name);

// Check for .nojekyll
if (distFiles.includes('.nojekyll')) {
  console.log('✅ .nojekyll file was successfully copied');
} else {
  console.log('❌ .nojekyll file is missing');
}

// Check for CNAME
if (distFiles.includes('CNAME')) {
  console.log('✅ CNAME file was successfully copied');
} else {
  console.log('❌ CNAME file is missing');
}
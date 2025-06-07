#!/usr/bin/env node

/**
 * This script scans the codebase for ES module imports without .js extensions
 * which would cause failures in production environments like Vercel
 * 
 * Run this in CI/CD pipelines to catch these issues before deployment
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Directories to scan
const SCAN_DIRS = ['server', 'config', 'shared'];

// File extensions to check
const CHECK_EXTENSIONS = ['.ts', '.js'];

// Regex to find problematic imports (relative imports without .js extension)
const IMPORT_REGEX = /import\s+(?:(?:\{[^}]*\})|(?:[\w*]+))?\s+from\s+['"](\.[^'"]+)['"]/g;
const DYNAMIC_IMPORT_REGEX = /import\(['"](\.[^'"]+)['"]\)/g;

const IGNORE_DIRS = ['node_modules', 'build', 'dist'];

let errorCount = 0;
let fileCount = 0;

/**
 * Checks if a file has problematic ES module imports
 * @param {string} filePath - Path to file
 * @returns {Promise<boolean>} - True if errors found
 */
async function checkFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    let hasErrors = false;
    const relativePath = path.relative(rootDir, filePath);
    
    // Skip files in node_modules, build, etc.
    if (IGNORE_DIRS.some(dir => relativePath.includes(dir))) {
      return false;
    }
    
    fileCount++;
    
    // Check for static imports
    let match;
    while ((match = IMPORT_REGEX.exec(content)) !== null) {
      const importPath = match[1];
      
      // Skip if import is a package (not starting with . or ..)
      if (!importPath.startsWith('.')) continue;
      
      // Check if import has file extension
      // We exclude .ts imports because these should point to the .js compiled output
      const hasExtension = path.extname(importPath) === '.js';
      
      if (!hasExtension) {
        console.error(`❌ ${relativePath}: Missing .js extension in import: ${importPath}`);
        errorCount++;
        hasErrors = true;
      }
    }
    
    // Reset regex lastIndex
    IMPORT_REGEX.lastIndex = 0;
    
    // Check for dynamic imports
    while ((match = DYNAMIC_IMPORT_REGEX.exec(content)) !== null) {
      const importPath = match[1];
      
      // Skip if import is a package
      if (!importPath.startsWith('.')) continue;
      
      const hasExtension = path.extname(importPath) === '.js';
      
      if (!hasExtension) {
        console.error(`❌ ${relativePath}: Missing .js extension in dynamic import: ${importPath}`);
        errorCount++;
        hasErrors = true;
      }
    }
    
    // Reset regex lastIndex
    DYNAMIC_IMPORT_REGEX.lastIndex = 0;
    
    return hasErrors;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return false;
  }
}

/**
 * Recursively scans directories for files to check
 * @param {string} directory - Directory to scan
 * @returns {Promise<void>}
 */
async function scanDirectory(directory) {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        // Skip ignored directories
        if (IGNORE_DIRS.includes(entry.name)) continue;
        await scanDirectory(fullPath);
      } else if (CHECK_EXTENSIONS.includes(path.extname(entry.name))) {
        await checkFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${directory}:`, error);
  }
}

async function main() {
  console.log('🔍 Scanning for ES module imports without .js extensions...');
  
  // Scan each configured directory
  for (const dir of SCAN_DIRS) {
    const dirPath = path.join(rootDir, dir);
    try {
      await fs.access(dirPath);
      await scanDirectory(dirPath);
    } catch (error) {
      console.warn(`⚠️ Directory ${dirPath} not found or not accessible`);
    }
  }
  
  console.log(`\n📊 Scan complete: ${fileCount} files checked, ${errorCount} errors found`);
  
  if (errorCount > 0) {
    console.error(`\n❌ Found ${errorCount} problematic ES module imports. Fix these to prevent production failures!`);
    console.error(`\nTIP: Run 'npm run lint:fix' to automatically fix these issues using ESLint.`);
    process.exit(1);
  } else {
    console.log('\n✅ No problematic imports found!');
  }
}

main().catch(console.error);

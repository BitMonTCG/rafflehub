#!/usr/bin/env node

/**
 * This script performs post-build cleanup of the server output directory
 * to ensure a clean, optimized serverless function bundle
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Files that should always be removed from the server output
const ALWAYS_REMOVE = [
  'vite.config.js',
  'tailwind.config.js',
  'postcss.config.js'
];

// Directories that should be checked for client-only dependencies
const CHECK_DIRS = [
  'node_modules'
];

// Client-only dependencies that should never be included in server bundle
const CLIENT_ONLY_DEPS = [
  '@rollup',
  'rollup',
  'vite'
];

/**
 * Checks if a file or directory should be removed
 * @param {string} filepath - Path to check
 * @returns {boolean} - True if the file should be removed
 */
async function shouldRemove(filepath) {
  const relativePath = path.relative(rootDir, filepath);
  const basename = path.basename(filepath);
  
  // Check for exact filename matches to remove
  if (ALWAYS_REMOVE.includes(basename)) {
    console.log(`🧹 Removing file: ${relativePath}`);
    return true;
  }
  
  // Check for client-only dependencies in node_modules
  if (CHECK_DIRS.some(dir => relativePath.includes(dir))) {
    for (const clientDep of CLIENT_ONLY_DEPS) {
      if (relativePath.includes(path.join('node_modules', clientDep))) {
        console.log(`🧹 Removing client-only dependency: ${relativePath}`);
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Recursively scans a directory and removes unwanted files
 * @param {string} directory - Directory to scan
 */
async function cleanDirectory(directory) {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        await cleanDirectory(fullPath);
        
        // Check if directory is now empty after cleaning
        const remainingFiles = await fs.readdir(fullPath);
        if (remainingFiles.length === 0) {
          console.log(`🧹 Removing empty directory: ${path.relative(rootDir, fullPath)}`);
          await fs.rm(fullPath, { recursive: true, force: true });
        }
      } else if (await shouldRemove(fullPath)) {
        await fs.unlink(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error cleaning directory ${directory}:`, error);
  }
}

async function main() {
  console.log('🧹 Starting server bundle cleanup...');
  
  const serverOutputDir = path.join(rootDir, 'build', 'server-out');
  
  try {
    await cleanDirectory(serverOutputDir);
    console.log('✅ Server bundle cleanup complete');
    
    // Output bundle size information
    const stats = await calculateDirSize(serverOutputDir);
    console.log(`📊 Server bundle size: ${formatBytes(stats.totalSize)}`);
    console.log(`📊 File count: ${stats.fileCount}`);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

/**
 * Calculates the total size of a directory
 * @param {string} directory - Directory to calculate size for
 * @returns {object} - Stats including total size and file count
 */
async function calculateDirSize(directory) {
  let totalSize = 0;
  let fileCount = 0;
  
  async function processDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await processDir(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
        fileCount++;
      }
    }
  }
  
  await processDir(directory);
  return { totalSize, fileCount };
}

/**
 * Formats bytes into a human-readable string
 * @param {number} bytes - Bytes to format
 * @returns {string} - Formatted string
 */
function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

main().catch(console.error);

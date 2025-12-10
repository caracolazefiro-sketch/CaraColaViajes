#!/usr/bin/env node

/**
 * Generate Search Index
 * Scans docs/ and CHEMA/ANALISIS/ folders
 * Creates a searchable JSON index for the /search page
 *
 * Usage: node scripts/generate-search-index.js
 */

const fs = require('fs');
const path = require('path');

const SEARCH_DIRS = [
  path.join(__dirname, '../docs'),
  path.join(__dirname, '../CHEMA'),
];

const OUTPUT_FILE = path.join(__dirname, '../public/search-index.json');

/**
 * Recursively read all files from directories
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

/**
 * Check if file should be indexed
 */
function shouldIndexFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const indexableExts = ['.md', '.txt', '.html', '.tsx', '.ts', '.json'];
  return indexableExts.includes(ext);
}

/**
 * Generate the index
 */
function generateIndex() {
  console.log('📚 Generating search index...');

  const index = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    fileCount: 0,
    entries: [],
  };

  // Process directories
  SEARCH_DIRS.forEach((dirPath) => {
    if (!fs.existsSync(dirPath)) {
      console.warn(`⚠️  Directory not found: ${dirPath}`);
      return;
    }

    const files = getAllFiles(dirPath);

    files.forEach((filePath) => {
      if (!shouldIndexFile(filePath)) {
        return;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const relativePath = path.relative(
          path.join(__dirname, '..'),
          filePath
        );

        index.entries.push({
          path: relativePath,
          filename: path.basename(filePath),
          content: content,
          lines: lines,
          ext: path.extname(filePath),
          size: content.length,
          generatedAt: new Date().toISOString(),
        });

        console.log(`✅ Indexed: ${relativePath}`);
      } catch (error) {
        console.error(`❌ Error reading ${filePath}:`, error.message);
      }
    });
  });

  index.fileCount = index.entries.length;

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write index file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2), 'utf-8');

  console.log(
    `\n📝 Search index generated successfully!\n   Location: ${OUTPUT_FILE}\n   Files indexed: ${index.fileCount}\n   Size: ${(index.entries.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(2)} KB`
  );

  return index;
}

// Run
if (require.main === module) {
  try {
    generateIndex();
  } catch (error) {
    console.error('❌ Error generating index:', error);
    process.exit(1);
  }
}

module.exports = { generateIndex };

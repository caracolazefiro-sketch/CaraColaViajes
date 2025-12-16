import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface SearchResult {
  filename: string;
  path: string;
  lineNumber: number;
  lineContent: string;
  context: {
    before: string[];
    after: string[];
  };
  matchIndices: number[];
}

interface SearchResponse {
  query: string;
  totalResults: number;
  results: SearchResult[];
  executionTime: number;
}

/**
 * Search for a query in indexed files
 * GET /api/search?q=query&limit=50
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.trim();
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const refresh = searchParams.get('refresh') === 'true';

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    );
  }

  const startTime = Date.now();

  try {
    // Try to use pre-generated index first (unless refresh is requested)
    let results: SearchResult[] = [];

    if (!refresh) {
      try {
        const indexPath = path.join(process.cwd(), 'public', 'search-index.json');
        if (fs.existsSync(indexPath)) {
          const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
          results = searchIndex(indexData, query, limit);
        }
      } catch (error) {
        console.log('Index not found, falling back to dynamic search');
      }
    }

    // If no index or refresh requested, do dynamic search
    if (results.length === 0 || refresh) {
      results = await searchFilesystem(query, limit);
    }

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      query,
      totalResults: results.length,
      results: results.slice(0, limit),
      executionTime,
    } as SearchResponse);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Search in pre-generated index
 */
function searchIndex(
  indexData: unknown,
  query: string,
  limit: number
): SearchResult[] {
  const results: SearchResult[] = [];
  const queryLower = query.toLowerCase();

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  const root = isRecord(indexData) ? indexData : {};
  const files = Array.isArray(root.files) ? root.files : [];

  files.forEach((fileUnknown) => {
    const file = isRecord(fileUnknown) ? fileUnknown : {};
    const lines = Array.isArray(file.lines) ? (file.lines.filter((x) => typeof x === 'string') as string[]) : [];

    lines.forEach((line: string, lineNumber: number) => {
      if (line.toLowerCase().includes(queryLower)) {
        const matchIndices = findMatchIndices(line, query);

        results.push({
          filename: String(file.filename ?? ''),
          path: String(file.path ?? ''),
          lineNumber: lineNumber + 1,
          lineContent: line,
          context: {
            before: lines.slice(Math.max(0, lineNumber - 2), lineNumber),
            after: lines.slice(lineNumber + 1, Math.min(lines.length, lineNumber + 3)),
          },
          matchIndices,
        });

        if (results.length >= limit) {
          return; // Exit inner loop
        }
      }
    });

    if (results.length >= limit) {
      return; // Exit outer loop
    }
  });

  return results;
}

/**
 * Dynamic search in filesystem
 */
async function searchFilesystem(
  query: string,
  limit: number
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const searchDirs = ['docs', 'CHEMA/ANALISIS'];
  const queryLower = query.toLowerCase();

  for (const dir of searchDirs) {
    const fullPath = path.join(process.cwd(), dir);

    if (!fs.existsSync(fullPath)) {
      continue;
    }

    const files = getAllFiles(fullPath);

    for (const filePath of files) {
      if (results.length >= limit) {
        break;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const relativePath = path.relative(process.cwd(), filePath);

        lines.forEach((line, lineNumber) => {
          if (results.length >= limit) {
            return;
          }

          if (line.toLowerCase().includes(queryLower)) {
            const matchIndices = findMatchIndices(line, query);

            results.push({
              filename: path.basename(filePath),
              path: relativePath,
              lineNumber: lineNumber + 1,
              lineContent: line,
              context: {
                before: lines.slice(Math.max(0, lineNumber - 2), lineNumber),
                after: lines.slice(lineNumber + 1, Math.min(lines.length, lineNumber + 3)),
              },
              matchIndices,
            });
          }
        });
      } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
      }
    }
  }

  return results;
}

/**
 * Get all files recursively
 */
function getAllFiles(dirPath: string): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dirPath);

  items.forEach((item) => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else if (shouldIndexFile(fullPath)) {
      files.push(fullPath);
    }
  });

  return files;
}

/**
 * Check if file should be indexed
 */
function shouldIndexFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const indexableExts = ['.md', '.txt', '.html', '.tsx', '.ts', '.json'];
  return indexableExts.includes(ext);
}

/**
 * Find all match indices in a string (case-insensitive)
 */
function findMatchIndices(text: string, query: string): number[] {
  const indices: number[] = [];
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  let startIndex = 0;

  while ((startIndex = textLower.indexOf(queryLower, startIndex)) !== -1) {
    indices.push(startIndex);
    startIndex += queryLower.length;
  }

  return indices;
}

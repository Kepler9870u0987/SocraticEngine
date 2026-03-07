/**
 * <VersionDiff /> — visual inline diff between two text versions.
 *
 * Uses a simple diff algorithm (word-level) to highlight insertions (green)
 * and deletions (red) between the old and new text.
 */

import './VersionDiff.css';

interface VersionDiffProps {
  oldText: string;
  newText: string;
}

type DiffOp = [-1 | 0 | 1, string];

/**
 * Simple word-level diff algorithm.
 * Returns an array of [operation, text] tuples:
 *   -1 = deletion, 0 = equal, 1 = insertion
 */
function computeDiff(oldText: string, newText: string): DiffOp[] {
  const oldWords = tokenize(oldText);
  const newWords = tokenize(newText);

  // LCS (Longest Common Subsequence) based diff
  const m = oldWords.length;
  const n = newWords.length;

  // Optimisation: for very long texts, fall back to line-level diff
  if (m * n > 500_000) {
    return computeLineDiff(oldText, newText);
  }

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }

  // Backtrack to build diff
  const result: DiffOp[] = [];
  let i = m, j = n;
  const stack: DiffOp[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      stack.push([0, oldWords[i - 1]!]);
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
      stack.push([1, newWords[j - 1]!]);
      j--;
    } else {
      stack.push([-1, oldWords[i - 1]!]);
      i--;
    }
  }

  // Reverse since we built from end
  stack.reverse();

  // Merge consecutive same-op entries
  for (const [op, text] of stack) {
    const last = result[result.length - 1];
    if (last && last[0] === op) {
      last[1] += text;
    } else {
      result.push([op, text]);
    }
  }

  return result;
}

function tokenize(text: string): string[] {
  // Split into words + whitespace tokens to preserve formatting
  return text.match(/\S+|\s+/g) || [];
}

function computeLineDiff(oldText: string, newText: string): DiffOp[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: DiffOp[] = [];

  let oi = 0, ni = 0;
  while (oi < oldLines.length || ni < newLines.length) {
    if (oi < oldLines.length && ni < newLines.length && oldLines[oi] === newLines[ni]) {
      result.push([0, oldLines[oi]! + '\n']);
      oi++; ni++;
    } else if (ni < newLines.length && (oi >= oldLines.length || newLines.indexOf(oldLines[oi]!, ni) === -1)) {
      result.push([1, newLines[ni]! + '\n']);
      ni++;
    } else {
      result.push([-1, oldLines[oi]! + '\n']);
      oi++;
    }
  }

  return result;
}

/** Strip HTML tags for plain-text diffing */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function VersionDiff({ oldText, newText }: VersionDiffProps) {
  const oldPlain = stripHtml(oldText);
  const newPlain = stripHtml(newText);

  if (oldPlain === newPlain) {
    return <div className="version-diff version-diff-identical">Nessuna differenza</div>;
  }

  const diffs = computeDiff(oldPlain, newPlain);

  return (
    <div className="version-diff">
      <div className="version-diff-legend">
        <span className="diff-legend-del">rimosso</span>
        <span className="diff-legend-ins">aggiunto</span>
      </div>
      <pre className="version-diff-content">
        {diffs.map(([op, text], idx) => {
          if (op === -1) return <del key={idx} className="diff-del">{text}</del>;
          if (op === 1) return <ins key={idx} className="diff-ins">{text}</ins>;
          return <span key={idx}>{text}</span>;
        })}
      </pre>
    </div>
  );
}

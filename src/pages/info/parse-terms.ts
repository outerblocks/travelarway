export type TermsNode =
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'table'; headers: string[]; rows: string[][] };

const SECTION = /^(\d+)\.\s+(.+)$/;
const CLAUSE_OR_SUB = /^(\d+\.\d+)\s+(.+)$/;

function isSubheading(rest: string): boolean {
  return rest.length <= 80 && !rest.includes('. ');
}

function isSectionHeading(rest: string): boolean {
  return rest.length <= 90 && !/[.!?]$/.test(rest);
}

function splitRow(line: string): string[] {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isDivider(cells: string[]): boolean {
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

export function parseTerms(body: string): TermsNode[] {
  const nodes: TermsNode[] = [];
  let bullets: string[] = [];
  let steps: string[] = [];
  let tableRows: string[][] = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;
    nodes.push({ kind: 'ul', items: bullets });
    bullets = [];
  };

  const flushSteps = () => {
    if (steps.length === 0) return;
    nodes.push({ kind: 'ol', items: steps });
    steps = [];
  };

  const flushTable = () => {
    if (tableRows.length === 0) return;
    const [headers, ...rest] = tableRows;
    const rows = rest.filter((row) => !isDivider(row));
    nodes.push({ kind: 'table', headers, rows });
    tableRows = [];
  };

  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) {
      flushBullets();
      flushSteps();
      flushTable();
      continue;
    }
    if (line.startsWith('|')) {
      flushBullets();
      flushSteps();
      tableRows.push(splitRow(line));
      continue;
    }
    flushTable();
    if (line.startsWith('• ')) {
      flushSteps();
      bullets.push(line.slice(2));
      continue;
    }
    flushBullets();
    if (line.startsWith('### ')) {
      flushSteps();
      nodes.push({ kind: 'h3', text: line.slice(4) });
      continue;
    }
    const section = line.match(SECTION);
    if (section && !/^\d+\.\d+/.test(line)) {
      if (isSectionHeading(section[2])) {
        flushSteps();
        nodes.push({ kind: 'h2', text: line });
      } else {
        steps.push(section[2]);
      }
      continue;
    }
    const clause = line.match(CLAUSE_OR_SUB);
    if (clause && isSubheading(clause[2])) {
      flushSteps();
      nodes.push({ kind: 'h3', text: line });
      continue;
    }
    flushSteps();
    nodes.push({ kind: 'p', text: line });
  }
  flushBullets();
  flushSteps();
  flushTable();
  return nodes;
}

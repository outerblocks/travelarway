import type pg from 'pg';

export interface JournalLineInput {
  accountCode: string;
  debitMinor?: number;
  creditMinor?: number;
  operatorId?: string | null;
}

export class JournalError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export async function postBalancedJournal(
  client: pg.PoolClient,
  input: {
    mode: string;
    currency: string;
    sourceType: string;
    sourceId: string;
    memo: string;
    lines: JournalLineInput[];
  },
): Promise<string> {
  const lines = input.lines.filter((line) => (line.debitMinor ?? 0) + (line.creditMinor ?? 0) > 0);
  const debit = lines.reduce((sum, line) => sum + (line.debitMinor ?? 0), 0);
  const credit = lines.reduce((sum, line) => sum + (line.creditMinor ?? 0), 0);
  if (debit !== credit || debit <= 0) throw new JournalError('journal_unbalanced');
  if (lines.some((line) => (line.debitMinor ?? 0) > 0 && (line.creditMinor ?? 0) > 0)) {
    throw new JournalError('journal_unbalanced');
  }

  const existing = await client.query<{ id: string }>(
    `select id from app.journal where source_type = $1 and source_id = $2`,
    [input.sourceType, input.sourceId],
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const journal = await client.query<{ id: string }>(
    `insert into app.journal (mode, currency, source_type, source_id, memo)
     values ($1, $2, $3, $4, $5)
     returning id`,
    [input.mode, input.currency, input.sourceType, input.sourceId, input.memo],
  );
  const journalId = journal.rows[0]?.id;
  if (!journalId) throw new JournalError('journal_create_failed');

  for (const line of lines) {
    const account = await client.query<{ id: string }>(
      `select id from app.finance_account where mode = $1 and code = $2`,
      [input.mode, line.accountCode],
    );
    const accountId = account.rows[0]?.id;
    if (!accountId) throw new JournalError('unknown_finance_account');
    await client.query(
      `insert into app.journal_line (journal_id, account_id, operator_id, debit_minor, credit_minor)
       values ($1, $2, $3, $4, $5)`,
      [journalId, accountId, line.operatorId ?? null, line.debitMinor ?? 0, line.creditMinor ?? 0],
    );
  }
  return journalId;
}

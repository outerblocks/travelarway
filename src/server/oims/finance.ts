import { query } from '@/server/db';

export async function loadOperatorStatement(operatorId: string, mode: 'bus' | 'ferry') {
  const [commercial, channels, payable] = await Promise.all([
    query<{ currency: string; gross: string; travelar: string; operator_net: string; sales: string }>(
      `select currency,
              coalesce(sum(gross_minor),0)::text as gross,
              coalesce(sum(travelar_minor),0)::text as travelar,
              coalesce(sum(operator_net_minor),0)::text as operator_net,
              count(*)::text as sales
         from app.booking_commercial
        where operator_id = $1 and mode = $2
        group by currency`,
      [operatorId, mode],
    ),
    query<{ channel: string; n: string; amount: string }>(
      `select b.channel, count(*)::text as n, coalesce(sum(b.total_minor),0)::text as amount
         from app.booking b
         join app.operator o on o.id = b.operator_id
        where b.operator_id = $1 and o.mode = $2 and b.status = 'issued'
        group by b.channel`,
      [operatorId, mode],
    ),
    query<{ currency: string; payable: string }>(
      `select j.currency, coalesce(sum(jl.credit_minor - jl.debit_minor), 0)::text as payable
         from app.journal_line jl
         join app.journal j on j.id = jl.journal_id
         join app.finance_account fa on fa.id = jl.account_id
        where jl.operator_id = $1 and j.mode = $2 and fa.code = '2100'
        group by j.currency`,
      [operatorId, mode],
    ),
  ]);
  return {
    mode,
    commercial: commercial.rows.map((row) => ({
      currency: row.currency,
      grossMinor: Number(row.gross),
      travelarMinor: Number(row.travelar),
      operatorNetMinor: Number(row.operator_net),
      sales: Number(row.sales),
    })),
    channels: channels.rows.map((row) => ({
      channel: row.channel,
      count: Number(row.n),
      amountMinor: Number(row.amount),
    })),
    payables: payable.rows.map((row) => ({
      currency: row.currency,
      payableMinor: Number(row.payable),
    })),
  };
}

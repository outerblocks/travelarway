import type { ReactNode } from 'react';
import { Link } from '@/router';
import { useI18n } from '@/context/I18nContext';
import { parseTerms, type TermsNode } from '@/pages/info/parse-terms';

function richText(text: string, skipSelf?: 'terms' | 'privacy' | 'cookies'): ReactNode[] {
  const pattern =
    /(customer@travelaraway\.com|partners@travelarway\.com)|(\+255 714 559 749)|(Terms and Conditions)|(our Terms)(?! and Conditions)|(Privacy Policy at \[link\])|(Privacy Policy)|(Cookie Policy)/g;
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1]) {
      parts.push(
        <a key={key} className="text-ink underline underline-offset-2" href={`mailto:${match[1]}`}>
          {match[1]}
        </a>,
      );
    } else if (match[2]) {
      parts.push(
        <a key={key} className="text-ink underline underline-offset-2" href="tel:+255714559749">
          +255 714 559 749
        </a>,
      );
    } else if (match[3] || match[4]) {
      parts.push(
        skipSelf === 'terms' ? (
          match[0]
        ) : (
          <Link key={key} to="/terms" className="text-ink underline underline-offset-2">
            {match[0]}
          </Link>
        ),
      );
    } else if (match[5] || match[6]) {
      parts.push(
        skipSelf === 'privacy' ? (
          match[0] === 'Privacy Policy at [link]' ? 'Privacy Policy' : match[0]
        ) : (
          <Link key={key} to="/privacy" className="text-ink underline underline-offset-2">
            Privacy Policy
          </Link>
        ),
      );
    } else {
      parts.push(
        skipSelf === 'cookies' ? (
          match[0]
        ) : (
          <Link key={key} to="/cookies" className="text-ink underline underline-offset-2">
            Cookie Policy
          </Link>
        ),
      );
    }
    key += 1;
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function PolicyNodes({
  nodes,
  skipSelf,
}: {
  nodes: TermsNode[];
  skipSelf?: 'terms' | 'privacy' | 'cookies';
}) {
  return (
    <div className="mt-10 space-y-5">
      {nodes.map((node, index) => {
        if (node.kind === 'h2') {
          return (
            <h2 key={index} className="pt-6 font-display text-listing font-bold text-neutral-900">
              {node.text}
            </h2>
          );
        }
        if (node.kind === 'h3') {
          return (
            <h3 key={index} className="pt-2 text-body font-semibold text-neutral-900">
              {node.text}
            </h3>
          );
        }
        if (node.kind === 'ul' || node.kind === 'ol') {
          const List = node.kind === 'ol' ? 'ol' : 'ul';
          const listClass = node.kind === 'ol' ? 'list-decimal' : 'list-disc';
          return (
            <List key={index} className={`${listClass} space-y-2 pl-5 text-body leading-relaxed text-neutral-700`}>
              {node.items.map((item) => (
                <li key={item.slice(0, 48)}>{richText(item, skipSelf)}</li>
              ))}
            </List>
          );
        }
        if (node.kind === 'table') {
          return (
            <div key={index} className="overflow-x-auto">
              <table className="w-full min-w-[52rem] border-collapse text-left text-body">
                <thead>
                  <tr className="border-b border-neutral-300">
                    {node.headers.map((header) => (
                      <th key={header} className="py-2 pr-4 font-semibold text-neutral-900">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {node.rows.map((row) => (
                    <tr key={row.join('|')} className="border-b border-neutral-200 align-top">
                      {row.map((cell, cellIndex) => (
                        <td key={`${cellIndex}-${cell.slice(0, 24)}`} className="py-3 pr-4 leading-relaxed text-neutral-700">
                          {richText(cell, skipSelf)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return (
          <p key={index} className="text-body leading-relaxed text-neutral-700">
            {richText(node.text, skipSelf)}
          </p>
        );
      })}
    </div>
  );
}

export function LegalPolicyPage({
  title,
  effectiveDate,
  lastUpdated,
  intro,
  body,
  skipSelf,
}: {
  title: string;
  effectiveDate: string;
  lastUpdated: string;
  intro?: string;
  body: string;
  skipSelf?: 'terms' | 'privacy' | 'cookies';
}) {
  const { tp } = useI18n();
  const nodes = parseTerms(body);

  return (
    <div className="bg-background">
      <div className="section-container py-8 sm:py-14">
        <article className="mx-auto max-w-3xl">
          <Link to="/" className="btn-ghost mb-8 px-0 hover:bg-transparent">
            ← {tp('backToHome')}
          </Link>
          <h1 className="mb-3 font-display text-page font-bold text-ink">{title}</h1>
          <p className="text-meta text-neutral-500">
            Effective date: {effectiveDate}
            <span className="mx-2 text-neutral-300" aria-hidden="true">
              /
            </span>
            Last updated: {lastUpdated}
          </p>
          {intro ? <p className="mt-6 text-body leading-relaxed text-neutral-600">{intro}</p> : null}
          <PolicyNodes nodes={nodes} skipSelf={skipSelf} />
          <div className="mt-12 border-t border-neutral-200 pt-8 text-meta text-neutral-500">{tp('operatedBy')}</div>
        </article>
      </div>
    </div>
  );
}

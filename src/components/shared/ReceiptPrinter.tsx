import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

export type ReceiptPrinterStage = 'processing' | 'printing' | 'complete';
export type ReceiptFeedMotion = 'smooth' | 'stepped';

interface ReceiptPrinterContextValue {
  animate: boolean;
  feedMotion: ReceiptFeedMotion;
  shouldMove: boolean;
  stage: ReceiptPrinterStage;
}

interface ReceiptPrinterRootProps {
  animate?: boolean;
  children: ReactNode;
  feedMotion?: ReceiptFeedMotion;
  stage: ReceiptPrinterStage;
  className?: string;
}

interface ReceiptPrinterPartProps {
  children?: ReactNode;
  className?: string;
}

const ReceiptPrinterContext = createContext<ReceiptPrinterContextValue | null>(null);

function useReceiptPrinter(part: string): ReceiptPrinterContextValue {
  const context = useContext(ReceiptPrinterContext);
  if (!context) throw new Error(`${part} must be used inside ReceiptPrinter.Root.`);
  return context;
}

const stageLabels: Record<ReceiptPrinterStage, string> = {
  processing: 'Processing your order',
  printing: 'Printing your receipt',
  complete: 'Order complete',
};

function ReceiptPrinterRoot({ animate = true, children, feedMotion = 'stepped', stage, className = '' }: ReceiptPrinterRootProps) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shouldMove = animate && !prefersReducedMotion;
  const context = { animate, feedMotion, shouldMove, stage };

  return (
    <ReceiptPrinterContext.Provider value={context}>
      <section aria-label="Receipt printer" data-stage={stage} className={`relative isolate flex w-full max-w-md flex-col items-center ${className}`}>
        {children}
      </section>
    </ReceiptPrinterContext.Provider>
  );
}

function ReceiptPrinterMachine({ children, className = '' }: ReceiptPrinterPartProps) {
  return (
    <div className={`relative z-20 isolate w-full overflow-visible rounded-xl border border-neutral-300 bg-neutral-100 p-4 pb-6 shadow-lg ${className}`}>
      {children}
      <div aria-hidden="true" className="absolute inset-x-8 bottom-2 z-40 h-3 rounded-full border border-brand-900 bg-brand-900 shadow-inner">
        <span className="absolute inset-x-2 top-px h-px rounded-full bg-brand-500/60" />
      </div>
    </div>
  );
}

function ReceiptPrinterHeader({ children, className = '' }: ReceiptPrinterPartProps) {
  return <div className={`relative z-10 flex min-h-10 items-center justify-between px-1 pb-3 ${className}`}>{children}</div>;
}

function ReceiptPrinterScreen({ children, className = '' }: ReceiptPrinterPartProps) {
  return <div className={`relative z-10 isolate overflow-hidden rounded-md border border-brand-800 bg-brand-900 p-3 text-white shadow-inner ${className}`}><div className="relative z-10">{children}</div></div>;
}

function ReceiptPrinterStatus({ children, className = '' }: ReceiptPrinterPartProps) {
  const { animate, shouldMove, stage } = useReceiptPrinter('ReceiptPrinter.Status');
  const isComplete = stage === 'complete';

  return (
    <div className={`flex min-w-0 items-center gap-2 ${className}`}>
      <span aria-hidden="true" className={`grid h-5 w-5 shrink-0 place-items-center ${isComplete ? 'text-accent' : 'text-white/70'}`}>
        {isComplete ? <CheckCircle2 size={18} /> : <Loader2 size={18} className={animate && shouldMove ? 'animate-spin motion-reduce:animate-none' : ''} />}
      </span>
      <div aria-live="polite" className="min-w-0 flex-1" role="status">
        <span key={stage} className={`block truncate text-xs font-medium leading-none ${shouldMove ? 'receipt-status-enter' : ''}`}>
          {children ?? stageLabels[stage]}
        </span>
      </div>
    </div>
  );
}

function ReceiptPrinterPaper({ children, className = '' }: ReceiptPrinterPartProps) {
  return <article className={`relative z-10 min-h-[32rem] border-x border-neutral-200 bg-white px-5 pt-6 pb-7 font-mono text-neutral-900 shadow-md ${className}`}>{children}</article>;
}

function ReceiptPrinterOutput({ children, className = '' }: ReceiptPrinterPartProps) {
  const { animate, feedMotion, stage } = useReceiptPrinter('ReceiptPrinter.Output');
  const isVisible = stage !== 'processing';
  const isPrinting = stage === 'printing' && animate;
  const motionClass = stage === 'processing'
    ? 'receipt-paper-hidden'
    : isPrinting
      ? 'receipt-paper-printing'
      : 'receipt-paper-complete';

  return (
    <div
      className={`relative z-10 -mt-4 min-h-[calc(32rem+1rem)] w-[84%] max-w-full overflow-hidden px-5 ${className}`}
      data-feed-motion={feedMotion}
      style={{ '--receipt-feed-duration': animate ? '1.75s' : '0s' } as CSSProperties}
    >
      <div
        aria-hidden={stage !== 'complete'}
        className={`relative isolate transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'} ${motionClass}`}
      >
        {children}
      </div>
    </div>
  );
}

export const ReceiptPrinter = {
  Header: ReceiptPrinterHeader,
  Machine: ReceiptPrinterMachine,
  Output: ReceiptPrinterOutput,
  Paper: ReceiptPrinterPaper,
  Root: ReceiptPrinterRoot,
  Screen: ReceiptPrinterScreen,
  Status: ReceiptPrinterStatus,
};

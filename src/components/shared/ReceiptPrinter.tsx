import { createContext, useContext, type ReactNode } from 'react';
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
  const shouldMove = animate && typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    <div className={`relative isolate w-full overflow-hidden rounded-lg border border-neutral-300 bg-neutral-100 p-3 pb-7 shadow-sm ${className}`}>
      {children}
      <div aria-hidden="true" className="absolute inset-x-6 bottom-3 z-40 h-2 rounded-sm border border-neutral-700 bg-neutral-800" />
    </div>
  );
}

function ReceiptPrinterHeader({ children, className = '' }: ReceiptPrinterPartProps) {
  return <div className={`relative z-10 flex h-11 items-start justify-between ${className}`}>{children}</div>;
}

function ReceiptPrinterScreen({ children, className = '' }: ReceiptPrinterPartProps) {
  return <div className={`relative z-10 isolate overflow-hidden rounded-md border border-neutral-700 bg-neutral-800 p-3 text-white shadow-inner ${className}`}><div className="relative z-10">{children}</div></div>;
}

function ReceiptPrinterStatus({ children, className = '' }: ReceiptPrinterPartProps) {
  const { animate, shouldMove, stage } = useReceiptPrinter('ReceiptPrinter.Status');
  const isComplete = stage === 'complete';

  return (
    <div className={`flex min-w-0 items-center gap-2 ${className}`}>
      <span aria-hidden="true" className={`grid h-5 w-5 shrink-0 place-items-center ${isComplete ? 'text-accent-600' : 'text-neutral-300'}`}>
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
  return <article className={`relative z-10 min-h-80 bg-white px-5 pt-6 pb-7 font-mono text-neutral-900 shadow-sm ${className}`}>{children}</article>;
}

function ReceiptPrinterOutput({ children, className = '' }: ReceiptPrinterPartProps) {
  const { animate, feedMotion, shouldMove, stage } = useReceiptPrinter('ReceiptPrinter.Output');
  const isVisible = stage !== 'processing';
  const stepped = feedMotion === 'stepped' && stage === 'printing' && shouldMove;
  const motionClass = stepped ? 'receipt-paper-printing' : stage === 'complete' || !shouldMove ? 'receipt-paper-complete' : 'receipt-paper-hidden';

  return (
    <div className={`relative z-50 -mt-4 h-[32rem] w-[calc(80%+3rem)] max-w-full overflow-hidden px-6 ${className}`}>
      {isVisible && <div aria-hidden="true" className="pointer-events-none absolute inset-x-6 -top-1 z-20 h-2 bg-neutral-800/60 blur-md" />}
      <div aria-hidden={stage !== 'complete'} className={`relative isolate transition-opacity ${isVisible ? 'opacity-100' : 'opacity-0'} ${motionClass}`} style={{ animationDuration: animate ? '1.75s' : '0s' }}>
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

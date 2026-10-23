import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Download, Printer, Home, Ticket as TicketIcon, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ReceiptPrinter, type ReceiptPrinterStage } from '@/components/shared/ReceiptPrinter';

export function ConfirmationPage() {
  const navigate = useNavigate();
  const { bookingState } = useApp();
  const [isPrinting, setIsPrinting] = useState(false);
  const [printDone, setPrintDone] = useState(false);
  const [printerStage, setPrinterStage] = useState<ReceiptPrinterStage>('processing');

  useEffect(() => {
    if (!bookingState.bookingReference) return;

    const printingTimer = window.setTimeout(() => setPrinterStage('printing'), 500);
    const completeTimer = window.setTimeout(() => setPrinterStage('complete'), 2250);

    return () => {
      window.clearTimeout(printingTimer);
      window.clearTimeout(completeTimer);
    };
  }, [bookingState.bookingReference]);

  if (!bookingState.bookingReference) {
    return (
      <div className="section-container py-16 text-center">
        <p className="text-body text-neutral-500 mb-4">No confirmed booking found.</p>
        <Link to="/" className="btn-primary">Back to home</Link>
      </div>
    );
  }

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
      setPrintDone(true);
      window.print();
    }, 1200);
  };

  const p = bookingState.passengers[0];

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="section-container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6 animate-fade-in">
            <div className="flex items-center justify-center gap-2 mb-2">
              {printerStage === 'complete' && <CheckCircle2 size={24} className="text-accent-600" />}
              <h1 className="text-page font-bold text-neutral-900">{printerStage === 'complete' ? 'Booking Confirmed' : 'Preparing your ticket'}</h1>
            </div>
            <p className="text-body text-neutral-500">
              Your booking reference is <span className="font-bold text-brand-600">{bookingState.bookingReference}</span>
            </p>
          </div>

          <ReceiptPrinter.Root stage={printerStage} feedMotion="stepped" className="mx-auto mb-6">
            <ReceiptPrinter.Machine>
              <ReceiptPrinter.Header>
                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-brand-600 text-xs font-bold text-white">T</div>
                <span className="pt-2 text-meta font-medium uppercase tracking-wide text-neutral-600">Travelar receipt</span>
              </ReceiptPrinter.Header>
              <ReceiptPrinter.Screen>
                <ReceiptPrinter.Status />
              </ReceiptPrinter.Screen>
              <ReceiptPrinter.Output>
                <ReceiptPrinter.Paper>
                  <div className="border-b border-dashed border-neutral-300 pb-4 text-center">
                    <p className="text-sm font-bold tracking-widest">TRAVELAR</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-neutral-500">Booking receipt</p>
                  </div>
                  <div className="space-y-3 py-4 text-[11px] leading-tight">
                    <div className="flex justify-between gap-4"><span className="text-neutral-500">Reference</span><strong>{bookingState.bookingReference}</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-neutral-500">Status</span><strong className="text-accent-600">PAID</strong></div>
                    <div className="border-t border-dashed border-neutral-300 pt-3">
                      <p className="text-neutral-500">Journey</p>
                      <p className="mt-1 font-bold">{bookingState.searchParams.origin || 'Origin'} → {bookingState.searchParams.destination || 'Destination'}</p>
                    </div>
                    <div className="flex justify-between gap-4"><span className="text-neutral-500">Travel date</span><strong>{bookingState.searchParams.date || '—'}</strong></div>
                    <div className="flex justify-between gap-4"><span className="text-neutral-500">Passengers</span><strong>{bookingState.passengers.length}</strong></div>
                    {bookingState.selectedSeats.length > 0 && <div className="flex justify-between gap-4"><span className="text-neutral-500">Seats</span><strong>{bookingState.selectedSeats.join(', ')}</strong></div>}
                    {p && <div className="border-t border-dashed border-neutral-300 pt-3"><p className="text-neutral-500">Passenger</p><p className="mt-1 font-bold">{p.fullName || 'Passenger'}</p><p className="mt-1 text-neutral-500">{p.email}</p></div>}
                  </div>
                  <div className="border-t border-dashed border-neutral-300 pt-4 text-center text-[10px] text-neutral-500">
                    Payment confirmed. Please present this receipt at boarding.
                  </div>
                  <div className="mt-5 flex justify-center"><TicketIcon size={44} className="text-neutral-900" /></div>
                </ReceiptPrinter.Paper>
              </ReceiptPrinter.Output>
            </ReceiptPrinter.Machine>
          </ReceiptPrinter.Root>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={handlePrint} className="btn-primary" disabled={isPrinting}>
              {isPrinting ? (
                <><Loader2 size={18} className="animate-spin" /> Preparing...</>
              ) : printDone ? (
                <><Printer size={18} /> Print Again</>
              ) : (
                <><Download size={18} /> Download PDF Ticket</>
              )}
            </button>
            <button onClick={() => navigate('/')} className="btn-secondary">
              <Home size={18} /> Back to Home
            </button>
          </div>

          <p className="text-meta text-neutral-400 text-center mt-6">
            This ticket was issued after payment confirmation by the payment provider.
            Please present this ticket at boarding.
          </p>
        </div>
      </div>
    </div>
  );
}

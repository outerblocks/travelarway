export function StayStars({ rating, label }: { rating: number; label: string }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <p className="flex items-center gap-0.5 text-meta text-neutral-700" aria-label={label}>
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={index < filled ? 'text-[#fdb812]' : 'text-neutral-300'}
        >
          ★
        </span>
      ))}
    </p>
  );
}

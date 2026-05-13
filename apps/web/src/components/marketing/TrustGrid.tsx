import { TrustCard, TrustCardProps } from './TrustCard';

const STATS: TrustCardProps[] = [
  { value: '4,200+', label: 'Active community listings' },
  { value: '$12M+', label: 'Total paid to creators' },
  { value: '98%', label: 'On-time payment rate' },
  { value: '4.8/5', label: 'Average brand rating' },
  { value: '2 days', label: 'Average payout speed' },
  { value: '0 fees', label: 'To list your community' },
];

export function TrustGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-[720px] mx-auto">
      {STATS.map((s) => (
        <TrustCard key={s.label} value={s.value} label={s.label} />
      ))}
    </div>
  );
}

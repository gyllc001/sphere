export interface TrustCardProps {
  value: string;
  label: string;
}

export function TrustCard({ value, label }: TrustCardProps) {
  return (
    <div className="bg-surface border border-default rounded-md p-7 text-center shadow-card">
      <div className="font-display text-[32px] font-bold text-accent mb-1 leading-none">
        {value}
      </div>
      <div className="text-[13px] text-secondary">{label}</div>
    </div>
  );
}

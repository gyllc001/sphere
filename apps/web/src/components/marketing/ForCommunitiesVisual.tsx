import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

const ELEVATED = 'shadow-[0_8px_32px_rgba(0,0,0,0.08)]';

interface InboundRow {
  brand: string;
  status: string;
  variant: BadgeVariant;
}

const INBOUND: InboundRow[] = [
  { brand: 'Arclight Technologies', status: 'New', variant: 'green' },
  { brand: 'Velo Analytics', status: 'New', variant: 'green' },
  { brand: 'Sparse AI', status: 'Negotiating', variant: 'yellow' },
];

/**
 * Right-side hero visual for /for-communities.
 * Two stacked floating cards: this-month's-earnings + inbound-this-week list.
 */
export function ForCommunitiesVisual() {
  return (
    <>
      <Card className={ELEVATED}>
        <div className="text-xs text-tertiary">This month&apos;s earnings</div>
        <div className="font-display text-[28px] font-bold text-primary leading-none mt-1 mb-1">
          $9,200
        </div>
        <div className="text-[13px] text-secondary">4 active partnerships</div>
      </Card>

      <Card className={ELEVATED}>
        <div className="text-xs text-secondary mb-2.5">Inbound this week</div>
        <div className="flex flex-col gap-2">
          {INBOUND.map((row) => (
            <div
              key={row.brand}
              className="flex justify-between items-center text-[13px]"
            >
              <span className="font-medium text-primary truncate pr-2">
                {row.brand}
              </span>
              <Badge variant={row.variant}>{row.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

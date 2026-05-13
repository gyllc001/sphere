import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

const ELEVATED = 'shadow-[0_8px_32px_rgba(0,0,0,0.08)]';

const BARS = [
  { opacity: 0.3, height: '35%' },
  { opacity: 0.5, height: '55%' },
  { opacity: 0.7, height: '75%' },
  { opacity: 0.9, height: '100%' },
];

/**
 * Right-side hero visual for /for-brands.
 * Two stacked floating cards: a campaign card with a ROI badge + 4-bar chart,
 * and a matched-community card with an avatar + 94% match score.
 */
export function ForBrandsVisual() {
  return (
    <>
      <Card className={ELEVATED}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-sm font-semibold text-primary">
              Q2 Growth Tools
            </div>
            <div className="text-xs text-secondary mt-0.5">
              3 communities · Active
            </div>
          </div>
          <Badge variant="green">4.1x ROI</Badge>
        </div>
        <div className="flex gap-2 h-10 items-end">
          {BARS.map((bar, i) => (
            <div
              key={i}
              className="flex-1 bg-accent rounded-t-sm"
              style={{ opacity: bar.opacity, height: bar.height }}
            />
          ))}
        </div>
      </Card>

      <Card className={ELEVATED}>
        <div className="text-xs text-secondary mb-2">Top matched community</div>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[13px] font-semibold flex-shrink-0">
            SI
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-primary truncate">
              The SaaS Insider
            </div>
            <div className="text-xs text-secondary truncate">
              42K subscribers · 43% open rate
            </div>
          </div>
          <div className="font-display text-base font-bold text-accent ml-auto">
            94%
          </div>
        </div>
      </Card>
    </>
  );
}

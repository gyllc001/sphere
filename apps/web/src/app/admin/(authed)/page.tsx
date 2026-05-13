import { requireAdmin } from '@/lib/auth/require-admin';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { PageHeader } from '@/components/ui/PageHeader';

const METRICS = [
  { label: 'Brands', value: '—' },
  { label: 'Community Owners', value: '—' },
  { label: 'Active Deals', value: '—' },
  { label: 'Open Disputes', value: '—' },
];

export default async function AdminDashboardPage() {
  const { admin } = await requireAdmin();
  const firstName = admin.name.split(' ')[0] || admin.name;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${firstName}`}
      />

      <div className="px-10 py-8 flex flex-col gap-8">
        <section
          aria-label="Overview"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {METRICS.map((card) => (
            <MetricCard
              key={card.label}
              label={card.label}
              value={card.value}
              placeholder
            />
          ))}
        </section>

        <section aria-labelledby="admin-info">
          <h2
            id="admin-info"
            className="font-display text-h3 text-primary mb-3"
          >
            Your account
          </h2>
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-label text-secondary uppercase">
                  Name
                </span>
                <span className="text-sm text-primary truncate">
                  {admin.name}
                </span>
              </div>
              <Badge variant={admin.role === 'super_admin' ? 'green' : 'gray'}>
                {admin.role}
              </Badge>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-label text-secondary uppercase">Email</span>
              <span className="text-sm text-primary">{admin.email}</span>
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}

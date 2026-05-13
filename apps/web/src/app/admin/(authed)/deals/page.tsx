import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';

export default function AdminDealsPage() {
  return (
    <>
      <PageHeader
        title="Deals"
        subtitle="Brand–community partnerships in progress."
      />
      <div className="px-10 py-8">
        <Card>
          <p className="text-sm text-secondary">List view coming soon.</p>
        </Card>
      </div>
    </>
  );
}

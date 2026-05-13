import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';

export default function AdminDisputesPage() {
  return (
    <>
      <PageHeader
        title="Disputes"
        subtitle="Open disputes raised by brands or community owners."
      />
      <div className="px-10 py-8">
        <Card>
          <p className="text-sm text-secondary">List view coming soon.</p>
        </Card>
      </div>
    </>
  );
}

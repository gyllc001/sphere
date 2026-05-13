import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';

export default function AdminBrandsPage() {
  return (
    <>
      <PageHeader
        title="Brands"
        subtitle="Brands subscribed to Sphere."
      />
      <div className="px-10 py-8">
        <Card>
          <p className="text-sm text-secondary">List view coming soon.</p>
        </Card>
      </div>
    </>
  );
}

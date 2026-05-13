import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';

export default function AdminCommunityOwnersPage() {
  return (
    <>
      <PageHeader
        title="Community Owners"
        subtitle="Owners of the communities matched to brand campaigns."
      />
      <div className="px-10 py-8">
        <Card>
          <p className="text-sm text-secondary">List view coming soon.</p>
        </Card>
      </div>
    </>
  );
}

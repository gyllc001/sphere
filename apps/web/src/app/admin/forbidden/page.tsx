import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SphereMark } from '@/components/admin/SphereMark';

export default function AdminForbiddenPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-base px-4 py-12">
      <Card className="w-full max-w-[400px] p-10 flex flex-col items-center text-center gap-4">
        <SphereMark size={40} />
        <h1 className="font-display text-2xl font-semibold text-primary mt-2">
          Access denied
        </h1>
        <p className="text-sm text-secondary">
          You don&apos;t have access to the admin section.
        </p>
        <form action="/admin/logout" method="POST" className="w-full mt-2">
          <Button type="submit" variant="primary" size="lg" className="w-full">
            Sign out
          </Button>
        </form>
      </Card>
    </div>
  );
}

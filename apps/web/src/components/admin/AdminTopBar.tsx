import { ReactNode } from 'react';

import { Button } from '@/components/ui/Button';

export interface AdminTopBarProps {
  admin: { name: string; email: string };
  /** Optional content rendered on the left (e.g., a breadcrumb). */
  left?: ReactNode;
}

export function AdminTopBar({ admin, left }: AdminTopBarProps) {
  return (
    <div className="h-14 shrink-0 flex items-center justify-between gap-4 px-10 border-b border-default bg-surface">
      <div className="min-w-0 flex items-center gap-3">{left}</div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end leading-tight min-w-0">
          <span className="text-[13px] font-medium text-primary truncate">
            {admin.name}
          </span>
          <span className="text-xs text-secondary truncate">{admin.email}</span>
        </div>
        <form action="/admin/logout" method="POST">
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  Briefcase,
  Handshake,
  LayoutDashboard,
  Moon,
  Sun,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/cn';
import { useTheme } from '@/lib/theme';
import { SphereMark } from './SphereMark';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/brands', label: 'Brands', icon: Briefcase },
  { href: '/admin/community-owners', label: 'Community Owners', icon: Users },
  { href: '/admin/deals', label: 'Deals', icon: Handshake },
  { href: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname() || '';
  const { theme, toggle } = useTheme();
  const Icon = theme === 'dark' ? Moon : Sun;
  const label = theme === 'dark' ? 'Dark mode' : 'Light mode';

  return (
    <aside className="w-[220px] min-w-[220px] h-full flex flex-col bg-sidebar border-r border-sidebar overflow-y-auto">
      {/* Wordmark */}
      <div className="px-4 py-5 border-b border-sidebar">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2.5 select-none"
        >
          <SphereMark size={28} />
          <span className="font-display font-bold tracking-tight text-[17px] leading-none text-sidebar-active">
            Sphere
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col py-3">
        <div className="px-4 pb-1.5 text-label text-sidebar uppercase">
          Admin
        </div>
        <div className="flex flex-col">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 text-[13px] py-[7px] px-4 border-l-2 transition-colors',
                  active
                    ? 'border-accent bg-sidebar-hover text-sidebar-active'
                    : 'border-transparent text-sidebar hover:bg-sidebar-hover hover:text-sidebar-active',
                )}
              >
                <Icon size={15} strokeWidth={1.75} className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer — theme toggle. Icon + label reflect the CURRENT theme;
          clicking flips it. Persisted via localStorage (`sphere.theme`). */}
      <div className="border-t border-sidebar px-3 py-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="w-full inline-flex items-center gap-2 px-2 py-2 rounded-sm text-[13px] text-sidebar hover:bg-sidebar-hover hover:text-sidebar-active transition-colors"
        >
          <Icon size={15} strokeWidth={1.75} />
          <span>{label}</span>
        </button>
      </div>
    </aside>
  );
}

import Link from 'next/link';

import { buttonClasses } from '@/components/ui/Button';

export function PricingFreeForCommunities() {
  return (
    <section className="max-w-[640px] mx-auto mt-10 mb-20 px-6 md:px-[60px]">
      <div className="bg-subtle border border-default rounded-md p-8 text-center">
        <h3 className="font-display text-xl font-semibold text-primary mb-2">
          Community owners are always free
        </h3>
        <p className="text-[15px] text-secondary leading-relaxed mb-5">
          Listing and receiving briefs on Sphere is completely free for
          community owners. Sphere takes a small 5% fee only when a deal
          closes and payment is received.
        </p>
        <Link
          href="/for-communities"
          className={buttonClasses({ variant: 'primary', size: 'md' })}
        >
          List your community free
        </Link>
      </div>
    </section>
  );
}

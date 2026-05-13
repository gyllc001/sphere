import { Check } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { cn } from '@/lib/cn';

type CellValue = string | true | false;

interface ComparisonRow {
  feature: string;
  starter: CellValue;
  growth: CellValue;
  scale: CellValue;
}

const ROWS: ComparisonRow[] = [
  { feature: 'Active campaigns', starter: '2', growth: '8', scale: 'Unlimited' },
  { feature: 'Team seats', starter: '1', growth: '3', scale: 'Unlimited' },
  { feature: 'AI matching', starter: false, growth: true, scale: true },
  { feature: 'Advanced analytics', starter: false, growth: true, scale: true },
  { feature: 'Dedicated manager', starter: false, growth: false, scale: true },
  { feature: 'Custom integrations', starter: false, growth: false, scale: true },
  { feature: 'Platform fee per deal', starter: '8%', growth: '5%', scale: '3%' },
];

function renderCell(value: CellValue, isGrowth: boolean) {
  if (value === true) {
    return (
      <Check
        size={16}
        strokeWidth={2}
        className="text-accent inline"
        aria-label="Included"
      />
    );
  }
  if (value === false) {
    return (
      <span className="text-tertiary" aria-label="Not included">
        —
      </span>
    );
  }
  // String literal — highlight the Growth column.
  return (
    <span className={cn(isGrowth && 'text-accent font-semibold')}>
      {value}
    </span>
  );
}

export function PricingComparisonTable() {
  return (
    <section className="max-w-[900px] mx-auto px-6 md:px-[60px] mt-16">
      <h2 className="font-display text-2xl font-semibold text-primary mb-4">
        Feature Comparison
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Feature</TableHead>
            <TableHead className="text-center">Starter</TableHead>
            <TableHead className="text-center text-accent">Growth</TableHead>
            <TableHead className="text-center">Scale</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map((row) => (
            <TableRow key={row.feature}>
              <TableCell>{row.feature}</TableCell>
              <TableCell className="text-center">
                {renderCell(row.starter, false)}
              </TableCell>
              <TableCell className="text-center">
                {renderCell(row.growth, true)}
              </TableCell>
              <TableCell className="text-center">
                {renderCell(row.scale, false)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

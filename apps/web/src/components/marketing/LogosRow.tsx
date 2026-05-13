const LOGOS = ['Vercel', 'Linear', 'Loom', 'Notion', 'Retool', 'Raycast'];

export function LogosRow() {
  return (
    <section className="py-12 px-6 md:px-[60px] border-b border-default">
      <div className="text-xs uppercase tracking-wider text-tertiary text-center mb-7">
        Trusted by teams at
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
        {LOGOS.map((name) => (
          <div
            key={name}
            className="inline-flex items-center px-5 py-2 rounded-md bg-surface border border-default font-display text-sm font-semibold tracking-tight text-secondary"
          >
            {name}
          </div>
        ))}
      </div>
    </section>
  );
}

// Minimal layout for legacy auth'd app screens.
//
// Does NOT add marketing chrome. Each page renders its own internal
// structure (its own <header>, its own bg-gray-50 wrapper, etc.). The
// fragment passthrough exists so the (app) route group is a real
// boundary in the file tree — future per-group auth middleware,
// loading UI, or error UI can hook in here without touching any
// individual page.
//
// TODO: auth gate goes here once the legacy pages are migrated off
// the old session model and onto Supabase auth.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

/**
 * Lightweight in-pane loading placeholder used while a lazy route chunk
 * loads. Keeps the shell (tabs + banner) on screen instead of replacing the
 * whole viewport with the full-screen splash.
 */
export function ScreenSkeleton() {
  return (
    <div className="p-4 space-y-3 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-24 rounded-2xl bg-muted/60" />
      <div className="h-16 rounded-2xl bg-muted/50" />
      <div className="h-16 rounded-2xl bg-muted/40" />
      <div className="h-16 rounded-2xl bg-muted/30" />
    </div>
  );
}

export default ScreenSkeleton;
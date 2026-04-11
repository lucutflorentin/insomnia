export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
        <p className="mt-4 text-sm text-text-muted">Se incarca...</p>
      </div>
    </div>
  );
}

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Minimal layout — no sidebar for login page
  return <>{children}</>;
}

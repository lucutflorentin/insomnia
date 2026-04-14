import ArtistSidebar from '@/components/artist/ArtistSidebar';

export default function ArtistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      <ArtistSidebar />
      <div className="flex flex-1 flex-col overflow-auto">
        <div className="flex-1 p-8">{children}</div>
      </div>
    </div>
  );
}

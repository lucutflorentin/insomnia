import ArtistSidebar from '@/components/artist/ArtistSidebar';

export default function ArtistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-bg-primary md:h-screen md:overflow-hidden">
      <ArtistSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <div className="flex-1 px-4 pb-24 pt-20 sm:px-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}

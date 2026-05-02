import Header from '@/components/layout/Header';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      <Header />
      <div className="flex flex-1 items-center justify-center px-4 pb-12 pt-24">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-heading text-4xl text-accent">Insomnia Tattoo</h1>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

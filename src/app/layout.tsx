
import type { Metadata } from 'next';
import './globals.css';
import LayoutWrapper from '@/components/LayoutWrapper';
import AutoLogout from '@/components/AutoLogout';
import AuthGuard from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'Khairul International Dashboard',
  description: 'Modern Hotel Management Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white min-h-screen font-sans antialiased overflow-x-hidden">
        <AutoLogout />
        {/* Background Gradients */}
        <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl opacity-30 transform -translate-x-1/2 -translate-y-1/2 mix-blend-screen"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl opacity-30 transform translate-x-1/2 translate-y-1/2 mix-blend-screen"></div>
        </div>

        <AuthGuard>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthGuard>
      </body>
    </html>
  );
}

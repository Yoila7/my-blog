import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthProvider from '@/components/AuthProvider';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AuthProvider />
        <Header />
        <main style={{ flex: 1, padding: '2rem 10% 3rem 10%' }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

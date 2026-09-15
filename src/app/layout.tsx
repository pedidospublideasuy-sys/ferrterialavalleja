import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ferretería Lavalleja | Productos y herramientas',
  description: 'Comprá productos, herramientas y accesorios con la mejor atención.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
        <body className={`${inter.className} flex flex-col min-h-screen bg-[#f7f7f7]`}>
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppFloat />
        </Providers>
      </body>
    </html>
  );
}

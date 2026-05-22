import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Impulso Vector',
  description: 'Motor de inferencia relacional',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
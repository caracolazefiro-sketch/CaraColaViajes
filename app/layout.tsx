import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Entorno Pruebas | CaraCola Viajes - Planificador de Rutas Camper",
  description: "Calcula tu ruta en autocaravana, encuentra áreas de pernocta y controla tus gastos de viaje.",
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const buildStamp =
    typeof process !== 'undefined'
      ? `${process.env.VERCEL_ENV ?? 'local'} · ${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev'} · ${new Date().toISOString().slice(0, 10)}`
      : undefined
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <footer style={{
          position: 'fixed',
          right: 8,
          bottom: 8,
          fontSize: '12px',
          background: 'rgba(0,0,0,0.6)',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '6px',
          zIndex: 1000,
        }}>
          <span title="Entorno · commit · fecha">
            {buildStamp}
          </span>
        </footer>
      </body>
    </html>
  );
}

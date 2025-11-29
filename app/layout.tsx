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
  title: "CaraCola Viajes 🐌 | Planificador de Rutas Camper",
  description: "Calcula tu ruta en autocaravana, encuentra áreas de pernocta y controla tus gastos de viaje.",
  icons: {
    icon: '/logo.jpg', // ✅ CORREGIDO: Ahora apunta al .jpg real
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es"> {/* ✅ CORREGIDO: Idioma español */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

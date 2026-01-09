import { ServiceWorkerRegister } from '@/components/serviceWorkerRegister';
import { Nunito } from '@next/font/google';
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import "./globals.css";

const nunito = Nunito({
  subsets: ['latin'],
  weight: ["200", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Template - Sistema de Gerenciamento",
  description: "Template com autenticação e controle de níveis de acesso",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${nunito.className} antialiased`}>
        <ServiceWorkerRegister />
        {children}
        <Analytics />
      </body>
    </html>
  );
}

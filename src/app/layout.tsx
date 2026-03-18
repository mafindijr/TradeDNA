import type { Metadata } from "next";
import { Toaster } from "sonner";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "../components/wallet-provider";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradeDNA",
  description: "Web3 trader analytics dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <WalletProvider>{children}</WalletProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            className:
              "rounded-xl border border-white/10 bg-[#111827] text-white shadow-[0_12px_24px_rgba(0,0,0,0.35)]",
          }}
        />
      </body>
    </html>
  );
}

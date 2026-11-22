import type { Metadata, Viewport } from "next";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";

// Title copied from the original Shop360 HTML <title>.
export const metadata: Metadata = {
  title: "Shop360 — Stage 3.3 Subtle Color Accents · V89 Functional Baseline",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Shop360" },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#245b4f",
};

// Same root attributes as the original HTML: <html data-app-version> and <body data-version data-stage>.
// suppressHydrationWarning: the app's scripts update attributes on these nodes after load.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-app-version="68" suppressHydrationWarning>
      <body data-version="V89" data-stage="3.1" suppressHydrationWarning>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}

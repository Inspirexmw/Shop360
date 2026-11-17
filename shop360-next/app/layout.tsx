import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shop360 — Stage 3.3 Subtle Color Accents · V89 Functional Baseline",
};

/**
 * Applies the saved light/dark theme before first paint (same keys and migration
 * rule as the original theme script) so there is no flash of the wrong theme.
 */
const earlyTheme = `try{var k='shop360-reference-theme',t=localStorage.getItem(k);if(!t){var o=localStorage.getItem('shopx-ui-theme');if(o)t=o==='dark'?'dark':'light'}document.documentElement.dataset.theme=t||'light'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-app-version="68" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: earlyTheme }} />
      </head>
      <body data-version="V89" data-stage="3.1" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

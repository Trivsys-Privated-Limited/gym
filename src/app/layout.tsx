import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { AppStoreProvider } from "@/lib/store/app-store";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-barlow", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${BRAND.name} — ${BRAND.tagline}`, template: `%s · ${BRAND.name}` },
  description: BRAND.description,
};

export const viewport: Viewport = {
  themeColor: "#0b0c0e",
  width: "device-width",
  initialScale: 1,
};

/** Applies the saved theme before paint so there is no light/dark flash. */
const themeScript = `(function(){try{var p=JSON.parse(localStorage.getItem("fitflow:theme")||'"dark"');var t=p==="system"?(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):p;document.documentElement.dataset.theme=t==="light"?"light":"dark";}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${inter.variable} ${barlow.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only z-[100] rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <AppStoreProvider>{children}</AppStoreProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "!bg-surface !border-border !text-foreground !rounded-xl",
              description: "!text-muted",
              actionButton: "!bg-primary !text-primary-foreground",
            },
          }}
        />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KosBaliku - Dashboard Management",
  description: "Platform management untuk kos-kosan terpercaya",
  keywords: ["kos", "kost", "dashboard", "management", "property"],
  authors: [{ name: "KosBaliku Team" }],
  creator: "KosBaliku",
  publisher: "KosBaliku",
  robots: "index, follow",
  openGraph: {
    title: "KosBaliku - Dashboard Management",
    description: "Platform management untuk kos-kosan terpercaya",
    url: "https://kosbaliku.com",
    siteName: "KosBaliku",
    type: "website",
    images: [
      {
        url: "/images/webIcon.svg",
        width: 32,
        height: 32,
        alt: "KosBaliku Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "KosBaliku - Dashboard Management",
    description: "Platform management untuk kos-kosan terpercaya",
    images: ["/images/webIcon.svg"],
  },
  // ✅ Add icons configuration
  icons: {
    icon: [
      {
        url: "/images/webIcon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/favicon.ico",
        sizes: "any",
      },
    ],
    shortcut: "/images/webIcon.svg",
    apple: [
      {
        url: "/images/webIcon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* ✅ Additional favicon links for better browser support */}
        <link rel="icon" type="image/svg+xml" href="/images/webIcon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/images/webIcon.svg" />
        <link rel="apple-touch-icon" href="/images/webIcon.svg" />
        
        {/* ✅ Theme color for mobile browsers */}
        <meta name="theme-color" content="#1A3A5C" />
        <meta name="msapplication-TileColor" content="#1A3A5C" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* ✅ Viewport and mobile optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KosBaliku" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
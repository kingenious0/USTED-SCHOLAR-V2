import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "USTED Scholar",
  description: "Tech-Modern Learning Assistant for USTED",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
    ],
    apple: [
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
  },
};

import { ThemeProvider } from "@/components/theme-provider";
import { SideNavBar } from "@/components/layout/SideNavBar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className={`${outfit.variable} font-sans min-h-full flex bg-[#050505] text-white`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
          <SideNavBar />
          <main className="flex-1 lg:pl-64 min-h-screen">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "Pharmacy POS",
  description: "Pharmacy Point of Sale System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
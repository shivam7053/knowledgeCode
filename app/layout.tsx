import "./globals.css";
import { Providers } from "./providers";
import AppNavbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <AppNavbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
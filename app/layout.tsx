import "./globals.css";
import { Providers } from "./providers";
import AppNavbar from "@/components/Navbar";
import ConditionalFooter from "@/components/ConditionalFooter"; // Import the new conditional footer component

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
          <ConditionalFooter /> {/* Use the conditional footer */}
        </Providers>
      </body>
    </html>
  );
}
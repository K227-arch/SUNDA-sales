import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SUNDA Payout & Unit Loan System",
  description: "Internal staff system – client payouts and unit loan management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ fontFamily: "Segoe UI, Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}

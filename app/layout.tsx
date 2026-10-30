import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASTRA-GRID | Municipal Triage & Causal Infrastructure Workbench",
  description: "Palantir-grade civic complaint triage with causal cluster analysis, policy-weight simulation, and multilingual support for Mangaluru.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-alabaster">
        {children}
      </body>
    </html>
  );
}

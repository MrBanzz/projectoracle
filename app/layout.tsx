import type { Metadata } from "next";
import "./globals.css";
import "reactflow/dist/style.css";

export const metadata: Metadata = {
  title: "ProjectOracle",
  description:
    "Architecture-aware impact analysis for any GitHub repository. Mock-data demo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface-base text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}

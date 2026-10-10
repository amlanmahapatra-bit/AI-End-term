import type { ReactNode } from "react";

export const metadata = { title: "Aangan Call Agent", description: "Calls answered, leads qualified, cost to run" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fafaf9", color: "#1c1917" }}>{children}</body>
    </html>
  );
}

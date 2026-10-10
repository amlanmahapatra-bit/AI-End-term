import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Aangan Call Agent",
  description: "Every enquiry answered, qualified and booked. Live results and running cost.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

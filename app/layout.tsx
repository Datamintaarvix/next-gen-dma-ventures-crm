import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth/auth-context";
import { AppLayout } from "@/components/layout/app-layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXT GEN DMA VENTURES | CRM",
  description: "Enterprise Education CRM for NEXT GEN DMA VENTURES",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F3F8F7] text-[#11232B] antialiased">
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}

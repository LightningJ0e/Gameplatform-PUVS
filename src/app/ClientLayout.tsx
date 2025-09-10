"use client";

import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <Header />
      <main className="flex-1 overflow-hidden">{children}</main>
    </AuthProvider>
  );
}

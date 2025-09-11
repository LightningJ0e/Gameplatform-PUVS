"use client";

import { AuthProvider } from "@/context/AuthContext";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <main className="flex-1 overflow-hidden">{children}</main>
    </AuthProvider>
  );
}

"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    signOut({ redirect: false }).then(() => {
      router.push("/auth/signin");
      router.refresh();
    });
  }, [router]);

  return (
    <main className="min-h-screen bg-forgeBlack text-steel flex items-center justify-center">
      <div className="text-center">
        <p className="text-steel/70">Signing out...</p>
      </div>
    </main>
  );
}


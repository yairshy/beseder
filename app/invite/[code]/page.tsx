"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string) || "";

  useEffect(() => {
    if (code) {
      localStorage.setItem("pendingInviteCode", code);
      router.replace(`/family?code=${code}`);
    }
  }, [code, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

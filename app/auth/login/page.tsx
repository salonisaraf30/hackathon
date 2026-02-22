"use client";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <button onClick={() => router.push("/auth")} className="text-[#00FF41]">Go to Auth</button>
    </div>
  );
}

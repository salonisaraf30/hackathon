"use client";

import Link from "next/link";

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Update Password</h1>
        <Link href="/auth" className="text-[#00FF41] mt-2 inline-block">Back to Auth</Link>
      </div>
    </div>
  );
}

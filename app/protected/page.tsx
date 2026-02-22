import Link from "next/link";

export default function ProtectedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Protected</h1>
        <Link href="/dashboard" className="text-[#00FF41] mt-2 inline-block">Dashboard</Link>
      </div>
    </div>
  );
}

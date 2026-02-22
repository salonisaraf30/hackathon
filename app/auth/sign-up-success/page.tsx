import Link from "next/link";

const SM = { fontFamily: "var(--font-space-mono)" };
const IBM = { fontFamily: "var(--font-ibm-plex-mono)" };

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div
          className="rounded-lg p-8"
          style={{ backgroundColor: "#0D0D0D", border: "1px solid #00FFFF" }}
        >
          <h1 className="text-xl text-[#00FFFF] mb-2" style={SM}>
            CHECK YOUR EMAIL
          </h1>
          <p className="text-[13px] text-[#888888] leading-relaxed" style={IBM}>
            We sent a confirmation link to your email. Click it to activate your
            account, then sign in.
          </p>
          <Link
            href="/auth/login"
            className="block text-center mt-6 px-4 py-2.5 rounded text-[13px] transition-colors"
            style={{ border: "1px solid #00FF41", color: "#00FF41", ...SM }}
          >
            GO TO LOGIN →
          </Link>
        </div>
      </div>
    </div>
  );
}

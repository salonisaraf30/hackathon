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
          <h1 className="text-2xl text-[#00FFFF] mb-3" style={SM}>
            ACCOUNT CREATED
          </h1>
          <p className="text-[15px] text-[#888888] leading-relaxed" style={IBM}>
            Your account has been created successfully. Continue to login.
          </p>
          <Link
            href="/auth/login"
            className="block text-center mt-6 px-5 py-3 rounded text-[15px] transition-colors"
            style={{ border: "1px solid #00FF41", color: "#00FF41", ...SM }}
          >
            CONTINUE TO LOGIN →
          </Link>
        </div>
      </div>
    </div>
  );
}

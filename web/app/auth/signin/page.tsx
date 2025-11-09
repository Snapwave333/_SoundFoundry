import Image from "next/image";
import Link from "next/link";
import SignInForm from "./SignInForm";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-forgeBlack text-steel flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-graphite/60 bg-graphite/60 backdrop-blur p-8">
        <div className="mb-6 flex justify-center">
          <Image
            src="/branding/logo_wordmark.svg"
            alt="SoundFoundry"
            width={220}
            height={40}
            priority
            className="h-10 w-auto"
          />
        </div>
        
        <SignInForm />

        <div className="mt-6 text-center">
          <p className="text-sm text-steel/70">
            Don't have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-resonance hover:text-resonance/90 underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-resonance"
            >
              Sign up
            </Link>
          </p>
        </div>

        <p className="mt-6 text-xs text-steel/70 text-center">
          By continuing you agree to our{" "}
          <Link
            href="/terms"
            className="text-resonance underline hover:text-resonance/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-resonance"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-resonance underline hover:text-resonance/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-resonance"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}


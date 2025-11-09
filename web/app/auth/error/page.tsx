import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The verification token has expired or has already been used.",
    InvalidInvite: "Invalid invite token.",
    InviteUsed: "This invite has already been used.",
    InviteExpired: "This invite has expired.",
    DefaultSignIn: "Unable to sign in.",
  };

  const message = error ? errorMessages[error] || errorMessages.DefaultSignIn : errorMessages.DefaultSignIn;

  return (
    <main className="min-h-screen bg-forgeBlack text-steel flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-graphite/60 bg-graphite/60 backdrop-blur p-8 text-center">
        <div className="mb-6 flex justify-center">
          <Image
            src="/branding/logo_wordmark.svg"
            alt="SoundFoundry - Craft Your Sound"
            width={220}
            height={40}
            priority
            className="h-10 w-auto"
          />
        </div>

        <h1 className="text-2xl font-semibold text-steel mb-4">Authentication Error</h1>
        <p className="text-steel/70 mb-6">{message}</p>

        <Button asChild className="w-full bg-resonance hover:bg-resonance/90 text-white">
          <Link href="/auth/signin">Return to Sign In</Link>
        </Button>
      </div>
    </main>
  );
}


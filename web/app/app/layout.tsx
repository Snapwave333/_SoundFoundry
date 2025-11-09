import Link from "next/link";
import Image from "next/image";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { FreeModeBanner } from "@/components/FreeModeBanner";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="border-b border-border bg-bg-elevated/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/app"
            className="flex items-center gap-3 hover:opacity-80 transition-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label="PromptBloom App"
          >
            <Image
              src="/branding/logo.svg"
              alt=""
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-xl font-semibold">
              <span className="text-fg">Prompt</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-accent-hover">
                Bloom
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            <Link
              href="/app/create"
              className="text-fg-muted hover:text-fg transition-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Create
            </Link>
            <Link
              href="/app/library"
              className="text-fg-muted hover:text-fg transition-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Library
            </Link>
            <Link
              href="/app/settings"
              className="text-fg-muted hover:text-fg transition-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Settings
            </Link>
          </nav>

          <CreditsDisplay />
        </div>
      </header>

      <main className="flex-1">
        <FreeModeBanner />
        {children}
      </main>
    </div>
  );
}

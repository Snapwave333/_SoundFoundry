import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Privacy Policy — PromptBloom",
  description: "PromptBloom privacy policy and data handling practices.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-forge-black">
      <header className="border-b border-forge-gray/30 bg-forge-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/branding/logo.svg"
              alt="PromptBloom"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-xl font-semibold">
              <span className="text-forge-white">Prompt</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-forge-amber to-forge-blue">
                Bloom
              </span>
            </span>
          </Link>
          <Button asChild className="bg-forge-amber text-forge-black hover:brightness-110">
            <Link href="/app">Open App</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-24 max-w-4xl">
        <h1 className="text-5xl font-bold text-forge-white mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-forge-white/80">
          <p className="text-sm text-forge-white/60">Last updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-forge-white mt-8 mb-4">Data Collection</h2>
            <p>
              We collect minimal data necessary to provide our service, including account information, 
              generated tracks, and usage analytics. We do not sell your data to third parties.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-forge-white mt-8 mb-4">Data Storage</h2>
            <p>
              Your generated tracks and account data are stored securely. Audio files are stored in 
              object storage with appropriate access controls.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-forge-white mt-8 mb-4">Cookies and Analytics</h2>
            <p>
              We use cookies for authentication and session management. Analytics are collected with 
              user consent and used to improve our service.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-forge-white mt-8 mb-4">Your Rights</h2>
            <p>
              You have the right to access, modify, or delete your data at any time through your 
              account settings or by contacting us.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}


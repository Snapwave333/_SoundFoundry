import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Terms of Service — PromptBloom",
  description: "PromptBloom terms of service and usage agreement.",
};

export default function TermsPage() {
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
        <h1 className="text-5xl font-bold text-forge-white mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-forge-white/80">
          <p className="text-sm text-forge-white/60">Last updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-forge-white mt-8 mb-4">Acceptance of Terms</h2>
            <p>
              By using PromptBloom, you agree to these terms of service. If you do not agree, 
              please do not use our service.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-forge-white mt-8 mb-4">Service Usage</h2>
            <p>
              You may use PromptBloom for lawful purposes only. You are responsible for the content 
              you generate and must comply with all applicable laws and regulations.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-forge-white mt-8 mb-4">Intellectual Property</h2>
            <p>
              Generated tracks are owned by you, subject to the terms of the AI model providers. 
              You grant us a license to store and serve your content as part of our service.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-forge-white mt-8 mb-4">Limitation of Liability</h2>
            <p>
              PromptBloom is provided "as is" without warranties. We are not liable for any damages 
              arising from use of our service.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}


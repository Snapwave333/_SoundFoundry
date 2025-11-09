import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Contact — PromptBloom",
  description: "Get in touch with the PromptBloom team.",
};

export default function ContactPage() {
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

      <main className="container mx-auto px-4 py-24 max-w-2xl">
        <h1 className="text-5xl font-bold text-forge-white mb-8">Contact Us</h1>
        
        <div className="bg-forge-gray/30 border border-forge-gray/50 rounded-lg p-8">
          <p className="text-forge-white/70 mb-6">
            For support, questions, or feedback, please open an issue on GitHub or reach out through our channels.
          </p>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-forge-white mb-2">GitHub</h2>
              <a 
                href="https://github.com/Snapwave333/_SoundFoundry" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-forge-amber hover:underline"
              >
                github.com/Snapwave333/_SoundFoundry
              </a>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-forge-white mb-2">Support</h2>
              <p className="text-forge-white/70">
                For technical issues, please open an issue on GitHub with detailed information about your problem.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button asChild size="lg" className="bg-forge-amber text-forge-black hover:brightness-110 text-lg px-8 py-6">
            <Link href="/app">Open App</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}


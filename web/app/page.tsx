import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Music, Sparkles, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-forge-black via-forge-gray/20 to-forge-black">
      {/* Header */}
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

          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            <Link
              href="/pricing"
              className="text-forge-white/70 hover:text-forge-white transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="text-forge-white/70 hover:text-forge-white transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-forge-white/70 hover:text-forge-white transition-colors"
            >
              Contact
            </Link>
            <Button asChild className="bg-forge-amber text-forge-black hover:brightness-110">
              <Link href="/app">Open App</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-forge-white via-forge-amber to-forge-blue">
            Craft Your Sound
          </h1>
          <p className="text-xl md:text-2xl text-forge-white/80 mb-8 max-w-2xl mx-auto">
            Generate professional-quality music tracks from text prompts. Add lyrics, guide with references, and export when ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-forge-amber text-forge-black hover:brightness-110 text-lg px-8 py-6">
              <Link href="/app">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-forge-gray text-forge-white hover:bg-forge-gray/50 text-lg px-8 py-6">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-24">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg bg-forge-gray/30 border border-forge-gray/50">
              <Music className="h-12 w-12 text-forge-amber mb-4" />
              <h3 className="text-xl font-semibold text-forge-white mb-2">AI Music Generation</h3>
              <p className="text-forge-white/70">
                Create full tracks from natural language prompts. No musical experience required.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-forge-gray/30 border border-forge-gray/50">
              <Sparkles className="h-12 w-12 text-forge-blue mb-4" />
              <h3 className="text-xl font-semibold text-forge-white mb-2">Style System</h3>
              <p className="text-forge-white/70">
                Unique visual series with custom palettes and geometry for each user.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-forge-gray/30 border border-forge-gray/50">
              <Zap className="h-12 w-12 text-forge-amber mb-4" />
              <h3 className="text-xl font-semibold text-forge-white mb-2">Real-Time Progress</h3>
              <p className="text-forge-white/70">
                Track generation jobs with live updates from queued to complete.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-forge-gray/30 bg-forge-black/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-forge-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/pricing" className="text-forge-white/70 hover:text-forge-white">Pricing</Link></li>
                <li><Link href="/app" className="text-forge-white/70 hover:text-forge-white">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-forge-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-forge-white/70 hover:text-forge-white">About</Link></li>
                <li><Link href="/contact" className="text-forge-white/70 hover:text-forge-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-forge-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-forge-white/70 hover:text-forge-white">Privacy</Link></li>
                <li><Link href="/terms" className="text-forge-white/70 hover:text-forge-white">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-forge-white mb-4">Get Started</h4>
              <Button asChild className="bg-forge-amber text-forge-black hover:brightness-110 w-full">
                <Link href="/app">Open App</Link>
              </Button>
            </div>
          </div>
          <div className="text-center text-forge-white/50 text-sm">
            © {new Date().getFullYear()} PromptBloom. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

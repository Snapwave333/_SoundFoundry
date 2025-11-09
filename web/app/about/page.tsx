import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "About — PromptBloom",
  description: "Learn about PromptBloom, the AI music generation platform that transforms text into professional-quality tracks.",
};

export default function AboutPage() {
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
        <h1 className="text-5xl font-bold text-forge-white mb-8">About PromptBloom</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-forge-white/80">
          <p className="text-lg">
            PromptBloom is a production-ready AI music generation platform that transforms text descriptions 
            into professional-quality music tracks. Built with modern web technologies and designed for scalability, 
            we offer a fair free tier trial and transparent pricing for extended use.
          </p>
          
          <h2 className="text-3xl font-semibold text-forge-white mt-12 mb-4">Our Mission</h2>
          <p>
            To enable intuitive music creation with guided and generative tools, making professional music 
            generation accessible to everyone, regardless of musical experience.
          </p>
          
          <h2 className="text-3xl font-semibold text-forge-white mt-12 mb-4">Features</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Text-to-Music Generation from natural language prompts</li>
            <li>Optional AI-generated vocals with custom lyrics</li>
            <li>Reference audio upload for style guidance</li>
            <li>Multi-genre presets and adjustable parameters</li>
            <li>Real-time progress tracking</li>
            <li>Public gallery and shareable links</li>
            <li>Fair pricing with PPP-adjusted rates</li>
          </ul>
          
          <h2 className="text-3xl font-semibold text-forge-white mt-12 mb-4">Technology</h2>
          <p>
            Built with Next.js 16, React 19, FastAPI, and powered by leading AI music generation models 
            including FAL.ai and Replicate. Our infrastructure is designed for scale, reliability, and 
            performance.
          </p>
        </div>

        <div className="mt-12 text-center">
          <Button asChild size="lg" className="bg-forge-amber text-forge-black hover:brightness-110 text-lg px-8 py-6">
            <Link href="/app">Get Started</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}


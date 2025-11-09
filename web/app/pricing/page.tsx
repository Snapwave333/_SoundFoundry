import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const metadata = {
  title: "Pricing — PromptBloom",
  description: "Fair pricing with PPP-adjusted rates and generous free trial. Generate AI music tracks affordably.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-forge-black">
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
          <Button asChild className="bg-forge-amber text-forge-black hover:brightness-110">
            <Link href="/app">Open App</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-forge-white mb-4">Fair, Transparent Pricing</h1>
          <p className="text-xl text-forge-white/70 max-w-2xl mx-auto">
            More-than-fair free trial window with transparent metering. PPP-adjusted pricing ensures global accessibility.
          </p>
        </div>

        {/* Free Mode Notice */}
        <div className="bg-forge-gray/30 border border-forge-gray/50 rounded-lg p-6 mb-12 max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold text-forge-white mb-2">Free Mode</h2>
          <p className="text-forge-white/70 mb-4">
            Generous trial: <strong className="text-forge-amber">400 credits</strong> on signup. Daily limits and duration caps apply. 
            Free mode can be disabled at production scale for enterprise deployments.
          </p>
          <ul className="space-y-2 text-forge-white/70">
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-forge-amber" />
              <span>400 credits on signup</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-forge-amber" />
              <span>Configurable daily track limits</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-forge-amber" />
              <span>Max 60 seconds per track (free tier)</span>
            </li>
          </ul>
        </div>

        {/* Credit System */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-semibold text-forge-white mb-6">Credit System</h2>
          <div className="bg-forge-gray/30 border border-forge-gray/50 rounded-lg p-8 mb-8">
            <p className="text-forge-white/70 mb-4">
              <strong className="text-forge-white">1 Credit = 30 seconds</strong> of generated audio
            </p>
            <p className="text-forge-white/70 mb-6">
              Credit packs available: <strong className="text-forge-amber">300, 700, or 2000 credits</strong>
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-forge-white mb-2">PPP-Adjusted Pricing</h3>
                <p className="text-forge-white/70">
                  Automatic price adjustment based on purchasing power parity:
                </p>
                <ul className="mt-2 space-y-1 text-forge-white/70">
                  <li>• HIGH: Standard pricing</li>
                  <li>• UMID: 10% discount</li>
                  <li>• LMID: 20% discount</li>
                  <li>• LOW: 30% discount</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-forge-white mb-2">Solidarity Discount</h3>
                <p className="text-forge-white/70">
                  Optional <strong className="text-forge-amber">15% discount</strong> for users who opt into solidarity pricing.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-forge-white mb-2">Transparent Pricing</h3>
                <p className="text-forge-white/70">
                  All costs (model, infrastructure, overhead) are factored into pricing with capped margins. 
                  See <code className="bg-forge-black/50 px-2 py-1 rounded">server/app/services/pricing_service.py</code> for detailed logic.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button asChild size="lg" className="bg-forge-amber text-forge-black hover:brightness-110 text-lg px-8 py-6">
              <Link href="/app">Get Started</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}


import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-forge-black text-forge-white flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/brand/soundfoundry/soundfoundry_logomark_forge.svg"
            alt="SoundFoundry"
            width={96}
            height={96}
            className="w-24 h-24"
            priority
          />
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight">
          Craft Your Sound.
        </h1>

        {/* Description */}
        <p className="mt-4 opacity-80 text-center max-w-xl mx-auto text-lg">
          Generate full tracks from a prompt. Add lyrics, guide with a reference, and export when ready.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/create"
            className="px-6 py-3 rounded-lg font-semibold bg-forge-amber text-forge-black hover:brightness-110 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-amber"
            aria-label="Start creating music"
          >
            Start Creating
          </Link>
          <Link
            href="/library"
            className="px-6 py-3 rounded-lg border border-forge-gray text-forge-white hover:bg-forge-gray/50 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-blue"
            aria-label="Browse your library"
          >
            Browse Library
          </Link>
        </div>

        {/* Hero Gradient Block */}
        <div className="mt-12 w-full max-w-5xl mx-auto h-64 rounded-2xl overflow-hidden">
          <div
            className="w-full h-full"
            style={{
              background: "linear-gradient(90deg, #FFB24D, #3A77FF)",
              filter: "saturate(1.05)",
            }}
            aria-hidden="true"
          />
        </div>

        {/* Hero Preview Link */}
        <div className="mt-8">
          <Link
            href="/brand/soundfoundry/hero_waveform_forge.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-forge-blue hover:text-forge-amber transition-colors underline underline-offset-4"
            aria-label="View animated hero waveform preview"
          >
            Hero Preview
          </Link>
        </div>
      </div>
    </main>
  );
}


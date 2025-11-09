export default function LandingForge(){
  return (
    <main className="min-h-screen bg-[#0D0D0F] text-[#F3F5F7] flex flex-col items-center justify-center">
      <h1 className="text-5xl md:text-6xl font-semibold tracking-tight">Craft Your Sound.</h1>
      <p className="mt-4 opacity-80 text-center max-w-xl">Generate full tracks from a prompt. Add lyrics, guide with a reference, and export when ready.</p>
      <div className="mt-6 flex gap-3">
        <a href="#" className="px-6 py-3 rounded-lg font-semibold" style={{background:'#FFB24D',color:'#1A1A1A'}}>Start Creating</a>
        <a href="#" className="px-6 py-3 rounded-lg border border-[#3C3F45]">Browse Examples</a>
      </div>
      <div className="mt-10 w-[90vw] max-w-5xl h-64 rounded-2xl" style={{background:'linear-gradient(90deg,#FFB24D,#3A77FF)', filter:'saturate(1.05)'}}></div>
    </main>
  )
}

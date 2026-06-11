import Link from "next/link";
import { FileText, MapPin, Users, Zap, ArrowRight, ShieldCheck, Compass, HelpCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-950/30 blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="container mx-auto px-6 py-6 border-b border-slate-900 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Compass className="w-6 h-6 text-indigo-400" />
          <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            GEOPERMIT AI
          </span>
        </div>
        <div className="flex items-center gap-6 text-xs font-semibold text-slate-400">
          <Link href="/submit" className="hover:text-slate-200 transition-colors">Submit Form</Link>
          <Link href="/track" className="hover:text-slate-200 transition-colors">Track Application</Link>
          <Link href="/dashboard" className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 rounded-xl transition-all">
            Officer Portal
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 text-center max-w-4xl z-10 flex-1 flex flex-col justify-center">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
          Spatial Land Use & Exception{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Orchestrator
          </span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          GeoPermit AI evaluates permit applications against GIS zoning boundaries in real-time, automating 80% of routine cases and escalating anomalies to planning officers. Built on UiPath Maestro Case.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/submit"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl transition-all font-bold tracking-wide shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2"
          >
            Submit Permit Application <ArrowRight className="w-4.5 h-4.5" />
          </Link>
          <Link 
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-4 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-850 hover:border-slate-750 text-slate-200 rounded-xl transition-all font-bold tracking-wide backdrop-blur-md"
          >
            Access Officer Dashboard
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-16 z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="80% Auto-Approved"
            description="Routine permit reviews complete in under 10 seconds. Automated check pipeline."
          />
          <FeatureCard
            icon={<MapPin className="w-6 h-6" />}
            title="GIS Spatial Intelligence"
            description="Address geocoding and real-time zoning tags query via OpenStreetMap."
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Human-in-the-Loop"
            description="Officers review exceptions with detailed visual overlays and AI reasoning."
          />
          <FeatureCard
            icon={<FileText className="w-6 h-6" />}
            title="Immutable Process Audit"
            description="Complete audit trails logging every agent and officer action in Maestro Case."
          />
        </div>
      </section>

      {/* Stats Board */}
      <section className="bg-slate-900/40 border-y border-slate-900 py-16 z-10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <StatCard number="60-80%" label="Reduction in permit queue backlog" />
            <StatCard number="<10 sec" label="Average automated processing time" />
            <StatCard number="100%" label="SLA & compliance auditing maintained" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 text-center text-xs text-slate-500 z-10 border-t border-slate-950">
        <p>Built for the UiPath AgentHack 2026 | Track 1: UiPath Maestro Case</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-slate-900/40 backdrop-blur-xl border border-slate-900 hover:border-slate-800 rounded-2xl transition-all shadow-xl flex flex-col gap-4">
      <div className="text-indigo-400 bg-slate-950 p-3 rounded-xl border border-slate-850 w-fit">{icon}</div>
      <div>
        <h3 className="text-md font-bold text-slate-200 mb-1">{title}</h3>
        <p className="text-slate-400 text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
        {number}
      </div>
      <div className="text-slate-400 text-xs uppercase font-semibold tracking-wider mt-1">{label}</div>
    </div>
  );
}

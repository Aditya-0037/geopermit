import Link from "next/link";
import { FileText, MapPin, Users, Zap, ArrowRight, ShieldCheck, Compass, HelpCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-orange-50 text-stone-800 flex flex-col relative">
      {/* Navigation Header */}
      <header className="container mx-auto px-6 py-6 border-b border-orange-200 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Compass className="w-7 h-7 text-orange-600" strokeWidth={2.5} />
          <span className="font-black text-xl tracking-tight text-orange-600">
            GEOPERMIT
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm font-semibold text-stone-600">
          <Link href="/submit" className="hover:text-orange-600 transition-colors">Submit Form</Link>
          <Link href="/track" className="hover:text-orange-600 transition-colors">Track Application</Link>
          <Link href="/dashboard" className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-all shadow-sm">
            Officer Portal
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 text-center max-w-4xl z-10 flex-1 flex flex-col justify-center">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight text-stone-900">
          Spatial Land Use & Exception{" "}
          <span className="text-orange-600">
            Orchestrator
          </span>
        </h1>
        <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-12 leading-relaxed">
          GeoPermit AI evaluates permit applications against GIS zoning boundaries in real-time, automating 80% of routine cases and escalating anomalies to planning officers. Built on UiPath Maestro Case.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/submit"
            className="w-full sm:w-auto px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl transition-all font-bold tracking-wide shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            Submit Permit Application <ArrowRight className="w-5 h-5" />
          </Link>
          <Link 
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-orange-50 border-2 border-orange-300 text-orange-700 rounded-2xl transition-all font-bold tracking-wide"
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
            color="bg-amber-100 text-amber-700 border-amber-200"
          />
          <FeatureCard
            icon={<MapPin className="w-6 h-6" />}
            title="GIS Spatial Intelligence"
            description="Address geocoding and real-time zoning tags query via OpenStreetMap."
            color="bg-rose-100 text-rose-700 border-rose-200"
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Human-in-the-Loop"
            description="Officers review exceptions with detailed visual overlays and AI reasoning."
            color="bg-orange-100 text-orange-700 border-orange-200"
          />
          <FeatureCard
            icon={<FileText className="w-6 h-6" />}
            title="Immutable Process Audit"
            description="Complete audit trails logging every agent and officer action in Maestro Case."
            color="bg-yellow-100 text-yellow-800 border-yellow-200"
          />
        </div>
      </section>

      {/* Stats Board */}
      <section className="bg-white border-y border-orange-200 py-16 z-10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <StatCard number="60-80%" label="Reduction in permit queue backlog" />
            <StatCard number="<10 sec" label="Average automated processing time" />
            <StatCard number="100%" label="SLA & compliance auditing maintained" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 text-center text-xs text-stone-500 z-10 border-t border-orange-200">
        <p>Built for the UiPath AgentHack 2026 | Track 1: UiPath Maestro Case</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
  return (
    <div className="p-6 bg-white border-2 border-orange-200 hover:border-orange-400 rounded-2xl transition-all shadow-sm hover:shadow-md flex flex-col gap-4">
      <div className={`${color} p-3 rounded-xl border-2 w-fit`}>{icon}</div>
      <div>
        <h3 className="text-base font-bold text-stone-900 mb-2">{title}</h3>
        <p className="text-stone-600 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-5xl font-black tracking-tight text-orange-600">
        {number}
      </div>
      <div className="text-stone-600 text-xs uppercase font-bold tracking-wider mt-2">{label}</div>
    </div>
  );
}

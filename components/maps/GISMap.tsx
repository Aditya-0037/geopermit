"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const GISMapInner = dynamic(() => import("./GISMapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shadow-inner">
      <div className="text-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
        <p className="text-sm">Loading Interactive GIS Map...</p>
      </div>
    </div>
  ),
});

interface GISMapProps {
  lat: number;
  lng: number;
  detectedZone: string;
  zoneConflict: boolean;
  protectedArea: boolean;
}

export default function GISMap(props: GISMapProps) {
  return <GISMapInner {...props} />;
}

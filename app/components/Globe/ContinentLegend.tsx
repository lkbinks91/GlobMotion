import { useMemo } from 'react';

export function ContinentLegend() {
  const continents = useMemo(() => [
    { name: "Afrique", color: "#ffd93d" },
    { name: "Asie", color: "#ff6b6b" },
    { name: "Europe", color: "#00ff88" },
    { name: "Amérique du Nord", color: "#6bcfff" },
    { name: "Amérique du Sud", color: "#c084fc" },
    { name: "Océanie", color: "#ff9f43" }
  ], []);

  return (
    <div className="absolute bottom-20 left-6 z-10 
                    bg-slate-900/80 backdrop-blur-md rounded-lg p-3 
                    border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
      <h3 className="text-cyan-400 text-sm font-semibold mb-3 uppercase tracking-wider">
        Continents
      </h3>
      <div className="space-y-2.5">
        {continents.map((continent) => (
          <div key={continent.name} className="flex items-center gap-2.5">
            <div 
              className="w-3 h-3 rounded-full shadow-lg flex-shrink-0"
              style={{ 
                backgroundColor: continent.color,
                boxShadow: `0 0 8px ${continent.color}40`
              }}
            />
            <span className="text-sm text-slate-200">{continent.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

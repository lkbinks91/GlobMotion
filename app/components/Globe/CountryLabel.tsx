import { Country } from '@/data/countries';
import { motion, AnimatePresence } from 'framer-motion';

interface CountryLabelProps {
  country: Country | null;
}

export function CountryLabel({ country }: CountryLabelProps) {
  return (
    <AnimatePresence>
      {country && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="relative">
            {/* Glow background */}
            <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full" />
            
            {/* Main label container */}
            <div className="relative px-8 py-4 bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 
                            border border-cyan-400/50 rounded-lg backdrop-blur-sm
                            shadow-[0_0_30px_rgba(0,255,255,0.3)]">
              {/* Top accent line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] 
                              bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
              
              {/* Country code badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 
                              px-3 py-1 bg-cyan-500/20 border border-cyan-400/60 rounded-full">
                <span className="text-cyan-300 text-xs font-mono tracking-wider">
                  {country.code}
                </span>
              </div>
              
              {/* Country name */}
              <h2 className="text-2xl md:text-3xl font-bold text-center
                             bg-gradient-to-r from-cyan-300 via-white to-cyan-300 
                             bg-clip-text text-transparent
                             drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                {country.name}
              </h2>
              
              {/* Coordinates */}
              <p className="text-center text-cyan-400/60 text-sm font-mono mt-2">
                {country.lat.toFixed(2)}° / {country.lng.toFixed(2)}°
              </p>
              
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] 
                              bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            </div>
            
            {/* Side decorations */}
            <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-2 h-2 
                            bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
            <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-2 h-2 
                            bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

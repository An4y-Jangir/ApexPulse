import React, { useMemo } from 'react';
import type { Driver, TyreCompound } from '../types/f1';
import { TrackCanvas } from './TrackCanvas';
import { CloudRain, Activity } from 'lucide-react';

interface TrackViewProps {

  driversRef: React.MutableRefObject<Driver[]>;
  selectedDriverCode: string;
  setSelectedDriverCode: (code: string) => void;
  mode: 'live' | 'simulation';
  raceFlag: string;
  strategies: Record<string, { pace: 'ATTACK' | 'PUSH' | 'SAVE' | 'COOL'; tyre: 'DRY' | 'BAL' | 'SAVE' | 'COOL'; nextTyre: TyreCompound }>;
  updateStrategy: (code: string, pace: 'ATTACK' | 'PUSH' | 'SAVE' | 'COOL', tyre: 'DRY' | 'BAL' | 'SAVE' | 'COOL', nextTyre: TyreCompound) => void;
  rainProbability: number;
}

export const TrackView: React.FC<TrackViewProps> = ({
  driversRef,
  selectedDriverCode,
  setSelectedDriverCode,
  mode,
  raceFlag,
  strategies,
  updateStrategy,
  rainProbability
}) => {
  // Get active strategy for selected driver
  const activeStrategy = useMemo(() => {
    return strategies[selectedDriverCode] || { pace: 'PUSH', tyre: 'BAL', nextTyre: 'M' };
  }, [strategies, selectedDriverCode]);

  // Sector Rainfall Bars simulation (scales based on rain probability)
  const rainfallBars = useMemo(() => {
    const totalBars = 8;
    const calculateActiveBars = (sectorWeight: number) => {
      const weightProb = rainProbability * sectorWeight;
      return Math.round((weightProb / 100) * totalBars);
    };

    return {
      s1: calculateActiveBars(0.9),
      s2: calculateActiveBars(1.1),
      s3: calculateActiveBars(0.8)
    };
  }, [rainProbability]);

  const handlePaceChange = (pace: 'ATTACK' | 'PUSH' | 'SAVE' | 'COOL') => {
    updateStrategy(selectedDriverCode, pace, activeStrategy.tyre, activeStrategy.nextTyre);
  };

  const handleTyreChange = (tyre: 'DRY' | 'BAL' | 'SAVE' | 'COOL') => {
    updateStrategy(selectedDriverCode, activeStrategy.pace, tyre, activeStrategy.nextTyre);
  };

  const handleNextTyreChange = (nextTyre: TyreCompound) => {
    updateStrategy(selectedDriverCode, activeStrategy.pace, activeStrategy.tyre, nextTyre);
  };

  return (
    <div className="glass-panel w-full flex flex-col rounded border border-white/10 overflow-hidden h-full relative bg-[#06070B]/80 backdrop-blur-2xl">
      {/* Decorative top grid accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#06B6D4]/30 to-transparent animate-pulse" />

      {/* Header Info Panel */}
      <div className="bg-[#07090E]/90 border-b border-white/10 px-4 py-2.5 flex items-center justify-between text-[9px] font-mono font-bold tracking-widest text-white/50 select-none z-10">
        <span className="flex items-center gap-1.5 text-white/70">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
          UNITED KINGDOM - 5.891 KM • 18 TURNS
        </span>
        <div className="flex items-center gap-4 text-[9px]">
          <span className="text-white/60 font-mono tracking-widest uppercase">Silverstone Circuit</span>
        </div>
      </div>

      {/* HTML5 Interactive Telemetry Canvas Stage */}
      <div className="flex-1 relative bg-radial-gradient min-h-[300px]">
        <TrackCanvas
          driversRef={driversRef}
          selectedDriverCode={selectedDriverCode}
          setSelectedDriverCode={setSelectedDriverCode}
          mode={mode}
          raceFlag={raceFlag}
          strategies={strategies}
        />
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-[170px] left-4 flex flex-wrap items-center gap-4 text-[7.5px] font-mono font-bold tracking-wider text-white/40 bg-[#06070B]/80 px-2.5 py-1.5 rounded border border-white/5 select-none backdrop-blur-md">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white shrink-0" />
          PLAYER
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500 neon-glow-yellow shrink-0 animate-pulse" />
          BATTERY DEPLOY
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 neon-glow-green shrink-0 shrink-0" />
          BATTERY HARVEST
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neutral-600 shrink-0" />
          PIT LANE
        </span>
      </div>

      {/* Strategy Control Panel & Sector Rainfall moisture grid */}
      <div className="bg-[#07090E]/95 border-t border-white/10 p-4 grid grid-cols-12 gap-4 text-xs font-mono select-none relative z-10">
        
        {/* Left Column: Driver Control strategy adjustments (col-span 8) */}
        <div className="col-span-12 md:col-span-8 flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-white/5 pb-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-bold text-white/60 tracking-wider">DRIVER CONTROL:</span>
            <span className="text-[10px] font-black px-1.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-widest leading-none">
              CAR {selectedDriverCode}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            {/* Pace controls */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[8px] text-white/40 uppercase tracking-wider font-extrabold">Pace Mode</span>
              <div className="flex items-center gap-1 bg-[#040508]/80 p-0.5 rounded border border-white/5">
                {(['ATTACK', 'PUSH', 'SAVE', 'COOL'] as const).map((p) => {
                  const isActive = activeStrategy.pace === p;
                  let colorClass = 'text-white/40 hover:text-white/70';
                  if (isActive) {
                    if (p === 'ATTACK') colorClass = 'bg-orange-500/15 border border-orange-500/30 text-orange-400 neon-glow-yellow';
                    else if (p === 'PUSH') colorClass = 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 neon-glow-cyan';
                    else if (p === 'SAVE') colorClass = 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 neon-glow-yellow';
                    else colorClass = 'bg-blue-500/15 border border-blue-500/30 text-blue-400';
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => handlePaceChange(p)}
                      className={`px-2 py-1 rounded-sm text-[8px] font-bold transition-all cursor-pointer ${colorClass}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tyre management */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[8px] text-white/40 uppercase tracking-wider font-extrabold">Tyre Management</span>
              <div className="flex items-center gap-1 bg-[#040508]/80 p-0.5 rounded border border-white/5">
                {(['DRY', 'BAL', 'SAVE', 'COOL'] as const).map((t) => {
                  const isActive = activeStrategy.tyre === t;
                  let colorClass = 'text-white/40 hover:text-white/70';
                  if (isActive) {
                    if (t === 'DRY') colorClass = 'bg-white/10 border border-white/20 text-white';
                    else if (t === 'BAL') colorClass = 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 neon-glow-green';
                    else if (t === 'SAVE') colorClass = 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 neon-glow-yellow';
                    else colorClass = 'bg-blue-500/15 border border-blue-500/30 text-blue-400';
                  }
                  return (
                    <button
                      key={t}
                      onClick={() => handleTyreChange(t)}
                      className={`px-2 py-1 rounded-sm text-[8px] font-bold transition-all cursor-pointer ${colorClass}`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next Tyre compound select */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[8px] text-white/40 uppercase tracking-wider font-extrabold">Next Tyre Target</span>
              <div className="flex items-center gap-1 bg-[#040508]/80 p-0.5 rounded border border-white/5">
                {(['S', 'M', 'H', 'I', 'W'] as const).map((compound) => {
                  const isActive = activeStrategy.nextTyre === compound;
                  let colorClass = 'text-white/40 hover:text-white/70';
                  if (isActive) {
                    if (compound === 'S') colorClass = 'bg-red-500/20 text-red-500 border border-red-500/30 font-black';
                    else if (compound === 'M') colorClass = 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 font-black';
                    else if (compound === 'H') colorClass = 'bg-white/10 text-white border border-white/20 font-black';
                    else if (compound === 'I') colorClass = 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-black';
                    else colorClass = 'bg-blue-600/20 text-blue-500 border border-blue-500/30 font-black';
                  }
                  return (
                    <button
                      key={compound}
                      onClick={() => handleNextTyreChange(compound)}
                      className={`w-6 h-6 rounded-sm flex items-center justify-center text-[9px] font-bold transition-all cursor-pointer ${colorClass}`}
                    >
                      {compound}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Weather / Sector Rainfall moisture grid (col-span 4) */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-2.5 border-l border-white/10 pl-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-1">
            <CloudRain className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-bold text-white/60 tracking-wider">SECTOR RAINFALL:</span>
          </div>

          <div className="flex flex-col gap-1.5 font-mono text-[8px] text-white/50">
            {/* Sector 1 */}
            <div className="flex items-center gap-3">
              <span className="w-4 font-bold shrink-0">S1</span>
              <div className="flex gap-0.5 flex-1 h-3 bg-white/5 p-0.5 rounded-sm border border-white/5">
                {Array.from({ length: 8 }).map((_, idx) => {
                  const isActive = idx < rainfallBars.s1;
                  return (
                    <div 
                      key={idx} 
                      className={`flex-1 rounded-xs transition-colors duration-150 ${
                        isActive ? 'bg-cyan-500' : 'bg-white/5'
                      }`}
                    />
                  );
                })}
              </div>
              <span className="w-5 text-right font-bold text-white/80">{rainfallBars.s1 * 12.5}%</span>
            </div>

            {/* Sector 2 */}
            <div className="flex items-center gap-3">
              <span className="w-4 font-bold shrink-0">S2</span>
              <div className="flex gap-0.5 flex-1 h-3 bg-white/5 p-0.5 rounded-sm border border-white/5">
                {Array.from({ length: 8 }).map((_, idx) => {
                  const isActive = idx < rainfallBars.s2;
                  return (
                    <div 
                      key={idx} 
                      className={`flex-1 rounded-xs transition-colors duration-150 ${
                        isActive ? 'bg-cyan-500' : 'bg-white/5'
                      }`}
                    />
                  );
                })}
              </div>
              <span className="w-5 text-right font-bold text-white/80">{rainfallBars.s2 * 12.5}%</span>
            </div>

            {/* Sector 3 */}
            <div className="flex items-center gap-3">
              <span className="w-4 font-bold shrink-0">S3</span>
              <div className="flex gap-0.5 flex-1 h-3 bg-white/5 p-0.5 rounded-sm border border-white/5">
                {Array.from({ length: 8 }).map((_, idx) => {
                  const isActive = idx < rainfallBars.s3;
                  return (
                    <div 
                      key={idx} 
                      className={`flex-1 rounded-xs transition-colors duration-150 ${
                        isActive ? 'bg-cyan-500' : 'bg-white/5'
                      }`}
                    />
                  );
                })}
              </div>
              <span className="w-5 text-right font-bold text-white/80">{rainfallBars.s3 * 12.5}%</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

import React from 'react';
import type { Driver, TyreCompound, SectorState } from '../types/f1';

interface TimingTowerProps {
  drivers: Driver[];
  selectedDriverCode: string;
  setSelectedDriverCode: (code: string) => void;
}

export const TimingTower: React.FC<TimingTowerProps> = ({
  drivers,
  selectedDriverCode,
  setSelectedDriverCode
}) => {

  const getTyreStyle = (compound: TyreCompound) => {
    switch (compound) {
      case 'S':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500',
          text: 'text-red-500',
          label: 'S'
        };
      case 'M':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500',
          text: 'text-yellow-500',
          label: 'M'
        };
      case 'H':
        return {
          bg: 'bg-white/10',
          border: 'border-white/40',
          text: 'text-white/80',
          label: 'H'
        };
      case 'I':
        return {
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-400',
          text: 'text-cyan-400',
          label: 'I'
        };
      case 'W':
        return {
          bg: 'bg-blue-600/10',
          border: 'border-blue-500',
          text: 'text-blue-500',
          label: 'W'
        };
      default:
        return {
          bg: 'bg-white/5',
          border: 'border-white/10',
          text: 'text-white/50',
          label: '?'
        };
    }
  };

  const getSectorBg = (state: SectorState) => {
    switch (state) {
      case 'purple':
        return 'bg-fuchsia-500 neon-glow-purple';
      case 'green':
        return 'bg-emerald-500 neon-glow-green';
      case 'yellow':
        return 'bg-yellow-500 neon-glow-yellow';
      default:
        return 'bg-white/10';
    }
  };

  return (
    <div className="glass-panel w-full h-full flex flex-col rounded border border-white/5 overflow-hidden">
      {/* Header bar */}
      <div className="bg-[#07090E]/80 border-b border-white/5 px-4 py-3 flex items-center justify-between text-xs font-mono font-bold tracking-widest text-white/50">
        <span>POS LEADERBOARD</span>
        <span className="text-[10px] bg-red-500/15 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20 animate-pulse">LIVE FEED</span>
      </div>

      {/* Grid Header */}
      <div className="px-3 py-2 grid grid-cols-12 gap-1 text-[9px] font-mono text-white/30 border-b border-white/5 tracking-wider bg-white/1 select-none">
        <span className="col-span-2 text-center">POS</span>
        <span className="col-span-3">DRIVER</span>
        <span className="col-span-3 text-right">GAP (INT)</span>
        <span className="col-span-2 text-center">TYRE</span>
        <span className="col-span-2 text-center">SECTORS</span>
      </div>

      {/* Driver List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 select-none">
        {drivers.map((d) => {
          const isSelected = d.code === selectedDriverCode;
          const tyre = getTyreStyle(d.tyreCompound);
          
          return (
            <div
              key={d.code}
              onClick={() => setSelectedDriverCode(d.code)}
              className={`grid grid-cols-12 gap-1 items-center px-3 py-2 cursor-pointer transition-all duration-150 ${
                isSelected 
                  ? 'bg-white/5 border-l-2' 
                  : 'hover:bg-white/2 border-l-2 border-l-transparent'
              }`}
              style={{ borderLeftColor: isSelected ? d.teamColor : 'transparent' }}
            >
              {/* Position */}
              <div className="col-span-2 flex items-center justify-center gap-1">
                <span className={`text-xs font-mono font-bold ${isSelected ? 'text-white' : 'text-white/60'}`}>
                  {d.position}
                </span>
              </div>

              {/* Driver info */}
              <div className="col-span-3 flex items-center gap-1.5 overflow-hidden">
                {/* Team color bar */}
                <div 
                  className="w-1 h-7.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: d.teamColor }}
                />
                <div className="flex flex-col truncate">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold font-mono text-white leading-none">
                      {d.code}
                    </span>
                    <span className="text-[9px] font-mono text-white/30">
                      {d.number}
                    </span>
                  </div>
                  <span className="text-[9px] text-white/40 truncate font-mono uppercase leading-tight">
                    {d.team}
                  </span>
                </div>
              </div>

              {/* Gaps */}
              <div className="col-span-3 flex flex-col text-right font-mono justify-center">
                <span className={`text-[11px] font-bold ${
                  d.gap === 'LDR' ? 'text-red-500' : isSelected ? 'text-white' : 'text-white/80'
                }`}>
                  {d.gap}
                </span>
                <span className="text-[9px] text-white/30">
                  {d.gap === 'LDR' ? '' : d.interval}
                </span>
              </div>

              {/* Tyre compound & life */}
              <div className="col-span-2 flex items-center gap-1.5 justify-center font-mono">
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full border ${tyre.border} ${tyre.bg} flex items-center justify-center text-[8px] font-black ${tyre.text} leading-none`}>
                    {tyre.label}
                  </div>
                  <span className="text-[7px] text-white/30 mt-0.5 leading-none">
                    {d.tyreLaps}L
                  </span>
                </div>
                <div className="flex flex-col items-start justify-center">
                  <span className="text-[9px] font-bold text-white/80 leading-none">
                    {Math.round(100 - d.tyreThermal.wear.fl)}%
                  </span>
                  <span className="text-[6px] text-white/30 font-bold uppercase mt-0.5">LIFE</span>
                </div>
              </div>

              {/* 3-Sector performance pills */}
              <div className="col-span-2 flex items-center justify-center gap-0.5">
                <div 
                  className={`w-1.5 h-4.5 rounded-[1px] ${getSectorBg(d.lapTiming.sector1State)}`}
                  title={`Sector 1: ${d.lapTiming.sector1}s`}
                />
                <div 
                  className={`w-1.5 h-4.5 rounded-[1px] ${getSectorBg(d.lapTiming.sector2State)}`}
                  title={`Sector 2: ${d.lapTiming.sector2}s`}
                />
                <div 
                  className={`w-1.5 h-4.5 rounded-[1px] ${getSectorBg(d.lapTiming.sector3State)}`}
                  title={`Sector 3: ${d.lapTiming.sector3}s`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

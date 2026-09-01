import React from 'react';
import type { Driver, TyreCompound } from '../types/f1';

interface CockpitTelemetryProps {
  driver: Driver;
  comparisonDriver?: Driver;
}

export const CockpitTelemetry: React.FC<CockpitTelemetryProps> = ({ 
  driver, 
  comparisonDriver 
}) => {
  
  const getTyreThermalStyle = (temp: number) => {
    if (temp < 85) {
      return {
        label: 'COLD',
        colorClass: 'text-cyan-400 border-cyan-500/20 bg-cyan-950/10 shadow-cyan-950/20',
        barColor: 'bg-cyan-500',
        bgGlow: 'rgba(6, 182, 212, 0.05)'
      };
    } else if (temp <= 105) {
      return {
        label: 'OPTIMAL',
        colorClass: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/10 shadow-emerald-950/20',
        barColor: 'bg-emerald-500',
        bgGlow: 'rgba(34, 197, 94, 0.05)'
      };
    } else if (temp <= 115) {
      return {
        label: 'WARM',
        colorClass: 'text-amber-400 border-amber-500/20 bg-amber-950/10 shadow-amber-950/20',
        barColor: 'bg-amber-500',
        bgGlow: 'rgba(245, 158, 11, 0.05)'
      };
    } else {
      return {
        label: 'OVERHEAT',
        colorClass: 'text-red-400 border-red-500/20 bg-red-950/10 shadow-red-950/20',
        barColor: 'bg-red-500',
        bgGlow: 'rgba(239, 68, 68, 0.05)'
      };
    }
  };

  const getTyreCompoundLabel = (c: TyreCompound) => {
    switch (c) {
      case 'S': return { text: 'SOFT', color: 'text-red-500 border-red-500/20 bg-red-500/5' };
      case 'M': return { text: 'MEDIUM', color: 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5' };
      case 'H': return { text: 'HARD', color: 'text-white border-white/20 bg-white/5' };
      case 'I': return { text: 'INTER', color: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5' };
      case 'W': return { text: 'WET', color: 'text-blue-500 border-blue-500/20 bg-blue-500/5' };
    }
  };

  const renderHUDCard = (d: Driver, type: 'PRIMARY' | 'COMPARISON') => {
    const { telemetry, tyreThermal, lapTiming } = d;
    const compoundInfo = getTyreCompoundLabel(d.tyreCompound);

    const rpmPercent = Math.max(0, Math.min(100, ((telemetry.rpm - 4000) / (12500 - 4000)) * 100));
    const activeRpmLeds = Math.floor((rpmPercent / 100) * 12);
    const rpmFlash = telemetry.rpm > 11800;

    const flStyle = getTyreThermalStyle(tyreThermal.temperatures.fl);
    const frStyle = getTyreThermalStyle(tyreThermal.temperatures.fr);
    const rlStyle = getTyreThermalStyle(tyreThermal.temperatures.rl);
    const rrStyle = getTyreThermalStyle(tyreThermal.temperatures.rr);

    // ERS battery mode detection based on throttle/brake/ersPercent
    let ersStatusText = 'NORMAL';
    let ersColor = 'text-cyan-400';
    
    if (telemetry.throttle > 85 && telemetry.ersPercent > 0) {
      ersStatusText = 'DEPLOYING';
      ersColor = 'text-orange-500';
    } else if (telemetry.brake > 30 || telemetry.throttle < 15) {
      ersStatusText = 'HARVESTING';
      ersColor = 'text-emerald-400';
    }

    return (
      <div 
        key={d.code}
        className="glass-panel w-full p-3 rounded border border-white/10 flex flex-col gap-3 relative bg-[#06070B]/70 select-none overflow-hidden"
      >
        {/* Panel glowing left borders */}
        <div className="absolute top-0 bottom-0 left-0 w-[2px]" style={{ backgroundColor: d.teamColor }} />

        {/* HUD Card Header */}
        <div className="flex items-center justify-between font-mono text-[9px] font-bold border-b border-white/5 pb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-white/40 uppercase tracking-widest">{type} HUD</span>
            <span className="text-[10px]" style={{ color: d.teamColor }}>
              P{d.position}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">{d.name}</span>
            <span className="text-white/30">#{d.number}</span>
          </div>
        </div>

        {/* Telemetry Panel */}
        <div className="grid grid-cols-12 gap-2 items-center">
          
          {/* Gear readout */}
          <div className="col-span-4 bg-white/[0.01] border border-white/5 rounded p-2 flex flex-col items-center justify-center relative h-16">
            <span className="absolute top-0.5 left-1.5 text-[6.5px] font-mono text-white/30 tracking-wider">GEAR</span>
            <span className="text-3xl font-black font-mono text-white">
              {d.isPitStop ? 'P' : telemetry.gear === 0 ? 'N' : telemetry.gear}
            </span>
          </div>

          {/* Speed & RPM readout */}
          <div className="col-span-8 bg-white/[0.01] border border-white/5 rounded p-1.5 flex flex-col justify-between h-16 relative">
            <div className="flex items-center justify-between px-1">
              <span className="text-[6.5px] font-mono text-white/30 tracking-wider">SPEED</span>
              <span className="text-[6.5px] font-mono text-white/30 tracking-wider">RPM</span>
            </div>
            <div className="flex items-baseline justify-between px-1">
              <div>
                <span className="text-2xl font-black font-mono text-white tracking-tight">{telemetry.speed}</span>
                <span className="text-[8px] text-white/40 ml-0.5">KM/H</span>
              </div>
              <div>
                <span className="text-xs font-bold font-mono text-white/70">{telemetry.rpm}</span>
              </div>
            </div>
            {/* Shift LED strip */}
            <div className={`grid grid-cols-12 gap-0.5 px-1 mt-0.5 ${rpmFlash ? 'animate-pulse' : ''}`}>
              {Array.from({ length: 12 }).map((_, idx) => {
                const active = idx < activeRpmLeds;
                let bg = 'bg-white/10';
                if (active) {
                  if (idx < 4) bg = 'bg-emerald-500 neon-glow-green';
                  else if (idx < 8) bg = 'bg-yellow-500 neon-glow-yellow';
                  else bg = 'bg-red-500 neon-glow-red';
                }
                return <div key={idx} className={`h-1.5 rounded-xs ${bg}`} />;
              })}
            </div>
          </div>
        </div>

        {/* ERS Battery Meter, Throttle/Brake progress */}
        <div className="grid grid-cols-12 gap-3 font-mono text-[8px] items-center">
          
          {/* ERS */}
          <div className="col-span-6 bg-white/[0.01] border border-white/5 p-1.5 rounded flex items-center justify-between gap-1">
            <div className="flex flex-col">
              <span className="text-[6.5px] text-white/30">BATTERY</span>
              <span className={`font-black text-[9px] mt-0.5 ${ersColor} flex items-center gap-1`}>
                <span className="w-1.5 h-2 border border-current rounded-xs relative flex items-end p-0.25">
                  <span className="w-full bg-current" style={{ height: `${telemetry.ersPercent}%` }} />
                </span>
                {telemetry.ersPercent}%
              </span>
            </div>
            <span className={`text-[7px] font-black shrink-0 self-end mb-0.5 ${ersColor} animate-pulse`}>
              {ersStatusText}
            </span>
          </div>

          {/* Throttle & Brake */}
          <div className="col-span-6 flex flex-col gap-1.5 bg-white/[0.01] border border-white/5 p-1.5 rounded">
            <div className="flex items-center justify-between">
              <span className="text-[6.5px] text-white/30">THR / BRK</span>
              <span className="text-[7.5px] font-bold text-white/70">
                <span className="text-emerald-400">{telemetry.throttle}</span>/
                <span className="text-red-500">{telemetry.brake}</span>
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="h-1 bg-white/5 rounded-full overflow-hidden w-full">
                <div className="h-full bg-emerald-500" style={{ width: `${telemetry.throttle}%` }} />
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden w-full">
                <div className="h-full bg-red-500" style={{ width: `${telemetry.brake}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* 4-corner Tyre Surface Thermal Matrix with SVG silhouette overlay */}
        <div className="flex flex-col gap-1 bg-[#040508]/40 border border-white/5 p-2 rounded">
          <div className="flex items-center justify-between text-[7px] font-mono text-white/40 tracking-wider">
            <span>TYRE SURFACE HEATMAP</span>
            <span className={`border px-1 rounded-sm text-[7px] tracking-wide ${compoundInfo?.color}`}>
              {compoundInfo?.text} (L{d.tyreLaps})
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 mt-1">
            {/* Left Tyres */}
            <div className="flex flex-col gap-2 flex-1">
              {/* FL */}
              <div className={`border rounded p-1.5 text-center flex flex-col justify-between h-10 ${flStyle.colorClass}`} style={{ boxShadow: `inset 0 0 5px ${flStyle.bgGlow}` }}>
                <span className="text-[5.5px] text-white/20 tracking-wider font-mono">FL</span>
                <span className="text-xs font-black font-mono text-white">{tyreThermal.temperatures.fl}°C</span>
              </div>
              {/* RL */}
              <div className={`border rounded p-1.5 text-center flex flex-col justify-between h-10 ${rlStyle.colorClass}`} style={{ boxShadow: `inset 0 0 5px ${rlStyle.bgGlow}` }}>
                <span className="text-[5.5px] text-white/20 tracking-wider font-mono">RL</span>
                <span className="text-xs font-black font-mono text-white">{tyreThermal.temperatures.rl}°C</span>
              </div>
            </div>

            {/* Central SVG F1 Silhouette Overlay */}
            <div className="shrink-0 flex items-center justify-center p-1.5">
              <svg viewBox="0 0 40 80" className="w-9 h-18 text-cyan-400 fill-current opacity-25">
                {/* Nose Cone */}
                <path d="M17,12 L23,12 L22,25 L18,25 Z" />
                {/* Front Wing */}
                <rect x="2" y="16" width="36" height="3" rx="0.5" />
                {/* Side Pods */}
                <path d="M12,32 L28,32 L26,52 L14,52 Z" />
                {/* Rear Wing */}
                <rect x="5" y="62" width="30" height="4" rx="0.5" />
                {/* Tyre Boxes */}
                <rect x="1" y="20" width="5" height="10" rx="1" className="fill-current opacity-70" />
                <rect x="34" y="20" width="5" height="10" rx="1" className="fill-current opacity-70" />
                <rect x="0" y="52" width="6" height="12" rx="1" className="fill-current opacity-70" />
                <rect x="34" y="52" width="6" height="12" rx="1" className="fill-current opacity-70" />
              </svg>
            </div>

            {/* Right Tyres */}
            <div className="flex flex-col gap-2 flex-1">
              {/* FR */}
              <div className={`border rounded p-1.5 text-center flex flex-col justify-between h-10 ${frStyle.colorClass}`} style={{ boxShadow: `inset 0 0 5px ${frStyle.bgGlow}` }}>
                <span className="text-[5.5px] text-white/20 tracking-wider font-mono">FR</span>
                <span className="text-xs font-black font-mono text-white">{tyreThermal.temperatures.fr}°C</span>
              </div>
              {/* RR */}
              <div className={`border rounded p-1.5 text-center flex flex-col justify-between h-10 ${rrStyle.colorClass}`} style={{ boxShadow: `inset 0 0 5px ${rrStyle.bgGlow}` }}>
                <span className="text-[5.5px] text-white/20 tracking-wider font-mono">RR</span>
                <span className="text-xs font-black font-mono text-white">{tyreThermal.temperatures.rr}°C</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timing footer */}
        <div className="bg-[#040508]/60 border border-white/5 rounded px-2 py-1 text-[7.5px] font-mono flex justify-between items-center text-white/35">
          <span>BEST: <span className="font-bold text-emerald-400">{lapTiming.bestLapTime}</span></span>
          <span className="text-white/10">|</span>
          <span>LAST: <span className="font-bold text-white/75">{lapTiming.lastLapTime}</span></span>
        </div>

      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 overflow-y-auto pr-1">
      {/* 1. Primary Selected Driver Card */}
      {renderHUDCard(driver, 'PRIMARY')}

      {/* 2. Secondary Comparison Driver Card */}
      {comparisonDriver ? (
        renderHUDCard(comparisonDriver, 'COMPARISON')
      ) : (
        <div className="glass-panel w-full p-4 rounded border border-white/5 flex flex-col items-center justify-center text-center font-mono h-40">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping mb-2" />
          <span className="text-white/40 text-[9px] tracking-wider">WAITING FOR COMPARISON DATA...</span>
        </div>
      )}
    </div>
  );
};

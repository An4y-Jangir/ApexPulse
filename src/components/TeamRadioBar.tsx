import React, { useEffect, useRef, useState } from 'react';
import type { TeamRadioMessage } from '../types/f1';
import { Volume2, VolumeX, Mic, Radio } from 'lucide-react';

interface TeamRadioBarProps {
  radioMessages: TeamRadioMessage[];
  audioEnabled: boolean;
}

export const TeamRadioBar: React.FC<TeamRadioBarProps> = ({
  radioMessages,
  audioEnabled
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeMessage, setActiveMessage] = useState<TeamRadioMessage | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Track the latest message and trigger equalizer animation
  useEffect(() => {
    if (radioMessages.length > 0) {
      const latest = radioMessages[0];
      setActiveMessage(latest);
      setIsActive(true);

      // Turn off active animation after 4.5 seconds
      const timer = setTimeout(() => {
        setIsActive(false);
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [radioMessages]);

  // Audio Equalizer Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const barCount = 20;
    const barWidth = 3;
    const barGap = 2;
    const heights = Array(barCount).fill(2);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const color = activeMessage ? activeMessage.teamColor : '#06B6D4';

      ctx.fillStyle = color;

      for (let i = 0; i < barCount; i++) {
        // Equalizer height calculations: high random values if active, small noise if static
        const target = isActive 
          ? Math.random() * (canvas.height - 4) + 2
          : Math.random() * 3 + 1.5;
        
        // Smooth transition
        heights[i] += (target - heights[i]) * 0.3;

        const x = i * (barWidth + barGap);
        const y = canvas.height / 2 - heights[i] / 2;

        // Draw rounded visual bars
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, heights[i], 1.5);
        ctx.fill();
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [activeMessage, isActive]);

  return (
    <div className="glass-panel w-full p-4 rounded border border-white/5 relative overflow-hidden flex flex-col justify-between h-full bg-[#07090E]/60 select-none">
      {/* Neo cyber line accents */}
      <div className="absolute top-0 bottom-0 left-0 w-[2px]" style={{ backgroundColor: activeMessage ? activeMessage.teamColor : '#22c55e' }} />
      <div className="absolute top-0 right-0 w-[4px] h-[4px] bg-red-500 rounded-full animate-ping m-2" />

      {/* Top Header Row */}
      <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-widest text-white/50 mb-2">
        <span className="flex items-center gap-1.5 uppercase">
          <Radio className="w-3.5 h-3.5" />
          TEAM RADIO LINK: {isActive ? 'TRANSMITTING' : 'MONITORING'}
        </span>
        <div className="flex items-center gap-2">
          {audioEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-white/30" />
          )}
          <span className="text-[9px] bg-white/5 border border-white/10 px-1 rounded-sm text-white/40">120.35 MHz</span>
        </div>
      </div>

      {/* Main Body with Waveform & Audio Transcription */}
      <div className="flex-1 flex items-center justify-between gap-4 py-2">
        {/* Driver Livery Tag & Transcript */}
        <div className="flex-1 min-w-0">
          {activeMessage ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: activeMessage.teamColor }} />
                <span className="font-bold font-mono text-white text-xs uppercase tracking-wider">{activeMessage.driverCode}</span>
                <span className="text-[9px] text-white/40 font-mono">[{activeMessage.type === 'inbound' ? 'DRV' : 'WALL'} @ {activeMessage.timestamp}]</span>
              </div>
              <p className="text-sm font-mono font-bold text-white tracking-wide truncate pr-2 italic">
                "{activeMessage.message}"
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white/10 shrink-0" />
                <span className="font-bold font-mono text-white/30 text-xs">MONITORING</span>
              </div>
              <p className="text-xs font-mono text-white/30 tracking-wider">
                STATIC NOISE // WAITING FOR AUDIO CHUTES...
              </p>
            </div>
          )}
        </div>

        {/* Canvas Equalizer Waveform */}
        <div className="shrink-0 flex items-center gap-2 px-2 py-1 rounded bg-[#040508]/60 border border-white/5">
          <Mic className={`w-3.5 h-3.5 ${isActive ? 'text-red-500 animate-pulse' : 'text-white/20'}`} />
          <canvas
            ref={canvasRef}
            width={95}
            height={20}
            className="block"
          />
        </div>
      </div>

      {/* Mini Scrolling Info Footer */}
      <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[9px] font-mono text-white/30">
        <span>RADIO LOG SIZE: {radioMessages.length} BUFFERS</span>
        <span className="animate-telemetry-pulse">SECURE ENCRYPTED COMMS FEED</span>
      </div>
    </div>
  );
};

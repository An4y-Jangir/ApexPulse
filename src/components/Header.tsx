import React from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Thermometer, 
  Droplets, 
  CloudRain, 
  ShieldAlert
} from 'lucide-react';
import type { Weather, RaceControlFlag } from '../types/f1';

interface HeaderProps {
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  raceFlag: RaceControlFlag;
  setRaceFlag: (flag: RaceControlFlag) => void;
  currentLap: number;
  weather: Weather;
  audioEnabled: boolean;
  setAudioEnabled: (val: boolean) => void;
  triggerVSC: () => void;
  triggerSafetyCar: () => void;
  simSpeed: number;
  setSimSpeed: (speed: 1 | 2 | 5) => void;
  playPitBeep: (freq?: number, duration?: number) => void;
  mode: 'live' | 'simulation';
  setMode: (mode: 'live' | 'simulation') => void;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting' | 'offline';
}

export const Header: React.FC<HeaderProps> = ({
  isPlaying,
  setIsPlaying,
  raceFlag,
  setRaceFlag,
  currentLap,
  weather,
  audioEnabled,
  setAudioEnabled,
  triggerVSC,
  triggerSafetyCar,
  simSpeed,
  setSimSpeed,
  playPitBeep,
  mode,
  setMode,
  connectionStatus
}) => {


  const handleAudioToggle = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    if (nextState) {
      // Small feedback chime
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.1);
        }
      } catch (e) {}
    }
  };

  return (
    <header className="glass-panel w-full px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5 relative overflow-hidden z-10">
      {/* Decorative cyber grid line at bottom of header */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Title and GP Name */}
      {/* Title, GP Name, and Mode Switcher */}
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded border border-red-500/30 bg-red-950/20 text-red-500 font-extrabold text-lg select-none">
            F1
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-wider text-white font-mono uppercase leading-none">Pit Wall Telemetry</h1>
              <span className="text-[8px] bg-white/5 border border-white/10 text-white/50 px-1 rounded font-mono">v4.5-LIVE</span>
            </div>
            <p className="text-[10px] text-white/40 font-mono mt-0.5">SILVERSTONE CIRCUIT • BRITISH GP</p>
          </div>
        </div>

        {/* Interactive Mode Switcher Toggle */}
        <div className="flex items-center gap-1 bg-[#040508]/80 p-0.5 rounded-full border border-white/10 shrink-0 font-mono text-[9px] font-bold select-none">
          <button
            onClick={() => setMode('live')}
            className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'live'
                ? 'bg-cyan-500 text-[#07090E] neon-glow-cyan'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${mode === 'live' ? 'bg-[#07090E] animate-pulse' : 'bg-white/20'}`} />
            ● LIVE BROADCAST
          </button>
          <button
            onClick={() => setMode('simulation')}
            className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'simulation'
                ? 'bg-purple-600 text-white neon-glow-purple'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${mode === 'simulation' ? 'bg-purple-300 animate-pulse' : 'bg-white/20'}`} />
            ↺ REPLAY SIMULATOR
          </button>
        </div>

        {/* Connection status badge (Live mode only) */}
        {mode === 'live' && (
          <div className="shrink-0 font-mono text-[8px] font-bold tracking-widest select-none">
            {connectionStatus === 'connected' && (
              <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-1 rounded animate-pulse">
                STREAMING
              </span>
            )}
            {connectionStatus === 'reconnecting' && (
              <span className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-2 py-1 rounded animate-pulse">
                BUFFERING
              </span>
            )}
            {connectionStatus === 'disconnected' && (
              <span className="bg-red-500/10 border border-red-500/30 text-red-400 px-2 py-1 rounded animate-bounce">
                DISCONNECTED
              </span>
            )}
          </div>
        )}
      </div>

      {/* Flag, Laps, Weather */}
      <div className="flex flex-wrap items-center gap-4 md:gap-6">
        {/* Session Flag Display */}
        <div className="flex items-stretch rounded overflow-hidden border border-white/10 bg-[#06070B] select-none h-9">
          <div className={`px-3 flex items-center justify-center font-black font-mono text-xs tracking-wider text-[#06070B] uppercase shrink-0 transition-colors ${
            raceFlag === 'GREEN' ? 'bg-emerald-500 neon-glow-green' :
            raceFlag === 'YELLOW' ? 'bg-yellow-500 neon-glow-yellow' :
            raceFlag === 'VSC' ? 'bg-orange-500 animate-pulse' :
            raceFlag === 'SAFETY_CAR' ? 'bg-amber-500 animate-pulse' :
            'bg-red-500 neon-glow-red animate-pulse'
          }`}>
            {raceFlag === 'SAFETY_CAR' ? 'S CAR' : raceFlag}
          </div>
          {/* Race Control Message Marquee */}
          <div className="border-l border-white/10 px-3 py-1 flex flex-col justify-center min-w-[200px] max-w-[280px]">
            <div className="text-[7px] font-mono text-red-500 font-extrabold uppercase tracking-widest flex items-center gap-1">
              <ShieldAlert className="w-2.5 h-2.5 animate-pulse" />
              RACE CONTROL MESSAGE
            </div>
            <div className="w-[180px] overflow-hidden whitespace-nowrap relative mt-0.5">
              <div className="inline-block animate-marquee text-[9px] font-bold font-mono text-white/95">
                INCIDENT UNDER INVESTIGATION: CAR 4 / TRACK LIMITS TURN 9 • SECTOR 2 EXPIRING YELLOW • TRACK SURFACE GRIP REDUCING
              </div>
            </div>
          </div>
        </div>

        {/* Lap Counter */}
        <div className="glass-panel px-3 py-1 rounded border border-white/10 flex flex-col items-center justify-center min-w-[65px] h-9">
          <span className="text-[7px] text-white/40 font-mono tracking-wider">LAPS</span>
          <span className="text-xs font-bold font-mono text-white tracking-widest leading-none">
            {currentLap}<span className="text-white/30 text-[9px]">/52</span>
          </span>
        </div>

        {/* Weather Info */}
        <div className="flex items-center gap-3 px-3 py-1 rounded bg-white/[0.02] border border-white/10 h-9 text-mono">
          <div className="flex items-center gap-1" title="Air/Track Temp">
            <Thermometer size={12} className="text-cyan-400" />
            <span className="text-[9px] font-bold font-mono text-white/80">{weather.airTemp}°A/{weather.trackTemp}°T</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-1" title="Humidity">
            <Droplets size={12} className="text-blue-400" />
            <span className="text-[9px] font-bold font-mono text-white/80">{weather.humidity}%</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-1" title="Rain Radar">
            <CloudRain size={12} className={weather.rainProbability > 30 ? "text-cyan-400 animate-bounce" : "text-white/30"} />
            <span className="text-[9px] font-bold font-mono text-white/80">{weather.rainProbability}%</span>
          </div>
        </div>
      </div>

      {/* Simulator Controls & Audio Toggle */}
      <div className="flex items-center gap-3">
        {/* Flag Override Actions */}
        <div className="flex items-center gap-1 bg-white/2 p-1 rounded border border-white/5 mr-2">
          <button 
            onClick={triggerVSC}
            className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition-all ${
              raceFlag === 'VSC' 
                ? 'bg-amber-500 text-[#07090E] neon-glow-yellow' 
                : 'text-amber-500/60 hover:text-amber-400 hover:bg-white/5'
            }`}
            title="Toggle Virtual Safety Car"
          >
            VSC
          </button>
          <button 
            onClick={triggerSafetyCar}
            className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition-all ${
              raceFlag === 'SAFETY_CAR' 
                ? 'bg-orange-500 text-[#07090E]' 
                : 'text-orange-500/60 hover:text-orange-400 hover:bg-white/5'
            }`}
            title="Toggle Safety Car"
          >
            SC
          </button>
          <button 
            onClick={() => {
              setRaceFlag(raceFlag === 'RED' ? 'GREEN' : 'RED');
              playPitBeep(raceFlag === 'RED' ? 600 : 300, 0.5);
            }}
            className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition-all ${
              raceFlag === 'RED' 
                ? 'bg-red-500 text-white neon-glow-red' 
                : 'text-red-500/60 hover:text-red-400 hover:bg-white/5'
            }`}
            title="Toggle Red Flag"
          >
            RED
          </button>
        </div>

        {/* Speed Multiplier */}
        <div className="flex items-center gap-1 bg-white/2 p-1 rounded border border-white/5">
          {([1, 2, 5] as const).map(speed => (
            <button
              key={speed}
              onClick={() => {
                setSimSpeed(speed);
                playPitBeep(700 + speed * 50, 0.05);
              }}
              className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono transition-all ${
                simSpeed === speed 
                  ? 'bg-white/10 text-white border border-white/15' 
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
              title={`Set simulation speed to ${speed}x`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Simulation Play / Pause */}
        <button
          onClick={() => {
            setIsPlaying(!isPlaying);
            playPitBeep(isPlaying ? 440 : 880, 0.1);
          }}
          className={`p-2 rounded border transition-all flex items-center justify-center ${
            isPlaying 
              ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' 
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
          }`}
          title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
        </button>

        {/* Radio Audio Master Toggle */}
        <button
          onClick={handleAudioToggle}
          className={`p-2 rounded border transition-all flex items-center justify-center relative ${
            audioEnabled 
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 neon-glow-green' 
              : 'bg-white/2 border-white/5 text-white/30 hover:text-white/60 hover:bg-white/5'
          }`}
          title={audioEnabled ? 'Mute Radio Feeds' : 'Unmute Radio Feeds'}
        >
          {audioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          {audioEnabled && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

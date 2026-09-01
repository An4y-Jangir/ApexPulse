import React from 'react';
import { useF1Telemetry } from './hooks/useF1Telemetry';
import { Header } from './components/Header';
import { TimingTower } from './components/TimingTower';
import { TrackView } from './components/TrackView';
import { TeamRadioBar } from './components/TeamRadioBar';
import { CockpitTelemetry } from './components/CockpitTelemetry';

const App: React.FC = () => {
  const {
    mode,
    setMode,
    isPlaying,
    setIsPlaying,
    raceFlag,
    setRaceFlag,
    currentLap,
    drivers,
    driversRef,
    selectedDriver,
    setSelectedDriverCode,
    weather,
    radioFeed,
    audioEnabled,
    setAudioEnabled,
    triggerVSC,
    triggerSafetyCar,
    simSpeed,
    setSimSpeed,
    playPitBeep,
    connectionStatus,
    strategies,
    updateStrategy
  } = useF1Telemetry();

  // Find comparison driver (car immediately ahead in standing, or P2 if selected is leader)
  const comparisonDriver = React.useMemo(() => {
    if (!selectedDriver || drivers.length <= 1) return undefined;
    const selectedIdx = drivers.findIndex(d => d.code === selectedDriver.code);
    if (selectedIdx === -1) return undefined;

    if (selectedIdx === 0) {
      return drivers[1]; // Compare leader with P2
    }
    return drivers[selectedIdx - 1]; // Compare with car ahead
  }, [drivers, selectedDriver]);

  return (
    <div className="min-h-screen w-full bg-[#06070B] text-white flex flex-col relative overflow-x-hidden cyber-grid font-sans">
      
      {/* Neo-Cyber Ambient Background Glow Effects */}
      <div className="absolute top-20 left-10 w-[350px] h-[350px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-[450px] h-[450px] rounded-full bg-[#A855F7]/3 blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-red-500/3 blur-[120px] pointer-events-none" />

      {/* Header Panel */}
      <Header
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        raceFlag={raceFlag}
        setRaceFlag={setRaceFlag}
        currentLap={currentLap}
        weather={weather}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        triggerVSC={triggerVSC}
        triggerSafetyCar={triggerSafetyCar}
        simSpeed={simSpeed}
        setSimSpeed={setSimSpeed}
        playPitBeep={playPitBeep}
        mode={mode}
        setMode={setMode}
        connectionStatus={connectionStatus}
      />

      {/* Main Grid Dashboard Layout */}
      <main className="flex-1 w-full p-4 lg:p-6 grid grid-cols-12 gap-4 max-w-[1800px] mx-auto z-10">
        
        {/* Left Section: Leaderboard Timing Tower (col-span 3) */}
        <section className="col-span-12 md:col-span-5 lg:col-span-3 h-[calc(100vh-140px)] min-h-[500px] flex flex-col">
          <div className="flex-1 min-h-0">
            <TimingTower
              drivers={drivers}
              selectedDriverCode={selectedDriver ? selectedDriver.code : 'VER'}
              setSelectedDriverCode={setSelectedDriverCode}
            />
          </div>
        </section>

        {/* Center Section: Track Visualizer & Radio Feed (col-span 6) */}
        <section className="col-span-12 md:col-span-7 lg:col-span-6 flex flex-col gap-4 h-[calc(100vh-140px)] min-h-[500px]">
          {/* Track Map Canvas Wrapper */}
          <div className="flex-1 min-h-0">
            <TrackView
              driversRef={driversRef}
              selectedDriverCode={selectedDriver ? selectedDriver.code : 'VER'}
              setSelectedDriverCode={setSelectedDriverCode}
              mode={mode}
              raceFlag={raceFlag}
              strategies={strategies}
              updateStrategy={updateStrategy}
              rainProbability={weather.rainProbability}
            />
          </div>
          
          {/* Team Radio Alert Bar */}
          <div className="h-[140px] flex-shrink-0">
            <TeamRadioBar
              radioMessages={radioFeed}
              audioEnabled={audioEnabled}
            />
          </div>
        </section>

        {/* Right Section: Driver Cockpit Telemetry HUD (col-span 3) */}
        <section className="col-span-12 lg:col-span-3 h-[calc(100vh-140px)] min-h-[500px] flex flex-col">
          <div className="flex-1 min-h-0">
            {selectedDriver ? (
              <CockpitTelemetry
                driver={selectedDriver}
                comparisonDriver={comparisonDriver}
              />
            ) : (
              <div className="glass-panel w-full h-full flex flex-col items-center justify-center p-6 text-center font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping mb-4" />
                <span className="text-white/40 text-xs">SYNCHRONIZING HUD TELEMETRY DATA...</span>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
};

export default App;

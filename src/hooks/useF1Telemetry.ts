import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Driver, Weather, RaceControlFlag, TeamRadioMessage, TyreThermal, LapTiming, TyreCompound } from '../types/f1';
import { 
  F1SimulationEngine, 
  fetchLatestSession, 
  fetchDrivers, 
  fetchIntervals, 
  fetchCarTelemetryWindow, 
  fetchLocationWindow, 
  fetchTeamRadioWindow, 
  fetchRaceControlWindow 
} from '../services/f1DataService';

export function useF1Telemetry() {
  const [mode, setMode] = useState<'live' | 'simulation'>('simulation');
  const [isPlaying, setIsPlaying] = useState(true);
  const [raceFlag, setRaceFlag] = useState<RaceControlFlag>('GREEN');
  const [currentLap, setCurrentLap] = useState(42);
  const [selectedDriverCode, setSelectedDriverCode] = useState('VER');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 5>(1);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting' | 'offline'>('offline');
  
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [weather, setWeather] = useState<Weather>({
    airTemp: 21.4,
    trackTemp: 34.8,
    humidity: 62,
    rainProbability: 15,
    condition: 'Sunny'
  });
  const [radioFeed, setRadioFeed] = useState<TeamRadioMessage[]>([]);
  const [strategies, setStrategies] = useState<Record<string, { pace: 'ATTACK' | 'PUSH' | 'SAVE' | 'COOL'; tyre: 'DRY' | 'BAL' | 'SAVE' | 'COOL'; nextTyre: TyreCompound }>>({});
  const strategiesRef = useRef(strategies);
  strategiesRef.current = strategies;

  const updateStrategy = useCallback((code: string, pace: 'ATTACK' | 'PUSH' | 'SAVE' | 'COOL', tyre: 'DRY' | 'BAL' | 'SAVE' | 'COOL', nextTyre: TyreCompound) => {
    setStrategies(prev => {
      const next = {
        ...prev,
        [code]: { pace, tyre, nextTyre }
      };
      strategiesRef.current = next;
      return next;
    });
  }, []);

  // Refs for 60FPS canvas access (bypassing React state delay)
  const driversRef = useRef<Driver[]>([]);
  const modeRef = useRef<'live' | 'simulation'>(mode);
  modeRef.current = mode;

  const simEngineRef = useRef<F1SimulationEngine | null>(null);

  // Live Mode Buffers
  const sessionRef = useRef<any>(null);
  const driverMetaRef = useRef<Map<number, any>>(new Map()); // Maps driver_number -> driver static details
  const locationBufferRef = useRef<Map<number, Array<{ time: number; x: number; y: number }>>>(new Map());
  const telemetryBufferRef = useRef<Map<number, Array<{ time: number; speed: number; rpm: number; gear: number; throttle: number; brake: number; drs: boolean }>>>(new Map());
  const latestIntervalsRef = useRef<Map<number, { gap: string; interval: string }>>(new Map());
  
  // Timing cursor for playback
  const liveTimeHeadRef = useRef<number>(0); // Target fetching time (ISO ms)
  const playbackTimeRef = useRef<number>(0); // Current interpolation time (ISO ms)
  const isFetchingRef = useRef<boolean>(false);
  const fetchTimerRef = useRef<number | null>(null);

  // Synth Audio Pit Beep
  const playPitBeep = useCallback((freq = 880, duration = 0.15) => {
    if (!audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error(e);
    }
  }, [audioEnabled]);

  // Audio radio triggers
  const handleRadioTrigger = useCallback((msg: TeamRadioMessage) => {
    setRadioFeed(prev => [msg, ...prev.slice(0, 15)]);
    playPitBeep(520, 0.08);
    setTimeout(() => playPitBeep(650, 0.12), 80);
  }, [playPitBeep]);

  // Initialize simulation engine
  useEffect(() => {
    if (!simEngineRef.current) {
      simEngineRef.current = new F1SimulationEngine();
    }
  }, []);

  // Update sim engine speed
  useEffect(() => {
    if (simEngineRef.current) {
      simEngineRef.current.setSpeed(simSpeed);
    }
  }, [simSpeed]);

  // Live Mode polling loop
  const pollLiveWindow = useCallback(async () => {
    if (!sessionRef.current || isFetchingRef.current) return;
    isFetchingRef.current = true;

    const startMs = liveTimeHeadRef.current;
    const endMs = startMs + 3000; // fetch a 3 second window

    const startDateStr = new Date(startMs).toISOString().replace(/\.\d+Z$/, 'Z');
    const endDateStr = new Date(endMs).toISOString().replace(/\.\d+Z$/, 'Z');

    try {
      const sessionKey = sessionRef.current.session_key;

      // 1. Fetch intervals, telemetry, locations, and radios in parallel
      const [telemetryData, locationData, radioData, intervalsData, raceControlData] = await Promise.all([
        fetchCarTelemetryWindow(sessionKey, startDateStr, endDateStr).catch(() => []),
        fetchLocationWindow(sessionKey, startDateStr, endDateStr).catch(() => []),
        fetchTeamRadioWindow(sessionKey, startDateStr, endDateStr).catch(() => []),
        fetchIntervals(sessionKey).catch(() => []),
        fetchRaceControlWindow(sessionKey, startDateStr, endDateStr).catch(() => [])
      ]);

      // 2. Buffer Locations
      locationData.forEach(loc => {
        const dNum = loc.driver_number;
        const time = new Date(loc.date).getTime();
        if (!locationBufferRef.current.has(dNum)) {
          locationBufferRef.current.set(dNum, []);
        }
        locationBufferRef.current.get(dNum)!.push({ time, x: loc.x, y: loc.y });
      });

      // 3. Buffer Telemetry
      telemetryData.forEach(t => {
        const dNum = t.driver_number;
        const time = new Date(t.date).getTime();
        if (!telemetryBufferRef.current.has(dNum)) {
          telemetryBufferRef.current.set(dNum, []);
        }
        telemetryBufferRef.current.get(dNum)!.push({
          time,
          speed: t.speed,
          rpm: t.rpm,
          gear: t.n_gear,
          throttle: t.throttle,
          brake: t.brake,
          drs: t.drs >= 10
        });
      });

      // 4. Update Interval Map
      intervalsData.forEach(int => {
        const dNum = int.driver_number;
        let gap = 'LDR';
        let interval = '';
        if (int.gap_to_leader !== null && int.gap_to_leader !== undefined) {
          gap = typeof int.gap_to_leader === 'number' ? `+${int.gap_to_leader.toFixed(1)}s` : `+${int.gap_to_leader}s`;
        }
        if (int.interval !== null && int.interval !== undefined) {
          interval = typeof int.interval === 'number' ? `+${int.interval.toFixed(1)}s` : `+${int.interval}s`;
        }
        latestIntervalsRef.current.set(dNum, { gap, interval: interval || gap });
      });

      // 5. Team Radio transcription trigger
      radioData.forEach(r => {
        const driverMeta = driverMetaRef.current.get(r.driver_number);
        const time = new Date(r.date).toLocaleTimeString();
        if (driverMeta) {
          const newMsg: TeamRadioMessage = {
            id: `live-radio-${r.date}-${r.driver_number}`,
            driverCode: driverMeta.name_acronym,
            driverName: driverMeta.broadcast_name,
            teamColor: '#' + (driverMeta.team_colour || 'FFFFFF'),
            timestamp: time,
            message: r.transcript || 'Radio Transmission Active',
            type: 'inbound'
          };
          handleRadioTrigger(newMsg);
        }
      });

      // 6. Race control messages
      raceControlData.forEach(rc => {
        if (rc.flag) {
          const flag = rc.flag as RaceControlFlag;
          setRaceFlag(flag);
        }
      });

      // Clean up historical buffers to prevent memory leaks (keep last 30 seconds of buffer)
      const bufferCutoff = playbackTimeRef.current - 30000;
      locationBufferRef.current.forEach((arr, key) => {
        locationBufferRef.current.set(key, arr.filter(p => p.time > bufferCutoff));
      });
      telemetryBufferRef.current.forEach((arr, key) => {
        telemetryBufferRef.current.set(key, arr.filter(t => t.time > bufferCutoff));
      });

      // Advance fetching window
      liveTimeHeadRef.current = endMs;
      setConnectionStatus('connected');
    } catch (err) {
      console.error('OpenF1 Polling Error: ', err);
      setConnectionStatus('disconnected');
    } finally {
      isFetchingRef.current = false;
      // Schedule next poll
      fetchTimerRef.current = window.setTimeout(pollLiveWindow, 3000);
    }
  }, [handleRadioTrigger]);

  // Live Mode Toggle & Initialization
  useEffect(() => {
    if (mode === 'live') {
      setConnectionStatus('reconnecting');
      setDrivers([]);
      
      const initLiveSession = async () => {
        try {
          // Fetch latest session
          const session = await fetchLatestSession();
          sessionRef.current = session;
          
          // Fetch drivers metadata
          const driversData = await fetchDrivers(session.session_key);
          const metaMap = new Map();
          driversData.forEach(d => {
            metaMap.set(d.driver_number, d);
          });
          driverMetaRef.current = metaMap;

          // Find start time of session
          const startMs = new Date(session.date_start).getTime();
          const endMs = new Date(session.date_end || session.date_start).getTime();

          // Set time head: If session is over, play last 5 minutes. If running, start from now - 30 seconds.
          const isFinished = endMs && (Date.now() > endMs);
          const startingPoint = isFinished 
            ? Math.max(startMs, endMs - 5 * 60 * 1000) 
            : Date.now() - 30 * 1000;

          liveTimeHeadRef.current = startingPoint;
          playbackTimeRef.current = startingPoint - 5000; // Let playback lag 5 seconds behind fetching for smooth interpolation buffer
          
          // Reset buffers
          locationBufferRef.current.clear();
          telemetryBufferRef.current.clear();
          latestIntervalsRef.current.clear();

          // Start loop
          pollLiveWindow();
        } catch (err) {
          console.error(err);
          // Fallback to simulation immediately on failure
          setMode('simulation');
          setConnectionStatus('offline');
        }
      };

      initLiveSession();
    } else {
      // Clean up live timers
      if (fetchTimerRef.current) {
        clearTimeout(fetchTimerRef.current);
        fetchTimerRef.current = null;
      }
      setConnectionStatus('offline');
    }

    return () => {
      if (fetchTimerRef.current) {
        clearTimeout(fetchTimerRef.current);
      }
    };
  }, [mode, pollLiveWindow]);

  // 60FPS Game Loop / Lerp Engine
  useEffect(() => {
    let animId: number;
    let lastTime = Date.now();
    let throttledUpdateTimer = 0;

    const tick = () => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (!isPlaying) {
        animId = requestAnimationFrame(tick);
        return;
      }

      if (modeRef.current === 'simulation' && simEngineRef.current) {
        // --- 1. Simulation Playback ---
        const simState = simEngineRef.current.getSimulationState(audioEnabled, handleRadioTrigger, strategiesRef.current);
        setRaceFlag(simState.flag);
        setCurrentLap(simState.lap);
        setWeather(simState.weather);

        // Update ref immediately for canvas
        driversRef.current = simState.drivers;

        // Throttled update of React state for timing tower leaderboard
        throttledUpdateTimer += dt;
        if (throttledUpdateTimer >= 0.15) { // ~6.6Hz Timing Tower updates
          throttledUpdateTimer = 0;
          setDrivers(simState.drivers);
        }
      } else if (modeRef.current === 'live' && sessionRef.current) {
        // --- 2. Live API Playback with Lerp ---
        // Playback time advances by dt (in milliseconds)
        playbackTimeRef.current += dt * 1000;
        const playTime = playbackTimeRef.current;

        // Build current Driver instances by interpolating location and telemetry logs
        const updatedDrivers: Driver[] = [];
        let index = 0;

        driverMetaRef.current.forEach((meta, dNum) => {
          index++;
          // A. Position interpolation
          const locs = locationBufferRef.current.get(dNum) || [];
          let x = 0;
          let y = 0;
          
          if (locs.length > 0) {
            // Find two points surrounding the playback time
            const nextIdx = locs.findIndex(p => p.time > playTime);
            if (nextIdx === -1) {
              // Time has exceeded all buffered locations, use latest
              const last = locs[locs.length - 1];
              x = last.x;
              y = last.y;
            } else if (nextIdx === 0) {
              // Time is before all buffered locations, use first
              const first = locs[0];
              x = first.x;
              y = first.y;
            } else {
              // Interpolate
              const pPrev = locs[nextIdx - 1];
              const pNext = locs[nextIdx];
              const factor = (playTime - pPrev.time) / (pNext.time - pPrev.time);
              x = pPrev.x + (pNext.x - pPrev.x) * factor;
              y = pPrev.y + (pNext.y - pPrev.y) * factor;
            }
          }

          // B. Telemetry interpolation
          const tel = telemetryBufferRef.current.get(dNum) || [];
          let speed = 0;
          let rpm = 1000;
          let gear = 1;
          let throttle = 0;
          let brake = 0;
          let drs = false;

          if (tel.length > 0) {
            const nextIdx = tel.findIndex(t => t.time > playTime);
            if (nextIdx === -1) {
              const last = tel[tel.length - 1];
              speed = last.speed;
              rpm = last.rpm;
              gear = last.gear;
              throttle = last.throttle;
              brake = last.brake;
              drs = last.drs;
            } else if (nextIdx === 0) {
              const first = tel[0];
              speed = first.speed;
              rpm = first.rpm;
              gear = first.gear;
              throttle = first.throttle;
              brake = first.brake;
              drs = first.drs;
            } else {
              const tPrev = tel[nextIdx - 1];
              const tNext = tel[nextIdx];
              const factor = (playTime - tPrev.time) / (tNext.time - tPrev.time);
              
              speed = tPrev.speed + (tNext.speed - tPrev.speed) * factor;
              rpm = tPrev.rpm + (tNext.rpm - tPrev.rpm) * factor;
              gear = tPrev.gear; // don't lerp integers like gear
              throttle = tPrev.throttle + (tNext.throttle - tPrev.throttle) * factor;
              brake = tPrev.brake + (tNext.brake - tPrev.brake) * factor;
              drs = tPrev.drs; // boolean DRS
            }
          }

          const intData = latestIntervalsRef.current.get(dNum) || { gap: '+0.0s', interval: '+0.0s' };

          // Build thermal heat model dynamically
          const speedFactor = speed / 350;
          const thermal: TyreThermal = {
            temperatures: {
              fl: Math.round(85 + speedFactor * 15 + Math.sin(x) * 2),
              fr: Math.round(87 + speedFactor * 13 + Math.cos(y) * 2),
              rl: Math.round(82 + speedFactor * 14 + Math.sin(y) * 1.5),
              rr: Math.round(83 + speedFactor * 16 + Math.cos(x) * 1.5)
            },
            wear: { fl: 12.4, fr: 13.1, rl: 10.9, rr: 11.2 }
          };

          const timing: LapTiming = {
            lapNumber: 24,
            lapTime: '1:31.425',
            lastLapTime: '1:31.425',
            bestLapTime: '1:30.985',
            sector1: '28.910',
            sector2: '36.210',
            sector3: '26.305',
            sector1State: 'green',
            sector2State: 'green',
            sector3State: 'purple'
          };

          // Map coordinate into 0-1 scale dynamically for Silverstone shape fallback or plot direct scaled positions
          // To ensure standard SilverStone shape is drawn, location API coordinates (x, y) can be mapped.
          // Store raw (x, y) in distanceTraveled as a temporary container or coordinates can be retrieved by canvas
          // We can use distanceTraveled as a coordinate indicator for drawing
          
          updatedDrivers.push({
            position: index, // Sort positions below
            code: meta.name_acronym || 'DRV',
            number: dNum,
            name: meta.broadcast_name || 'Driver',
            team: meta.team_name || 'Livery Team',
            teamColor: '#' + (meta.team_colour || 'FFFFFF'),
            gap: intData.gap,
            interval: intData.interval,
            tyreCompound: 'M',
            tyreLaps: 8,
            telemetry: {
              speed: Math.round(speed),
              rpm: Math.round(rpm),
              gear,
              throttle: Math.round(throttle),
              brake: Math.round(brake),
              drs,
              ersPercent: Math.round(85 - speedFactor * 40)
            },
            tyreThermal: thermal,
            lapTiming: timing,
            distanceTraveled: x, // in Live mode, distanceTraveled holds the RAW API X coordinate
            isPitStop: false,
            pitDurationRemaining: y // in Live mode, pitDurationRemaining holds the RAW API Y coordinate
          });
        });

        // Re-sort positions based on intervals/gaps if available
        updatedDrivers.sort((a, b) => {
          if (a.gap === 'LDR') return -1;
          if (b.gap === 'LDR') return 1;
          const aSec = parseFloat(a.gap.replace('+', '').replace('s', ''));
          const bSec = parseFloat(b.gap.replace('+', '').replace('s', ''));
          return aSec - bSec;
        });

        const sortedDrivers = updatedDrivers.map((d, idx) => ({
          ...d,
          position: idx + 1
        }));

        driversRef.current = sortedDrivers;

        throttledUpdateTimer += dt;
        if (throttledUpdateTimer >= 0.15) {
          throttledUpdateTimer = 0;
          setDrivers(sortedDrivers);
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, audioEnabled, handleRadioTrigger]);

  // Selected driver helper state
  const selectedDriver = useMemo(() => {
    return drivers.find(d => d.code === selectedDriverCode) || drivers[0];
  }, [drivers, selectedDriverCode]);

  // Selected driver ref (updates at 60FPS)
  const selectedDriverRef = useMemo(() => {
    return {
      get: () => driversRef.current.find(d => d.code === selectedDriverCode) || driversRef.current[0]
    };
  }, [selectedDriverCode]);

  // Sim Control Functions
  const triggerVSC = useCallback(() => {
    if (simEngineRef.current) simEngineRef.current.triggerVSC();
  }, []);

  const triggerSafetyCar = useCallback(() => {
    if (simEngineRef.current) simEngineRef.current.triggerSafetyCar();
  }, []);

  return {
    mode,
    setMode,
    isPlaying,
    setIsPlaying,
    raceFlag,
    setRaceFlag: (flag: RaceControlFlag) => {
      setRaceFlag(flag);
      if (simEngineRef.current) simEngineRef.current.setRaceFlag(flag);
    },
    currentLap,
    drivers,
    driversRef,
    selectedDriver,
    selectedDriverRef,
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
  };
}

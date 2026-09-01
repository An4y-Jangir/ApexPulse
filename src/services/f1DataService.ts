import type { Driver, CarTelemetry, TyreThermal, LapTiming, TeamRadioMessage, RaceControlFlag, Weather, TyreCompound, TyreTemperatures, TyreWear } from '../types/f1';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

import { SILVERSTONE_MASTER_ANCHORS } from '../utils/trackGeometry';

// Normalized 2D coordinates for the Silverstone circuit map (backwards compatible)
export const SILVERSTONE_TRACK_POINTS = SILVERSTONE_MASTER_ANCHORS.map(pt => ({
  x: pt.x,
  y: pt.y,
  name: pt.name || ''
}));

export const INITIAL_DRIVERS_DATA = [
  { code: 'VER', number: 1, name: 'Max Verstappen', team: 'Red Bull Racing', teamColor: '#3671C6', baseLapTime: 87.1, tyreCompound: 'M' as TyreCompound, tyreLaps: 12 },
  { code: 'NOR', number: 4, name: 'Lando Norris', team: 'McLaren', teamColor: '#FF8000', baseLapTime: 87.3, tyreCompound: 'M' as TyreCompound, tyreLaps: 10 },
  { code: 'LEC', number: 16, name: 'Charles Leclerc', team: 'Ferrari', teamColor: '#E80020', baseLapTime: 87.5, tyreCompound: 'S' as TyreCompound, tyreLaps: 6 },
  { code: 'PIA', number: 81, name: 'Oscar Piastri', team: 'McLaren', teamColor: '#FF8000', baseLapTime: 87.6, tyreCompound: 'M' as TyreCompound, tyreLaps: 11 },
  { code: 'SAI', number: 55, name: 'Carlos Sainz', team: 'Ferrari', teamColor: '#E80020', baseLapTime: 87.8, tyreCompound: 'S' as TyreCompound, tyreLaps: 7 },
  { code: 'HAM', number: 44, name: 'Lewis Hamilton', team: 'Mercedes', teamColor: '#27F4D2', baseLapTime: 87.7, tyreCompound: 'H' as TyreCompound, tyreLaps: 18 },
  { code: 'RUS', number: 63, name: 'George Russell', team: 'Mercedes', teamColor: '#27F4D2', baseLapTime: 87.9, tyreCompound: 'H' as TyreCompound, tyreLaps: 15 },
  { code: 'PER', number: 11, name: 'Sergio Perez', team: 'Red Bull Racing', teamColor: '#3671C6', baseLapTime: 88.2, tyreCompound: 'M' as TyreCompound, tyreLaps: 14 },
  { code: 'ALO', number: 14, name: 'Fernando Alonso', team: 'Aston Martin', teamColor: '#229971', baseLapTime: 88.4, tyreCompound: 'H' as TyreCompound, tyreLaps: 20 },
  { code: 'HUL', number: 27, name: 'Nico Hulkenberg', team: 'Haas', teamColor: '#B6BABD', baseLapTime: 88.8, tyreCompound: 'S' as TyreCompound, tyreLaps: 5 },
  { code: 'TSU', number: 22, name: 'Yuki Tsunoda', team: 'RB', teamColor: '#6692FF', baseLapTime: 88.9, tyreCompound: 'M' as TyreCompound, tyreLaps: 13 },
  { code: 'STR', number: 18, name: 'Lance Stroll', team: 'Aston Martin', teamColor: '#229971', baseLapTime: 89.1, tyreCompound: 'M' as TyreCompound, tyreLaps: 11 },
  { code: 'ALB', number: 23, name: 'Alex Albon', team: 'Williams', teamColor: '#64C4FF', baseLapTime: 88.9, tyreCompound: 'H' as TyreCompound, tyreLaps: 22 },
  { code: 'GAS', number: 10, name: 'Pierre Gasly', team: 'Alpine', teamColor: '#FF87BC', baseLapTime: 89.3, tyreCompound: 'S' as TyreCompound, tyreLaps: 8 },
  { code: 'OCO', number: 31, name: 'Esteban Ocon', team: 'Alpine', teamColor: '#FF87BC', baseLapTime: 89.4, tyreCompound: 'M' as TyreCompound, tyreLaps: 12 },
  { code: 'MAG', number: 20, name: 'Kevin Magnussen', team: 'Haas', teamColor: '#B6BABD', baseLapTime: 89.5, tyreCompound: 'M' as TyreCompound, tyreLaps: 15 },
  { code: 'BOT', number: 77, name: 'Valtteri Bottas', team: 'Kick Sauber', teamColor: '#52E252', baseLapTime: 89.9, tyreCompound: 'H' as TyreCompound, tyreLaps: 25 },
  { code: 'ZHO', number: 24, name: 'Zhou Guanyu', team: 'Kick Sauber', teamColor: '#52E252', baseLapTime: 90.2, tyreCompound: 'M' as TyreCompound, tyreLaps: 16 },
  { code: 'COL', number: 43, name: 'Franco Colapinto', team: 'Williams', teamColor: '#64C4FF', baseLapTime: 89.6, tyreCompound: 'S' as TyreCompound, tyreLaps: 9 },
  { code: 'LAW', number: 30, name: 'Liam Lawson', team: 'RB', teamColor: '#6692FF', baseLapTime: 89.0, tyreCompound: 'H' as TyreCompound, tyreLaps: 17 }
];

const RADIO_TEMPLATES = [
  { message: "Box box, box box. Confirm.", type: "outbound" },
  { message: "Copy that, boxing this lap.", type: "inbound" },
  { message: "Tires are feeling good, we can push longer.", type: "inbound" },
  { message: "Gap to Hamilton behind is 2.4 seconds, he is on older Hards.", type: "outbound" },
  { message: "Watch the track limits in Turn 9. Black and white flag warning.", type: "outbound" },
  { message: "Yellow flag in Sector 2, slow car ahead. Stay alert.", type: "outbound" },
  { message: "ERS battery is low, use mode harvest.", type: "outbound" },
  { message: "Mode charge. We need to recharge the battery for the end of the straight.", type: "outbound" },
  { message: "Wind is picking up at Becketts. Watch the balance.", type: "outbound" },
  { message: "Tyres are overheating, slide less.", type: "outbound" },
  { message: "Copy. DRS is enabled, let's make the move now.", type: "inbound" },
  { message: "Power unit feels down on power, please check.", type: "inbound" },
  { message: "We see no issues on data, keep pushing.", type: "outbound" }
];

export interface LiveSession {
  session_key: number;
  session_name: string;
  meeting_key: number;
  date_start: string;
  date_end: string;
  circuit_key: number;
  location: string;
}

// ----------------------------------------------------
// OpenF1 Live REST API Fetch Functions
// ----------------------------------------------------

export async function fetchLatestSession(): Promise<LiveSession> {
  const response = await fetch(`${OPENF1_BASE_URL}/sessions?session_key=latest`);
  if (!response.ok) throw new Error('Failed to fetch latest session');
  const data = await response.json();
  if (data && data.length > 0) {
    return data[0];
  }
  // If latest is empty, fetch sessions from 2024 onwards
  const fallbackResponse = await fetch(`${OPENF1_BASE_URL}/sessions?year=2024`);
  if (!fallbackResponse.ok) throw new Error('Failed to fetch sessions fallback');
  const fallbackData = await fallbackResponse.json();
  if (fallbackData && fallbackData.length > 0) {
    // Return last session
    return fallbackData[fallbackData.length - 1];
  }
  throw new Error('No sessions found in OpenF1 database');
}

export async function fetchDrivers(sessionKey: number): Promise<any[]> {
  const response = await fetch(`${OPENF1_BASE_URL}/drivers?session_key=${sessionKey}`);
  if (!response.ok) throw new Error('Failed to fetch drivers');
  return response.json();
}

export async function fetchIntervals(sessionKey: number): Promise<any[]> {
  const response = await fetch(`${OPENF1_BASE_URL}/intervals?session_key=${sessionKey}`);
  if (!response.ok) throw new Error('Failed to fetch intervals');
  return response.json();
}

export async function fetchCarTelemetryWindow(
  sessionKey: number, 
  startDate: string, 
  endDate: string
): Promise<any[]> {
  const url = `${OPENF1_BASE_URL}/car_data?session_key=${sessionKey}&date>=${startDate}&date<=${endDate}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch telemetry window');
  return response.json();
}

export async function fetchLocationWindow(
  sessionKey: number, 
  startDate: string, 
  endDate: string
): Promise<any[]> {
  const url = `${OPENF1_BASE_URL}/location?session_key=${sessionKey}&date>=${startDate}&date<=${endDate}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch locations window');
  return response.json();
}

export async function fetchTeamRadioWindow(
  sessionKey: number, 
  startDate: string, 
  endDate: string
): Promise<any[]> {
  const url = `${OPENF1_BASE_URL}/team_radio?session_key=${sessionKey}&date>=${startDate}&date<=${endDate}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch team radio window');
  return response.json();
}

export async function fetchRaceControlWindow(
  sessionKey: number, 
  startDate: string, 
  endDate: string
): Promise<any[]> {
  const url = `${OPENF1_BASE_URL}/race_control?session_key=${sessionKey}&date>=${startDate}&date<=${endDate}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch race control window');
  return response.json();
}

// ----------------------------------------------------
// Deterministic 60FPS Silverstone Simulation Engine
// ----------------------------------------------------

export class F1SimulationEngine {
  private drivers: Driver[];
  private weather: Weather;
  private raceFlag: RaceControlFlag = 'GREEN';
  private simSpeed: number = 1;
  private radioMessages: TeamRadioMessage[] = [];
  private lastUpdate: number = Date.now();
  private isWet: boolean = false;
  private radioTemplates = RADIO_TEMPLATES;

  constructor() {
    this.weather = {
      airTemp: 21.4,
      trackTemp: 34.8,
      humidity: 62,
      rainProbability: 15,
      condition: 'Sunny'
    };

    this.drivers = INITIAL_DRIVERS_DATA.map((d, index) => {
      const distanceTraveled = 0.95 - (index * 0.045);
      const initialWear = 5 + Math.random() * 20;
      
      const temperatures: TyreTemperatures = { fl: 92, fr: 94, rl: 90, rr: 91 };
      const wear: TyreWear = { fl: initialWear, fr: initialWear + 1, rl: initialWear - 1, rr: initialWear };

      const telemetry: CarTelemetry = {
        speed: 0,
        rpm: 4000,
        gear: 1,
        throttle: 0,
        brake: 0,
        drs: false,
        ersPercent: 85 - (index * 2)
      };

      const tyreThermal: TyreThermal = { temperatures, wear };

      const lapTiming: LapTiming = {
        lapNumber: 42,
        lapTime: '0.000',
        lastLapTime: '1:28.602',
        bestLapTime: (d.baseLapTime + Math.random() * 0.5).toFixed(3),
        sector1: '28.452',
        sector2: '35.912',
        sector3: '24.238',
        sector1State: 'green',
        sector2State: 'green',
        sector3State: 'green'
      };

      return {
        position: index + 1,
        code: d.code,
        number: d.number,
        name: d.name,
        team: d.team,
        teamColor: d.teamColor,
        gap: index === 0 ? 'LDR' : '',
        interval: '',
        tyreCompound: d.tyreCompound,
        tyreLaps: d.tyreLaps,
        telemetry,
        tyreThermal,
        lapTiming,
        distanceTraveled: distanceTraveled < 0 ? distanceTraveled + 1 : distanceTraveled,
        isPitStop: false,
        pitDurationRemaining: 0
      };
    });
  }

  public setSpeed(speed: number) {
    this.simSpeed = speed;
  }

  public getSimulationState(
    audioEnabled: boolean, 
    onRadio: (msg: TeamRadioMessage) => void,
    strategies?: Record<string, { pace: 'ATTACK' | 'PUSH' | 'SAVE' | 'COOL'; tyre: 'DRY' | 'BAL' | 'SAVE' | 'COOL'; nextTyre: TyreCompound }>
  ) {
    const now = Date.now();
    const dt = (now - this.lastUpdate) / 1000 * this.simSpeed;
    this.lastUpdate = now;

    // Limit dt to avoid massive leaps when tab is backgrounded
    const safeDt = Math.min(dt, 0.5);

    // Update weather slightly
    if (Math.random() < 0.005) {
      this.weather.airTemp = parseFloat((this.weather.airTemp + (Math.random() - 0.5) * 0.1).toFixed(1));
      this.weather.trackTemp = parseFloat((this.weather.trackTemp + (Math.random() - 0.5) * 0.2).toFixed(1));
      this.weather.humidity = Math.max(30, Math.min(100, this.weather.humidity + (Math.random() > 0.5 ? 1 : -1)));
      if (Math.random() < 0.1) {
        this.weather.rainProbability = Math.max(0, Math.min(100, this.weather.rainProbability + (Math.random() > 0.5 ? 2 : -2)));
      }

      this.isWet = this.weather.rainProbability > 60;
      this.weather.condition = this.weather.rainProbability > 75 
        ? 'Heavy Rain' 
        : this.weather.rainProbability > 45 
          ? 'Drizzle' 
          : this.weather.rainProbability > 20 
            ? 'Overcast' 
            : 'Sunny';
    }

    // Trigger random radio message
    if (Math.random() < 0.003 && audioEnabled) {
      const activeDrivers = this.drivers;
      const driver = activeDrivers[Math.floor(Math.random() * activeDrivers.length)];
      const template = this.radioTemplates[Math.floor(Math.random() * this.radioTemplates.length)];
      const timeStr = new Date().toTimeString().split(' ')[0];
      const newMsg: TeamRadioMessage = {
        id: `radio-${Date.now()}`,
        driverCode: driver.code,
        driverName: driver.name,
        teamColor: driver.teamColor,
        timestamp: timeStr,
        message: template.message,
        type: template.type as 'inbound' | 'outbound'
      };
      this.radioMessages = [newMsg, ...this.radioMessages.slice(0, 10)];
      onRadio(newMsg);
    }

    // Drive cars
    this.drivers = this.drivers.map((d) => {
      // 1. Pitstop logic
      if (d.isPitStop) {
        const remaining = d.pitDurationRemaining - safeDt;
        if (remaining <= 0) {
          // Exit pit
          let newCompound: TyreCompound = d.tyreCompound;
          if (this.isWet) {
            newCompound = Math.random() > 0.5 ? 'I' : 'W';
          } else {
            const compounds: TyreCompound[] = ['S', 'M', 'H'];
            newCompound = compounds[Math.floor(Math.random() * compounds.length)];
          }

          return {
            ...d,
            isPitStop: false,
            pitDurationRemaining: 0,
            tyreCompound: newCompound,
            tyreLaps: 0,
            tyreThermal: {
              temperatures: { fl: 85, fr: 87, rl: 82, rr: 83 },
              wear: { fl: 0, fr: 0, rl: 0, rr: 0 }
            },
            telemetry: {
              ...d.telemetry,
              speed: 80,
              gear: 2,
              throttle: 60,
              brake: 0,
              rpm: 6000
            }
          };
        } else {
          // Stationary in pit box (stationary around 2.5s)
          const stationary = remaining > 1.5 && remaining < 4.0;
          return {
            ...d,
            pitDurationRemaining: remaining,
            telemetry: {
              ...d.telemetry,
              speed: stationary ? 0 : 80,
              gear: stationary ? 0 : 1,
              throttle: stationary ? 0 : 20,
              brake: stationary ? 100 : 10,
              rpm: stationary ? 2000 : 4500,
              ersPercent: Math.min(100, d.telemetry.ersPercent + safeDt * 2)
            }
          };
        }
      }

      // 2. Physics & Speeds along Silverstone track
      // Get track zone based on progress
      const progress = d.distanceTraveled;
      let speed = 260;
      let rpm = 10500;
      let gear = 6;
      let throttle = 100;
      let brake = 0;
      let drs = false;

      // Retrieve strategy
      const driverStrategy = strategies?.[d.code] || { pace: 'PUSH', tyre: 'BAL', nextTyre: d.tyreCompound };

      // Map track points to decide speeds
      if (progress >= 0.05 && progress < 0.11) {
        // Abbey Corner - medium speed
        speed = 180 + Math.sin(progress * 100) * 15;
        gear = 4;
        throttle = 40;
        brake = 10;
        rpm = 8500;
      } else if (progress >= 0.11 && progress < 0.17) {
        // Loop slow corner
        speed = 85 + Math.sin(progress * 100) * 8;
        gear = 2;
        throttle = 20;
        brake = 70;
        rpm = 5500;
      } else if (progress >= 0.17 && progress < 0.35) {
        // Wellington Straight - DRS zone 1
        speed = 120 + ((progress - 0.17) / 0.18) * 185;
        gear = 7;
        throttle = 100;
        brake = 0;
        rpm = 11800;
        drs = progress > 0.21 && progress < 0.33;
      } else if (progress >= 0.35 && progress < 0.46) {
        // Brooklands & Luffield - slow corners
        speed = 100 + Math.cos(progress * 80) * 20;
        gear = 3;
        throttle = 30;
        brake = 40;
        rpm = 6800;
      } else if (progress >= 0.46 && progress < 0.55) {
        // Copse Corner - high speed corner
        speed = 240 - Math.sin(progress * 90) * 25;
        gear = 6;
        throttle = 80;
        brake = 15;
        rpm = 10000;
      } else if (progress >= 0.55 && progress < 0.65) {
        // Maggots, Becketts, Chapel - fast chicane
        speed = 160 + Math.sin(progress * 140) * 40;
        gear = 5;
        throttle = 50;
        brake = 35;
        rpm = 8800;
      } else if (progress >= 0.65 && progress < 0.81) {
        // Hangar Straight - DRS zone 2
        speed = 180 + ((progress - 0.65) / 0.16) * 135;
        gear = 8;
        throttle = 100;
        brake = 0;
        rpm = 12100;
        drs = progress > 0.68 && progress < 0.79;
      } else if (progress >= 0.81 && progress < 0.86) {
        // Stowe Corner
        speed = 150 + Math.cos(progress * 100) * 30;
        gear = 4;
        throttle = 35;
        brake = 60;
        rpm = 7900;
      } else if (progress >= 0.86 && progress < 0.95) {
        // Vale & Club corners
        speed = 90 + Math.sin(progress * 80) * 20;
        gear = 2;
        throttle = 25;
        brake = 50;
        rpm = 5800;
      } else {
        // Hamilton straight - start/finish
        speed = 220 + (progress < 0.05 ? progress * 600 : (progress - 0.95) * 600);
        gear = 6;
        throttle = 100;
        brake = 0;
        rpm = 11000;
      }

      // Add driver pacing offsets so they separate
      const driverSpeedOffset = (21 - d.position) * 0.4;
      speed += driverSpeedOffset;

      // Apply strategy speed offsets
      if (driverStrategy.pace === 'ATTACK') {
        speed += 8;
        rpm = Math.min(12500, rpm + 800);
        throttle = 100;
      } else if (driverStrategy.pace === 'SAVE') {
        speed -= 6;
        rpm = Math.max(4000, rpm - 600);
        throttle = Math.min(throttle, 85);
      } else if (driverStrategy.pace === 'COOL') {
        speed -= 12;
        rpm = Math.max(4000, rpm - 1100);
        throttle = Math.min(throttle, 70);
        brake = Math.max(brake, 10);
      }

      // Adjust for weather conditions
      if (this.isWet) {
        speed *= 0.82;
        rpm *= 0.9;
        throttle *= 0.9;
        if (Math.random() < 0.05) brake = Math.min(100, brake + 10);
      }

      // Speed limits based on race flag
      if (this.raceFlag === 'YELLOW' || this.raceFlag === 'VSC') {
        speed = Math.min(speed, 120);
        rpm = Math.min(rpm, 6500);
        gear = Math.min(gear, 4);
        throttle = Math.min(throttle, 50);
        drs = false;
      } else if (this.raceFlag === 'SAFETY_CAR') {
        speed = Math.min(speed, 90);
        rpm = Math.min(rpm, 5000);
        gear = Math.min(gear, 3);
        throttle = Math.min(throttle, 40);
        drs = false;
      }

      // Safeguard: Ensure speed never falls to or below zero (preventing cars moving backwards or getting stuck)
      speed = Math.max(50, speed);

      // 3. Move driver along track
      // Distance traveled step
      const metersPerSec = speed / 3.6;
      const lapProgressDelta = (metersPerSec * safeDt) / 5891;
      let nextProgress = d.distanceTraveled + lapProgressDelta;

      let nextLapLaps = d.tyreLaps;
      let nextLapTiming = { ...d.lapTiming };

      if (nextProgress >= 1.0) {
        nextProgress -= 1.0;
        nextLapLaps += 1;
        // Complete lap - update timings
        const base = INITIAL_DRIVERS_DATA.find(x => x.code === d.code)?.baseLapTime || 87;
        const compoundFactor = d.tyreCompound === 'S' ? -0.4 : d.tyreCompound === 'H' ? 0.3 : 0.0;
        const wearFactor = (d.tyreThermal.wear.fl / 100) * 2.2;
        const wetFactor = this.isWet ? 15.0 : 0.0;
        const actualLapTimeSec = base + compoundFactor + wearFactor + wetFactor + (Math.random() - 0.5) * 0.4;
        
        const m = Math.floor(actualLapTimeSec / 60);
        const s = (actualLapTimeSec % 60).toFixed(3);
        const newLapTimeString = `${m}:${parseFloat(s) < 10 ? '0' : ''}${s}`;

        const s1 = (27 + Math.random() * 1.5).toFixed(3);
        const s2 = (34 + Math.random() * 2.0).toFixed(3);
        const s3 = (23 + Math.random() * 1.2).toFixed(3);

        const currentBestSec = parseFloat(d.lapTiming.bestLapTime.split(':')[0]) * 60 + parseFloat(d.lapTiming.bestLapTime.split(':')[1]);
        const isBest = actualLapTimeSec < currentBestSec;

        nextLapTiming = {
          lapNumber: d.lapTiming.lapNumber + 1,
          lapTime: newLapTimeString,
          lastLapTime: newLapTimeString,
          bestLapTime: isBest ? newLapTimeString : d.lapTiming.bestLapTime,
          sector1: s1,
          sector2: s2,
          sector3: s3,
          sector1State: Math.random() > 0.7 ? 'purple' : 'green',
          sector2State: Math.random() > 0.7 ? 'purple' : 'green',
          sector3State: Math.random() > 0.7 ? 'purple' : 'green'
        };

        // Pit stop trigger if tyre wear is high
        const avgWear = (d.tyreThermal.wear.fl + d.tyreThermal.wear.fr + d.tyreThermal.wear.rl + d.tyreThermal.wear.rr) / 4;
        if ((avgWear > 65 || (this.isWet && d.tyreCompound !== 'I' && d.tyreCompound !== 'W')) && Math.random() > 0.5 && !d.isPitStop) {
          return {
            ...d,
            isPitStop: true,
            pitDurationRemaining: 6.0 + Math.random() * 2.0, // stationary + transit time
            distanceTraveled: 0.0, // box is at start straight
            telemetry: {
              ...d.telemetry,
              speed: 80,
              gear: 2,
              throttle: 20,
              brake: 50,
              rpm: 4000
            }
          };
        }
      }

      // 4. Tyre wear and temperatures simulation
      const isCorner = throttle < 90 || brake > 10;
      const thermalDelta = isCorner ? 22 * safeDt : -8 * safeDt;
      const targetTemp = 100 + thermalDelta + (speed / 300) * 5;
      
      const flTemp = Math.max(70, Math.min(130, d.tyreThermal.temperatures.fl + (targetTemp - d.tyreThermal.temperatures.fl) * 0.1));
      const frTemp = Math.max(70, Math.min(130, d.tyreThermal.temperatures.fr + (targetTemp - d.tyreThermal.temperatures.fr) * 0.12));
      const rlTemp = Math.max(70, Math.min(130, d.tyreThermal.temperatures.rl + (targetTemp - d.tyreThermal.temperatures.rl) * 0.08));
      const rrTemp = Math.max(70, Math.min(130, d.tyreThermal.temperatures.rr + (targetTemp - d.tyreThermal.temperatures.rr) * 0.09));

      // Wear accumulates based on temperature, compound, and strategy
      const wearMultiplier = d.tyreCompound === 'S' ? 0.06 : d.tyreCompound === 'H' ? 0.015 : 0.035;
      const heatFactor = flTemp > 110 ? 1.5 : 1.0;
      
      let strategyWearFactor = 1.0;
      if (driverStrategy.pace === 'ATTACK') strategyWearFactor = 1.8;
      else if (driverStrategy.pace === 'SAVE') strategyWearFactor = 0.7;
      else if (driverStrategy.pace === 'COOL') strategyWearFactor = 0.5;
      
      if (driverStrategy.tyre === 'SAVE') strategyWearFactor *= 0.7;
      else if (driverStrategy.tyre === 'COOL') strategyWearFactor *= 0.5;

      const wearDelta = wearMultiplier * heatFactor * safeDt * strategyWearFactor;

      const flWear = Math.min(100, d.tyreThermal.wear.fl + wearDelta * 0.98);
      const frWear = Math.min(100, d.tyreThermal.wear.fr + wearDelta * 1.02);
      const rlWear = Math.min(100, d.tyreThermal.wear.rl + wearDelta * 0.95);
      const rrWear = Math.min(100, d.tyreThermal.wear.rr + wearDelta * 0.97);

      // ERS charging / harvesting based on strategy
      let ersChange = -0.15; // depletion on throttle
      if (driverStrategy.pace === 'ATTACK') {
        ersChange = -0.45; // faster drain on attack
      } else if (driverStrategy.pace === 'SAVE' || driverStrategy.pace === 'COOL') {
        ersChange = 0.35; // charge even on throttle
      }
      if (brake > 20) ersChange = 0.65; // harvest on braking
      else if (throttle < 30) ersChange = 0.20;
      const nextErs = Math.max(0, Math.min(100, d.telemetry.ersPercent + ersChange * safeDt * 10));

      const updatedTelemetry: CarTelemetry = {
        speed: Math.round(speed),
        rpm: Math.round(rpm + (Math.random() - 0.5) * 150),
        gear,
        throttle,
        brake,
        drs,
        ersPercent: Math.round(nextErs)
      };

      const updatedTyreThermal: TyreThermal = {
        temperatures: { fl: Math.round(flTemp), fr: Math.round(frTemp), rl: Math.round(rlTemp), rr: Math.round(rrTemp) },
        wear: { fl: parseFloat(flWear.toFixed(2)), fr: parseFloat(frWear.toFixed(2)), rl: parseFloat(rlWear.toFixed(2)), rr: parseFloat(rrWear.toFixed(2)) }
      };

      return {
        ...d,
        tyreLaps: nextLapLaps,
        lapTiming: nextLapTiming,
        distanceTraveled: nextProgress,
        telemetry: updatedTelemetry,
        tyreThermal: updatedTyreThermal
      };
    });

    // Recalculate positions & intervals
    const standingScores = this.drivers.map(d => ({
      code: d.code,
      score: d.lapTiming.lapNumber * 1.0 + d.distanceTraveled
    }));
    
    standingScores.sort((a, b) => b.score - a.score);

    this.drivers = this.drivers.map(d => {
      const pos = standingScores.findIndex(s => s.code === d.code) + 1;
      
      let gap = 'LDR';
      let interval = '';

      if (pos > 1) {
        const leader = this.drivers.find(x => standingScores.findIndex(s => s.code === x.code) + 1 === 1);
        const ahead = this.drivers.find(x => standingScores.findIndex(s => s.code === x.code) + 1 === pos - 1);
        
        if (leader && ahead) {
          const leaderScore = standingScores[0].score;
          const selfScore = standingScores.find(s => s.code === d.code)!.score;
          const aheadScore = standingScores[pos - 2].score;

          const leaderDiff = (leaderScore - selfScore) * 88;
          const aheadDiff = (aheadScore - selfScore) * 88;

          gap = `+${leaderDiff.toFixed(1)}s`;
          interval = `+${aheadDiff.toFixed(1)}s`;
        }
      }

      return {
        ...d,
        position: pos,
        gap,
        interval: interval || gap
      };
    });

    return {
      drivers: this.drivers,
      weather: this.weather,
      flag: this.raceFlag,
      lap: this.drivers[0].lapTiming.lapNumber
    };
  }

  public triggerVSC() {
    this.raceFlag = this.raceFlag === 'VSC' ? 'GREEN' : 'VSC';
  }

  public triggerSafetyCar() {
    this.raceFlag = this.raceFlag === 'SAFETY_CAR' ? 'GREEN' : 'SAFETY_CAR';
  }

  public setRaceFlag(flag: RaceControlFlag) {
    this.raceFlag = flag;
  }
}

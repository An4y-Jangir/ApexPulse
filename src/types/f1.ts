export type SectorState = 'purple' | 'green' | 'yellow' | 'none';
export type TyreCompound = 'S' | 'M' | 'H' | 'I' | 'W';

export interface TyreTemperatures {
  fl: number; // Front Left
  fr: number; // Front Right
  rl: number; // Rear Left
  rr: number; // Rear Right
}

export interface TyreWear {
  fl: number;
  fr: number;
  rl: number;
  rr: number;
}

export interface TyreThermal {
  temperatures: TyreTemperatures;
  wear: TyreWear;
}

export interface CarTelemetry {
  speed: number;
  rpm: number;
  gear: number;
  throttle: number; // 0-100
  brake: number; // 0-100
  drs: boolean;
  ersPercent: number; // 0-100
}

export interface LapTiming {
  lapNumber: number;
  lapTime: string;
  lastLapTime: string;
  bestLapTime: string;
  sector1: string;
  sector2: string;
  sector3: string;
  sector1State: SectorState;
  sector2State: SectorState;
  sector3State: SectorState;
}

export interface Driver {
  position: number;
  code: string;
  number: number;
  name: string;
  team: string;
  teamColor: string;
  gap: string; // gap to leader
  interval: string; // gap to car ahead
  tyreCompound: TyreCompound;
  tyreLaps: number;
  telemetry: CarTelemetry;
  tyreThermal: TyreThermal;
  lapTiming: LapTiming;
  distanceTraveled: number; // 0 to 1 progress along track
  isPitStop: boolean;
  pitDurationRemaining: number;
}

export interface Circuit {
  name: string;
  location: string;
  lengthKm: number;
  totalLaps: number;
}

export interface Weather {
  airTemp: number;
  trackTemp: number;
  humidity: number;
  rainProbability: number; // percentage (0-100)
  condition: 'Sunny' | 'Overcast' | 'Drizzle' | 'Heavy Rain';
}

export type RaceControlFlag = 'GREEN' | 'YELLOW' | 'VSC' | 'SAFETY_CAR' | 'RED';

export interface TeamRadioMessage {
  id: string;
  driverCode: string;
  driverName: string;
  teamColor: string;
  timestamp: string;
  message: string;
  type: 'inbound' | 'outbound'; // inbound = driver, outbound = pit wall
}

export interface RaceControlMessage {
  id: string;
  timestamp: string;
  flag: RaceControlFlag;
  message: string;
}

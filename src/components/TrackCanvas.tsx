import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Driver, TyreCompound } from '../types/f1';
import {
  SILVERSTONE_TRACK_MODEL,
  SILVERSTONE_PIT_LANE_MODEL,
  SILVERSTONE_CORNERS,
  SILVERSTONE_DRS_ZONES,
  SILVERSTONE_SECTOR_SPLITS,
  SILVERSTONE_KERB_INTERVALS
} from '../utils/trackGeometry';

interface TrackCanvasProps {
  driversRef: React.MutableRefObject<Driver[]>;
  selectedDriverCode: string;
  setSelectedDriverCode: (code: string) => void;
  mode: 'live' | 'simulation';
  raceFlag: string;
  strategies?: Record<string, { pace: 'ATTACK' | 'PUSH' | 'SAVE' | 'COOL'; tyre: 'DRY' | 'BAL' | 'SAVE' | 'COOL'; nextTyre: TyreCompound }>;
}

export const TrackCanvas: React.FC<TrackCanvasProps> = ({
  driversRef,
  selectedDriverCode,
  setSelectedDriverCode,
  mode,
  raceFlag,
  strategies
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 550 });
  const [hoveredDriver, setHoveredDriver] = useState<string | null>(null);

  // Dynamic bounds for live API coordinates mapping
  const liveBounds = useRef({ minX: -5000, maxX: 5000, minY: -5000, maxY: 5000 });
  
  // Animation clock
  const animTimeRef = useRef<number>(0);

  // Handle Resize & Container Dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({
            width: Math.floor(width),
            height: Math.floor(height)
          });
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Helper coordinate mapper with aspect-ratio preservation
  const getTransform = useCallback(() => {
    const { width, height } = dimensions;
    const padding = 42;

    if (mode === 'simulation') {
      // Bounding box of Silverstone normalized coordinates [0..100]
      const minX = 10;
      const maxX = 94;
      const minY = 10;
      const maxY = 90;

      const trackW = maxX - minX;
      const trackH = maxY - minY;

      const availW = width - 2 * padding;
      const availH = height - 2 * padding;

      const scale = Math.min(availW / trackW, availH / trackH);

      const offsetX = padding + (availW - trackW * scale) / 2 - minX * scale;
      const offsetY = padding + (availH - trackH * scale) / 2 - minY * scale;

      return {
        mapX: (ptX: number) => offsetX + ptX * scale,
        mapY: (ptY: number) => offsetY + ptY * scale,
        scale
      };
    } else {
      const rangeX = liveBounds.current.maxX - liveBounds.current.minX || 1;
      const rangeY = liveBounds.current.maxY - liveBounds.current.minY || 1;
      
      const availW = width - 2 * padding;
      const availH = height - 2 * padding;

      return {
        mapX: (ptX: number) => padding + ((ptX - liveBounds.current.minX) / rangeX) * availW,
        mapY: (ptY: number) => padding + ((ptY - liveBounds.current.minY) / rangeY) * availH,
        scale: 1
      };
    }
  }, [dimensions, mode]);

  // Main Canvas Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      animTimeRef.current += 0.035;
      const t = animTimeRef.current;
      const { width, height } = dimensions;
      const dpr = window.devicePixelRatio || 1;

      // Handle Retina / High-DPI Canvas resolution
      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;

      // 1. Clear with deep OLED background
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#06070B';
      ctx.fillRect(0, 0, width, height);

      // 2. High-Tech Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.018)';
      ctx.lineWidth = 1;
      const gridSize = 45;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Subtle ambient radar sweep / radial center glow
      const radialGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, Math.max(width, height) * 0.6);
      radialGrad.addColorStop(0, 'rgba(6, 182, 212, 0.035)');
      radialGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.015)');
      radialGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, width, height);

      const activeDrivers = driversRef.current;
      const { mapX, mapY } = getTransform();

      // Bounding calculation for live mode
      if (mode === 'live' && activeDrivers.length > 0) {
        const xs = activeDrivers.map(d => d.distanceTraveled).filter(x => x !== 0);
        const ys = activeDrivers.map(d => d.pitDurationRemaining).filter(y => y !== 0);

        if (xs.length > 0 && ys.length > 0) {
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);

          const lerpFactor = 0.03;
          liveBounds.current.minX += (minX - liveBounds.current.minX) * lerpFactor;
          liveBounds.current.maxX += (maxX - liveBounds.current.maxX) * lerpFactor;
          liveBounds.current.minY += (minY - liveBounds.current.minY) * lerpFactor;
          liveBounds.current.maxY += (maxY - liveBounds.current.maxY) * lerpFactor;
        }
      }

      // Flag theme color
      const flagColor = raceFlag === 'GREEN'
        ? '#06B6D4' // Cyber Cyan
        : raceFlag === 'YELLOW'
          ? '#FACC15' // Yellow
          : raceFlag === 'VSC' || raceFlag === 'SAFETY_CAR'
            ? '#FB923C' // Orange
            : '#EF4444'; // Red

      // ======================================================================
      // 3. RENDER TRACK LAYOUT (Simulation Mode)
      // ======================================================================
      if (mode === 'simulation') {
        const splinePts = SILVERSTONE_TRACK_MODEL.splinePoints;

        // A. Faint Circuit Infield Area Fill
        ctx.beginPath();
        splinePts.forEach((pt, i) => {
          const sx = mapX(pt.x);
          const sy = mapY(pt.y);
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(6, 182, 212, 0.012)';
        ctx.fill();

        // B. Dedicated Pit Lane Path
        const pitPts = SILVERSTONE_PIT_LANE_MODEL.splinePoints;
        if (pitPts.length > 0) {
          // Pit Asphalt Bed
          ctx.beginPath();
          pitPts.forEach((pt, i) => {
            const sx = mapX(pt.x);
            const sy = mapY(pt.y);
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          });
          ctx.strokeStyle = '#121622';
          ctx.lineWidth = 10;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();

          // Pit Center Lane (faint dashed)
          ctx.beginPath();
          pitPts.forEach((pt, i) => {
            const sx = mapX(pt.x);
            const sy = mapY(pt.y);
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          });
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Pit Speed Limit 80 Marker
          const pitEntryPt = pitPts[Math.floor(pitPts.length * 0.25)];
          if (pitEntryPt) {
            ctx.fillStyle = '#EAB308';
            ctx.font = 'bold 7px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('PIT 80', mapX(pitEntryPt.x) - 12, mapY(pitEntryPt.y) - 6);
          }
        }

        // C. Track Asphalt Bed (Wide dark charcoal track body)
        ctx.beginPath();
        splinePts.forEach((pt, i) => {
          const sx = mapX(pt.x);
          const sy = mapY(pt.y);
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.closePath();
        ctx.strokeStyle = '#0F131D';
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Track Outer Border Lines (Subtle boundary edges)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 20;
        ctx.stroke();

        // Inner asphalt core
        ctx.strokeStyle = '#141824';
        ctx.lineWidth = 16;
        ctx.stroke();

        // D. Apex & Exit Kerbs (Red & White alternating kerbing)
        SILVERSTONE_KERB_INTERVALS.forEach((kerb) => {
          const sampleCount = 20;
          const kerbWidth = 2.5;
          const offsetDist = 8.5; // Half track width offset

          for (let i = 0; i < sampleCount; i++) {
            const pStart = kerb.start + (i / sampleCount) * (kerb.end - kerb.start);
            const pEnd = kerb.start + ((i + 1) / sampleCount) * (kerb.end - kerb.start);

            const ptA = SILVERSTONE_TRACK_MODEL.getPointAtProgress(pStart);
            const ptB = SILVERSTONE_TRACK_MODEL.getPointAtProgress(pEnd);

            const sideMultiplier = kerb.side === 'left' ? 1 : -1;

            const ax = mapX(ptA.x + ptA.normalX * offsetDist * 0.1 * sideMultiplier);
            const ay = mapY(ptA.y + ptA.normalY * offsetDist * 0.1 * sideMultiplier);
            const bx = mapX(ptB.x + ptB.normalX * offsetDist * 0.1 * sideMultiplier);
            const by = mapY(ptB.y + ptB.normalY * offsetDist * 0.1 * sideMultiplier);

            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);

            const isRed = i % 2 === 0;
            ctx.strokeStyle = isRed ? '#EF4444' : '#F8FAFC';
            ctx.lineWidth = kerbWidth;
            ctx.lineCap = 'butt';
            ctx.stroke();
          }
        });

        // E. Silk-Smooth Center Racing Line
        ctx.beginPath();
        splinePts.forEach((pt, i) => {
          const sx = mapX(pt.x);
          const sy = mapY(pt.y);
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.closePath();

        // Neon Glow
        ctx.strokeStyle = flagColor;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = flagColor;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset

        // F. DRS Zones (Wellington & Hangar Straights) with directional animated flow
        SILVERSTONE_DRS_ZONES.forEach((zone) => {
          const stepCount = 40;
          const drsPts: Array<{ x: number; y: number }> = [];
          for (let i = 0; i <= stepCount; i++) {
            const p = zone.startProgress + (i / stepCount) * (zone.endProgress - zone.startProgress);
            const pt = SILVERSTONE_TRACK_MODEL.getPointAtProgress(p);
            drsPts.push({ x: mapX(pt.x), y: mapY(pt.y) });
          }

          // Glowing Green Zone
          ctx.beginPath();
          drsPts.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });

          ctx.strokeStyle = '#22C55E';
          ctx.lineWidth = 4;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#22C55E';
          ctx.stroke();

          // Animated Forward Dash Pulses
          ctx.strokeStyle = '#86EFAC';
          ctx.lineWidth = 4.5;
          ctx.setLineDash([8, 14]);
          ctx.lineDashOffset = -t * 22;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;

          // DRS Zone Tag
          const startPt = SILVERSTONE_TRACK_MODEL.getPointAtProgress(zone.startProgress);
          const sx = mapX(startPt.x);
          const sy = mapY(startPt.y);

          ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
          ctx.beginPath();
          ctx.roundRect(sx - 16, sy - 18, 32, 12, 2);
          ctx.fill();

          ctx.fillStyle = '#06070B';
          ctx.font = 'bold 7.5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(zone.id, sx, sy - 9.5);
        });

        // G. Sector Split Lines & Badges
        SILVERSTONE_SECTOR_SPLITS.forEach((sec) => {
          if (sec.progress < 1.0) {
            const pt = SILVERSTONE_TRACK_MODEL.getPointAtProgress(sec.progress);
            const cx = mapX(pt.x);
            const cy = mapY(pt.y);
            const nx = pt.normalX * 12;
            const ny = pt.normalY * 12;

            // Split line perpendicular to track
            ctx.beginPath();
            ctx.moveTo(cx - nx, cy - ny);
            ctx.lineTo(cx + nx, cy + ny);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Sector label pill
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(cx + nx * 1.4 - 18, cy + ny * 1.4 - 7, 36, 14, 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#38BDF8';
            ctx.font = 'bold 7px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`SEC ${sec.sector}`, cx + nx * 1.4, cy + ny * 1.4 + 3);
          }
        });

        // H. Speed Trap Marker (ST on Hangar Straight)
        const speedTrapPt = SILVERSTONE_TRACK_MODEL.getPointAtProgress(0.76);
        if (speedTrapPt) {
          const stX = mapX(speedTrapPt.x);
          const stY = mapY(speedTrapPt.y);
          ctx.fillStyle = 'rgba(234, 179, 8, 0.9)';
          ctx.beginPath();
          ctx.roundRect(stX + 8, stY - 6, 16, 12, 2);
          ctx.fill();
          ctx.fillStyle = '#06070B';
          ctx.font = 'bold 7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('ST', stX + 16, stY + 2.5);
        }

        // I. Start / Finish Line (Hamilton Straight - Progress 0.0)
        const sfPt = SILVERSTONE_TRACK_MODEL.getPointAtProgress(0.0);
        const sfcX = mapX(sfPt.x);
        const sfcY = mapY(sfPt.y);
        const sfnX = sfPt.normalX * 11;
        const sfnY = sfPt.normalY * 11;

        // Checkered hatch bar
        ctx.beginPath();
        ctx.moveTo(sfcX - sfnX, sfcY - sfnY);
        ctx.lineTo(sfcX + sfnX, sfcY + sfnY);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // S/F Tag
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 7.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('S/F', sfcX - sfnX * 1.6, sfcY - sfnY * 1.6 + 3);

        // J. Corner Labels & Badges
        SILVERSTONE_CORNERS.forEach((c) => {
          const pt = SILVERSTONE_TRACK_MODEL.getPointAtProgress(c.progress);
          const x = mapX(pt.x);
          const y = mapY(pt.y);

          const lx = x + c.labelOffset.x;
          const ly = y + c.labelOffset.y;

          // Connecting pin line
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(lx, ly);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Corner apex dot
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.fill();

          // Label text
          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`T${c.number} ${c.name}`, lx, ly);
        });

      } else {
        // ====================================================================
        // LIVE MODE - Trail from real GPS telemetry coordinates
        // ====================================================================
        ctx.beginPath();
        activeDrivers.forEach((d, idx) => {
          if (d.distanceTraveled !== 0 && d.pitDurationRemaining !== 0) {
            const x = mapX(d.distanceTraveled);
            const y = mapY(d.pitDurationRemaining);
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        });
        
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // ======================================================================
      // 4. RENDER DRIVER CAR MARKERS & TELEMETRY PUFFS
      // ======================================================================
      activeDrivers.forEach((d) => {
        let x = 0;
        let y = 0;
        let headingAngle = 0;

        if (mode === 'simulation') {
          // Precise spline position lookup from continuous distance progress
          const pt = SILVERSTONE_TRACK_MODEL.getPointAtProgress(d.distanceTraveled);
          x = mapX(pt.x);
          y = mapY(pt.y);
          headingAngle = Math.atan2(pt.tangentY, pt.tangentX);
        } else {
          if (d.distanceTraveled === 0 || d.pitDurationRemaining === 0) return;
          x = mapX(d.distanceTraveled);
          y = mapY(d.pitDurationRemaining);
        }

        const isSelected = d.code === selectedDriverCode;
        const isHovered = d.code === hoveredDriver;
        const driverColor = d.teamColor || '#FFFFFF';

        // A. Selected Driver Motion Trail & Radar Pulse
        if (isSelected) {
          // Motion ghost trail (last few progress steps)
          if (mode === 'simulation') {
            for (let tr = 1; tr <= 6; tr++) {
              const trailProgress = (d.distanceTraveled - tr * 0.008 + 1) % 1;
              const trailPt = SILVERSTONE_TRACK_MODEL.getPointAtProgress(trailProgress);
              const trX = mapX(trailPt.x);
              const trY = mapY(trailPt.y);

              ctx.beginPath();
              ctx.arc(trX, trY, Math.max(1, 5 - tr * 0.7), 0, Math.PI * 2);
              ctx.fillStyle = `${driverColor}${Math.floor((1 - tr / 7) * 40).toString(16).padStart(2, '0')}`;
              ctx.fill();
            }
          }

          // Pulsing focus ring
          const pulseRadius = 11 + Math.sin(t * 3) * 3.5;
          ctx.beginPath();
          ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
          ctx.strokeStyle = driverColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = `${driverColor}15`;
          ctx.fill();
        }

        // B. ERS Battery Strategy Ring
        const driverStrategy = strategies?.[d.code];
        if (driverStrategy) {
          if (driverStrategy.pace === 'ATTACK') {
            ctx.beginPath();
            ctx.arc(x, y, isHovered || isSelected ? 9.5 : 8, 0, Math.PI * 2);
            ctx.strokeStyle = '#F97316'; // Orange ERS Deploy
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else if (driverStrategy.pace === 'SAVE' || driverStrategy.pace === 'COOL') {
            ctx.beginPath();
            ctx.arc(x, y, isHovered || isSelected ? 9.5 : 8, 0, Math.PI * 2);
            ctx.strokeStyle = '#22C55E'; // Green ERS Harvest
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }

        // C. DRS Active Halo
        if (d.telemetry.drs) {
          ctx.beginPath();
          ctx.arc(x, y, isHovered || isSelected ? 9.5 : 8, 0, Math.PI * 2);
          ctx.strokeStyle = '#22C55E';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#22C55E';
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // D. Main Driver Puck
        const puckRadius = isHovered || isSelected ? 6.5 : 5.2;

        // Outer crisp rim
        ctx.beginPath();
        ctx.arc(x, y, puckRadius, 0, Math.PI * 2);
        ctx.fillStyle = driverColor;
        ctx.fill();

        ctx.strokeStyle = '#06070B';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Inner Core Dot
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Directional Heading Nose Indicator
        if (mode === 'simulation') {
          const noseLen = puckRadius + 3;
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(headingAngle) * (puckRadius - 1), y + Math.sin(headingAngle) * (puckRadius - 1));
          ctx.lineTo(x + Math.cos(headingAngle) * noseLen, y + Math.sin(headingAngle) * noseLen);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // E. Driver Code Tag
        ctx.fillStyle = isSelected || isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)';
        ctx.font = isSelected || isHovered ? 'bold 9.5px monospace' : '8.5px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(d.code, x + 9, y + 3);

        // F. Pitstop Indicator Badge
        if (d.isPitStop) {
          ctx.fillStyle = '#EAB308';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('P', x, y - 9);
        }

        // G. Floating Glassmorphic HUD Telemetry Card on Hover / Selection
        if (isSelected || isHovered) {
          const tooltipW = 76;
          const tooltipH = 34;
          const tx = Math.max(10, Math.min(width - tooltipW - 10, x - tooltipW / 2));
          const ty = Math.max(10, y - 46);

          // Card Background
          ctx.fillStyle = 'rgba(6, 7, 11, 0.92)';
          ctx.strokeStyle = `${driverColor}60`;
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.roundRect(tx, ty, tooltipW, tooltipH, 4);
          ctx.fill();
          ctx.stroke();

          // Top Accent Line
          ctx.fillStyle = driverColor;
          ctx.fillRect(tx + 4, ty + 1, tooltipW - 8, 1.5);

          // Speed display
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 8.5px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`${d.telemetry.speed} KM/H`, tx + 6, ty + 13);

          // Gear & RPM
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.font = '7px monospace';
          ctx.fillText(`GEAR ${d.telemetry.gear} • ${Math.round(d.telemetry.rpm)} RPM`, tx + 6, ty + 22);

          // Throttle / Brake mini bars
          const barW = tooltipW - 12;
          const throttleW = (d.telemetry.throttle / 100) * barW;
          const brakeW = (d.telemetry.brake / 100) * barW;

          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.fillRect(tx + 6, ty + 26, barW, 3);

          if (throttleW > 0) {
            ctx.fillStyle = '#22C55E'; // Green throttle
            ctx.fillRect(tx + 6, ty + 26, throttleW, 3);
          } else if (brakeW > 0) {
            ctx.fillStyle = '#EF4444'; // Red brake
            ctx.fillRect(tx + 6, ty + 26, brakeW, 3);
          }
        }
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [dimensions, selectedDriverCode, hoveredDriver, mode, raceFlag, driversRef, getTransform, strategies]);

  // Click handler to select driver
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const activeDrivers = driversRef.current;
    const { mapX, mapY } = getTransform();

    let clickedDriver: Driver | null = null;
    let minDistance = 20; // 20px hit tolerance

    activeDrivers.forEach((d) => {
      let x = 0;
      let y = 0;

      if (mode === 'simulation') {
        const pt = SILVERSTONE_TRACK_MODEL.getPointAtProgress(d.distanceTraveled);
        x = mapX(pt.x);
        y = mapY(pt.y);
      } else {
        if (d.distanceTraveled === 0 || d.pitDurationRemaining === 0) return;
        x = mapX(d.distanceTraveled);
        y = mapY(d.pitDurationRemaining);
      }

      const dist = Math.hypot(clickX - x, clickY - y);
      if (dist < minDistance) {
        minDistance = dist;
        clickedDriver = d;
      }
    });

    if (clickedDriver) {
      setSelectedDriverCode((clickedDriver as Driver).code);
    }
  };

  // Hover detection
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const activeDrivers = driversRef.current;
    const { mapX, mapY } = getTransform();

    let hoverCode: string | null = null;
    let minDistance = 16;

    activeDrivers.forEach((d) => {
      let x = 0;
      let y = 0;

      if (mode === 'simulation') {
        const pt = SILVERSTONE_TRACK_MODEL.getPointAtProgress(d.distanceTraveled);
        x = mapX(pt.x);
        y = mapY(pt.y);
      } else {
        if (d.distanceTraveled === 0 || d.pitDurationRemaining === 0) return;
        x = mapX(d.distanceTraveled);
        y = mapY(d.pitDurationRemaining);
      }

      const dist = Math.hypot(mouseX - x, mouseY - y);
      if (dist < minDistance) {
        minDistance = dist;
        hoverCode = d.code;
      }
    });

    setHoveredDriver(hoverCode);
  };

  const handleMouseLeave = () => {
    setHoveredDriver(null);
  };

  return (
    <div ref={containerRef} className="w-full h-full min-h-[350px] relative overflow-hidden bg-[#06070B] rounded select-none">
      {/* High-tech scanlines overlay */}
      <div className="absolute inset-0 pointer-events-none scanlines opacity-[0.03]" />

      {/* Canvas Element with dynamic high-DPI scaling */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleMouseLeave}
        className="block w-full h-full cursor-crosshair"
      />
    </div>
  );
};

// app/components/ElevationChart.tsx
'use client';
import React, { useRef, useState } from 'react';
import type { ElevationPoint } from '../hooks/useElevation';

const ElevationChart: React.FC<{ data: ElevationPoint[]; originLabel?: string; destinationLabel?: string }> = ({
    data,
    originLabel,
    destinationLabel,
}) => {
    const width = 300;
    const height = 60;
    const paddingY = 5;
    const plotHeight = height - 2 * paddingY;

    const svgRef = useRef<SVGSVGElement | null>(null);
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    if (!data || data.length === 0) return null;

    const minElev = Math.min(...data.map(d => d.elevation));
    const maxElev = Math.max(...data.map(d => d.elevation));
    const totalDist = Math.max(0, data[data.length - 1].distance);

    let ascent = 0;
    let descent = 0;
    for (let i = 1; i < data.length; i++) {
        const delta = data[i].elevation - data[i - 1].elevation;
        if (delta > 0) ascent += delta;
        else descent += -delta;
    }
    const totalKm = totalDist > 0 ? totalDist / 1000 : null;

    const yForElev = (elev: number) => {
        const denom = (maxElev - minElev) || 1;
        const t = (elev - minElev) / denom;
        return height - paddingY - t * plotHeight;
    };

    let pathD = `M0,${height} `;
    for (const p of data) {
        const x = totalDist > 0 ? (p.distance / totalDist) * width : 0;
        const y = yForElev(p.elevation);
        pathD += `L${x},${y} `;
    }
    pathD += `L${width},${height} Z`;

    const findNearestIndex = (targetDist: number) => {
        // data distances are monotonic
        let lo = 0;
        let hi = data.length - 1;
        while (lo < hi) {
            const mid = Math.floor((lo + hi) / 2);
            if ((data[mid].distance ?? 0) < targetDist) lo = mid + 1;
            else hi = mid;
        }
        const i = lo;
        if (i <= 0) return 0;
        const prev = i - 1;
        const di = Math.abs((data[i].distance ?? 0) - targetDist);
        const dp = Math.abs((data[prev].distance ?? 0) - targetDist);
        return dp <= di ? prev : i;
    };

    const handleMouseMove: React.MouseEventHandler<SVGSVGElement> = (e) => {
        if (!svgRef.current || data.length === 0 || totalDist <= 0) return;
        const rect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const clampedX = Math.max(0, Math.min(width, (x / rect.width) * width));
        const distAtX = (clampedX / width) * totalDist;
        setHoverIndex(findNearestIndex(distAtX));
    };

    const handleMouseLeave: React.MouseEventHandler<SVGSVGElement> = () => {
        setHoverIndex(null);
    };

    return (
        <div className="mt-2 bg-white p-2 rounded border border-gray-200 shadow-inner">
            <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-gray-500 mb-1">
                <span>Min: {Math.round(minElev)}m</span>
                <span>Max: {Math.round(maxElev)}m</span>
                <span>↑ {Math.round(ascent)}m</span>
                <span>↓ {Math.round(descent)}m</span>
                {totalKm !== null ? <span>{totalKm.toFixed(0)}km</span> : null}
            </div>
            <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-16 bg-gray-50 rounded overflow-hidden"
                preserveAspectRatio="none"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <path d={pathD} fill="rgba(220, 38, 38, 0.2)" stroke="#DC2626" strokeWidth="1.5" />
                {hoverIndex !== null && data[hoverIndex] ? (() => {
                    const p = data[hoverIndex];
                    const x = totalDist > 0 ? (p.distance / totalDist) * width : 0;
                    const y = yForElev(p.elevation);
                    const km = p.distance / 1000;
                    const label = `${km.toFixed(1)} km · ${Math.round(p.elevation)} m`;

                    // Tooltip box positioning (clamped)
                    const boxW = 110;
                    const boxH = 14;
                    const boxX = Math.max(0, Math.min(width - boxW, x - boxW / 2));
                    const boxY = Math.max(0, y - 18);

                    return (
                        <g>
                            <line x1={x} y1={0} x2={x} y2={height} stroke="#9CA3AF" strokeWidth={0.7} strokeDasharray="2,2" />
                            <circle cx={x} cy={y} r={2.4} fill="#DC2626" stroke="#FFFFFF" strokeWidth={1} />
                            <rect x={boxX} y={boxY} width={boxW} height={boxH} rx={3} fill="#FFFFFF" stroke="#E5E7EB" />
                            <text x={boxX + 6} y={boxY + 10} fontSize={8} fill="#374151">
                                {label}
                            </text>
                        </g>
                    );
                })() : null}
            </svg>
            <div className="mt-1 flex items-center justify-between gap-2 text-[9px] text-gray-400">
                <span className="truncate">{originLabel || ''}</span>
                <span className="truncate text-right">{destinationLabel || ''}</span>
            </div>
        </div>
    );
};

export default ElevationChart;
// app/components/ElevationChart.tsx
'use client';
import React from 'react';

const ElevationChart: React.FC<{ data: { distance: number, elevation: number }[] }> = ({ data }) => {
    if (!data || data.length === 0) return null;

    const minElev = Math.min(...data.map(d => d.elevation));
    const maxElev = Math.max(...data.map(d => d.elevation));
    const totalDist = data[data.length - 1].distance;
    
    const width = 300;
    const height = 60;
    let pathD = `M0,${height} `;
    
    data.forEach(d => {
        const x = (d.distance / totalDist) * width;
        const y = height - ((d.elevation - minElev) / (maxElev - minElev || 1)) * (height - 10) - 5;
        pathD += `L${x},${y} `;
    });
    pathD += `L${width},${height} Z`;

    return (
        <div className="mt-2 bg-white p-2 rounded border border-gray-200 shadow-inner">
            <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                <span>Min: {Math.round(minElev)}m</span>
                <span>Max: {Math.round(maxElev)}m</span>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16 bg-gray-50 rounded overflow-hidden">
                <path d={pathD} fill="rgba(220, 38, 38, 0.2)" stroke="#DC2626" strokeWidth="1.5" />
            </svg>
            <p className="text-[9px] text-center text-gray-400 mt-1">Perfil de Altitud de la Etapa</p>
        </div>
    );
};

export default ElevationChart;
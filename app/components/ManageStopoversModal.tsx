'use client';
import { useState, useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';

interface ManageStopoversModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (stopovers: string[]) => void;
    dayIndex: number;
    dayInfo: {
        from: string;
        to: string;
        date: string;
    };
    currentStopovers: string[];
    t: (key: string) => string;
}

export default function ManageStopoversModal({
    isOpen, onClose, onConfirm, dayIndex, dayInfo, currentStopovers, t
}: ManageStopoversModalProps) {
    const [stopovers, setStopovers] = useState<string[]>(currentStopovers);
    const [tempStopover, setTempStopover] = useState('');
    const stopoverRef = useRef<google.maps.places.Autocomplete | null>(null);

    if (!isOpen) return null;

    const handleAddStopover = () => {
        if (!tempStopover.trim()) return;
        setStopovers([...stopovers, tempStopover]);
        setTempStopover('');
    };

    const handleRemoveStopover = (index: number) => {
        setStopovers(stopovers.filter((_, i) => i !== index));
    };

    const onPlaceChanged = () => {
        const place = stopoverRef.current?.getPlace();
        if (place && place.formatted_address) {
            setTempStopover(place.formatted_address);
        }
    };

    const handleConfirm = () => {
        onConfirm(stopovers);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            🚩 Escalas del Día {dayIndex + 1}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            <span className="font-semibold">{dayInfo.from}</span> ➝ <span className="font-semibold">{dayInfo.to}</span>
                        </p>
                        <p className="text-xs text-gray-500">{dayInfo.date}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-sm text-blue-800 font-medium">
                        💡 Las escalas son lugares que quieres visitar en esta etapa sin pernoctar. 
                        Se añadirán a la ruta pero no crearán días adicionales.
                    </p>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700">Añadir Escala</label>
                    <div className="flex gap-2">
                        <Autocomplete 
                            onLoad={ref => stopoverRef.current = ref} 
                            onPlaceChanged={onPlaceChanged}
                            className="flex-1"
                        >
                            <input 
                                type="text" 
                                value={tempStopover}
                                onChange={(e) => setTempStopover(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStopover())}
                                placeholder="🔍 Ej: Barco de Ávila"
                                className="w-full px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </Autocomplete>
                        <button 
                            onClick={handleAddStopover}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold"
                        >
                            ➕ Añadir
                        </button>
                    </div>
                </div>

                {stopovers.length > 0 ? (
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Escalas de este día ({stopovers.length})</label>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {stopovers.map((stopover, index) => (
                                <div key={index} className="flex items-center gap-2 bg-blue-50 border border-blue-200 p-3 rounded">
                                    <span className="text-xl">🚩</span>
                                    <span className="flex-1 font-medium text-gray-800">{stopover}</span>
                                    <button 
                                        onClick={() => handleRemoveStopover(index)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded px-2 py-1 text-sm font-bold"
                                    >
                                        🗑️ Eliminar
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400 italic">
                        No hay escalas añadidas a este día
                    </div>
                )}

                <div className="flex gap-3 justify-end pt-4 border-t">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 font-medium"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold"
                    >
                        ✅ Confirmar Escalas
                    </button>
                </div>
            </div>
        </div>
    );
}

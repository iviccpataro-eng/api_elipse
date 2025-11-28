// src/components/AlarmPanel.jsx
import React from "react";
import AlarmRow, { AlarmRowHeader } from "./AlarmRow";

export default function AlarmPanel({ alarms = [], open, onClose, onAck, onClear, onClearRecognized }) {
    if (!open) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl border-t z-50">

            {/* Cabeçalho fixo */}
            <div className="p-3 border-b bg-white sticky top-0 z-30 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Alarmes Ativos</h2>

                <div className="flex items-center gap-2">
                    <button onClick={onClearRecognized} className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">
                        Limpar reconhecidos
                    </button>

                    <button onClick={onClose} className="px-3 py-1 bg-red-50 rounded hover:bg-red-100 text-sm">
                        Fechar
                    </button>
                </div>
            </div>

            {/* Lista rolável */}
            <div className="max-h-64 overflow-y-auto px-2 pb-4">
                <AlarmRowHeader />
                {alarms.map(a => (
                    <AlarmRow key={`${a.tag}-${a.timestampIn}`} alarm={a} onAck={onAck} onClear={onClear} />
                ))}
            </div>
        </div>

    );
}

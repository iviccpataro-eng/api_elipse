// src/components/AlarmPanel.jsx
import React from "react";
import AlarmRow from "./AlarmRow";

export default function AlarmPanel({ alarms = [], open, onClose, onAck, onClear, onClearRecognized }) {
    if (!open) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t
                    rounded-t-2xl shadow-2xl p-4 h-80 overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">Alarmes Ativos</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onClearRecognized}
                        className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                    >
                        Limpar reconhecidos
                    </button>
                    <button onClick={onClose} className="px-3 py-1 bg-red-50 rounded hover:bg-red-100 text-sm">
                        Fechar
                    </button>
                </div>
            </div>

            {alarms.length === 0 ? (
                <div className="text-gray-500 text-center py-8">Nenhum alarme ativo.</div>
            ) : (
                <div className="space-y-3">
                    {alarms.map((a) => (
                        <AlarmRow key={`${a.tag}::${a.name}`} alarm={a} onAck={onAck} onClear={onClear} />
                    ))}
                </div>
            )}
        </div>
    );
}

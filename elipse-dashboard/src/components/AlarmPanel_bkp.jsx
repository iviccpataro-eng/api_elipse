import React from "react";
import { X, AlertTriangle, Clock } from "lucide-react";

export default function AlarmPanel({ alarms, open, onClose }) {
    if (!open) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t 
                        rounded-t-2xl shadow-2xl p-4 h-80 overflow-y-auto z-40">

            <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold">Alarmes Ativos</h2>
                <button onClick={onClose}>
                    <X className="w-6 h-6 text-gray-600" />
                </button>
            </div>

            {alarms.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhum alarme ativo.</p>
            ) : (
                <ul className="space-y-3">
                    {alarms.map((a, index) => (
                        <li key={index} className="p-3 rounded-xl bg-red-50 border border-red-200">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">{a.name}</span>
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>

                            <div className="flex items-center text-xs text-gray-600 mt-1">
                                <Clock className="w-4 h-4 mr-1" />
                                Entrada: {a.timestamp.replace("T", " ")}
                            </div>

                            <div className="text-xs text-gray-600">
                                {a.tag}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

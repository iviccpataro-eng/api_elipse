import React from "react";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

const severityColors = {
    0: "text-yellow-500",
    1: "text-orange-500",
    2: "text-red-500",
    3: "text-red-700 font-bold"
};

export default function AlarmList({ alarms = [] }) {
    return (
        <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Alarmes</h3>

            {alarms.length === 0 && (
                <p className="text-sm text-gray-400 italic">Nenhum alarme configurado.</p>
            )}

            <ul className="space-y-2">
                {alarms.map((a, index) => {
                    const [name, active, level, start, end] = a;

                    return (
                        <li
                            key={index}
                            className={`flex flex-col p-3 rounded-xl border shadow-sm ${active ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-medium">{name}</span>

                                {active ? (
                                    <AlertTriangle
                                        className={`w-5 h-5 ${severityColors[level]}`}
                                    />
                                ) : (
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                )}
                            </div>

                            <div className="flex items-center text-xs text-gray-600 mt-1">
                                <Clock className="w-4 h-4 mr-1" />
                                {start
                                    ? `Entrada: ${start.replace("T", " ")}`
                                    : "Aguardando entrada"}
                            </div>

                            {!active && end && (
                                <div className="flex items-center text-xs text-gray-600">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {`Saída: ${end.replace("T", " ")}`}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

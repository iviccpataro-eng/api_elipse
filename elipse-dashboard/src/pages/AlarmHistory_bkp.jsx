import React, { useEffect, useState } from "react";
import { Clock, CheckCircle, AlertTriangle } from "lucide-react";

const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function AlarmHistory() {
    const [history, setHistory] = useState([]);
    const [filter, setFilter] = useState("all"); // all, active, cleared

    useEffect(() => {
        fetch(API_BASE + "/alarms/history")
            .then((res) => res.json())
            .then((data) => setHistory(data));
    }, []);

    const filtered = history.filter((a) => {
        if (filter === "active") return a.cleared === null;
        if (filter === "cleared") return a.cleared !== null;
        return true;
    });

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Histórico de Alarmes</h1>

            <div className="flex gap-3 mb-4">
                <button
                    className={`px-3 py-1 rounded ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                    onClick={() => setFilter("all")}
                >
                    Todos
                </button>
                <button
                    className={`px-3 py-1 rounded ${filter === "active" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                    onClick={() => setFilter("active")}
                >
                    Ativos
                </button>
                <button
                    className={`px-3 py-1 rounded ${filter === "cleared" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                    onClick={() => setFilter("cleared")}
                >
                    Encerrados
                </button>
            </div>

            <ul className="space-y-4">
                {filtered.map((a, i) => (
                    <li key={i} className="p-4 rounded-xl bg-white shadow border">
                        <div className="flex justify-between">
                            <div>
                                <h3 className="font-semibold">{a.name}</h3>
                                <p className="text-sm text-gray-500">{a.tag}</p>
                            </div>
                            <AlertTriangle className="text-red-600" />
                        </div>

                        <div className="mt-2 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Entrada: {a.entered.replace("T", " ")}
                            </div>
                            {a.cleared && (
                                <div className="flex items-center gap-2 mt-1">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    Saída: {a.cleared.replace("T", " ")}
                                </div>
                            )}
                        </div>

                        {a.ack && (
                            <div className="text-xs text-blue-600 mt-1">✔ Reconhecido</div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

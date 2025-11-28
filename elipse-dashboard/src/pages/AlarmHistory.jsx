// src/pages/AlarmHistory.jsx
import React, { useEffect, useState } from "react";
import { Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { apiFetch } from "../utils/apiFetch";

export default function AlarmHistory() {
    const [history, setHistory] = useState([]);
    const [filter, setFilter] = useState("all"); // all, active, cleared
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        async function loadHistory() {
            try {
                setLoading(true);

                const data = await apiFetch("/alarms/history");

                // Caso o retorno não seja um array
                if (!Array.isArray(data)) {
                    setErro("Dados inválidos recebidos da API.");
                    setHistory([]);
                    return;
                }

                setHistory(data);
                setErro("");

            } catch (err) {
                setErro(err.message || "Falha ao carregar histórico de alarmes");
            } finally {
                setLoading(false);
            }
        }

        loadHistory();
    }, []);

    const filtered = history.filter((a) => {
        if (filter === "active") return a.cleared === null;
        if (filter === "cleared") return a.cleared !== null;
        return true;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Carregando histórico de alarmes...
            </div>
        );
    }

    if (erro) {
        return (
            <div className="p-6 text-center text-red-500 font-medium">
                {erro}
            </div>
        );
    }

    return (
        <div className="p-6 pt-20">
            <h1 className="text-2xl font-bold mb-4">Histórico de Alarmes</h1>

            {/* Filtros */}
            <div className="flex gap-3 mb-4">
                <button
                    className={`px-3 py-1 rounded ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200"
                        }`}
                    onClick={() => setFilter("all")}
                >
                    Todos
                </button>

                <button
                    className={`px-3 py-1 rounded ${filter === "active" ? "bg-blue-600 text-white" : "bg-gray-200"
                        }`}
                    onClick={() => setFilter("active")}
                >
                    Ativos
                </button>

                <button
                    className={`px-3 py-1 rounded ${filter === "cleared" ? "bg-blue-600 text-white" : "bg-gray-200"
                        }`}
                    onClick={() => setFilter("cleared")}
                >
                    Encerrados
                </button>
            </div>

            {/* Lista */}
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
                                Entrada: {a.entered?.replace("T", " ")}
                            </div>

                            {a.cleared && (
                                <div className="flex items-center gap-2 mt-1">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    Saída: {a.cleared.replace("T", " ")}
                                </div>
                            )}
                        </div>

                        {a.ack && (
                            <div className="text-xs text-blue-600 mt-1">
                                ✔ Reconhecido
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

// src/components/VariableCard.jsx
import React, { useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function VariableCard({ variavel, equipamentoTag }) {
    if (!Array.isArray(variavel) || variavel.length < 2) return null;

    const [tipo, nome, valorInicialRaw, unidade, hasGraphRaw, nominalRaw] = variavel;
    const mostrar = hasGraphRaw === true || hasGraphRaw === "true";

    // Garantir números
    const valorInicial = isNaN(parseFloat(valorInicialRaw)) ? 0 : parseFloat(valorInicialRaw);
    const nominal = isNaN(parseFloat(nominalRaw)) ? null : parseFloat(nominalRaw);

    const [valor, setValor] = useState(valorInicial);

    const API_BASE =
        import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

    const enviarComando = async (novoValor) => {
        const token = localStorage.getItem("authToken");
        try {
            const res = await fetch(`${API_BASE}/write`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    tag: equipamentoTag,
                    variavel: nome,
                    valor: novoValor,
                }),
            });
            const data = await res.json();
            console.log("📤 Retorno write:", data);
            if (data.ok) setValor(novoValor);
            else alert("Erro ao enviar comando: " + (data.erro || "Desconhecido"));
        } catch (err) {
            alert("Falha na comunicação com o servidor.");
        }
    };

    // 🧮 Gráfico semicircular aprimorado (com correção de escala e visibilidade)
    const ArcGraph = ({ valor, nominal, mostrar }) => {
        // não renderiza se for explicitamente falso
        if (!mostrar) return null;

        // se nominal ausente ou <=0 → não mostra arco
        if (!nominal || nominal <= 0 || typeof valor === "undefined") {
            return null;
        }

        const min = nominal * 0.8;
        const max = nominal * 1.2;
        const dentro = valor >= min && valor <= max;

        // percentual normalizado
        const percent = ((valor - min) / (max - min)) * 100;
        const bounded = Math.min(Math.max(percent, 0), 100);

        const data = {
            datasets: [
                {
                    // inversão resolve arco invertido
                    data: [100 - bounded, bounded],
                    backgroundColor: [
                        "rgba(229,231,235,0.45)",
                        dentro ? "#16a34a" : "#ef4444",
                    ],
                    borderWidth: 0,
                    cutout: "72%",
                    circumference: 180,
                    rotation: 270,
                },
            ],
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
        };

        return (
            <div className="relative w-28 h-14 mx-auto mb-2">
                <Doughnut data={data} options={options} />
                <div className="absolute inset-0 flex flex-col items-center justify-center -translate-y-1">
                    <div className="text-sm font-semibold text-gray-700">
                        {valor.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400 -mt-1">({nominal})</div>
                </div>
            </div>
        );
    };


    // Render por tipo
    switch (tipo) {
        case "AI": {
            const temNominal = nominal && nominal > 0;
            const min = temNominal ? nominal * 0.8 : null;
            const max = temNominal ? nominal * 1.2 : null;
            const dentroDoRange = temNominal && valor >= min && valor <= max;

            return (
                <div className="bg-white rounded-2xl shadow p-4 flex flex-col items-center text-center hover:shadow-md transition">
                    <div className="text-gray-600 text-sm mb-2">{nome}</div>

                    {temNominal && mostrar ? (
                        <ArcGraph valor={valor} nominal={nominal} mostrar={mostrar} />
                    ) : (
                        <div className="h-14 mb-2" />
                    )}

                    <div
                        className={`text-2xl font-semibold ${temNominal ? (dentroDoRange ? "text-green-600" : "text-red-600") : "text-gray-800"
                            }`}
                    >
                        {valor.toFixed(2)}
                        <span className="text-sm text-gray-500 ml-1">{unidade}</span>
                    </div>
                </div>
            );
        }

        case "AO":
            return (
                <div className="bg-white rounded-2xl shadow p-4 text-center flex flex-col items-center hover:shadow-md transition">
                    <div className="text-gray-600 text-sm mb-2">{nome}</div>
                    <input
                        type="number"
                        className="border rounded-md text-center p-1 w-20"
                        defaultValue={valor}
                        onBlur={(e) => {
                            const v = parseFloat(e.target.value);
                            if (!isNaN(v)) enviarComando(v);
                        }}
                    />
                    <span className="text-xs text-gray-400 mt-1">{unidade}</span>
                </div>
            );

        case "DI": {
            const [onLabel, offLabel] = (unidade || "LIGADO/DESLIGADO").split("/");
            return (
                <div className="bg-white rounded-2xl shadow p-4 text-center hover:shadow-md transition">
                    <div className="text-gray-600 text-sm mb-2">{nome}</div>
                    <div className={`text-lg font-semibold ${valor ? "text-green-600" : "text-red-600"}`}>
                        {valor ? onLabel : offLabel}
                    </div>
                </div>
            );
        }

        case "DO": {
            const [onDO, offDO] = (unidade || "LIGAR/DESLIGAR").split("/");
            return (
                <div className="bg-white rounded-2xl shadow p-4 text-center hover:shadow-md transition">
                    <div className="text-gray-600 text-sm mb-3">{nome}</div>
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={() => enviarComando(true)}
                            className={`px-3 py-1 rounded-md ${valor ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"}`}
                        >
                            {onDO}
                        </button>
                        <button
                            onClick={() => enviarComando(false)}
                            className={`px-3 py-1 rounded-md ${!valor ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"}`}
                        >
                            {offDO}
                        </button>
                    </div>
                </div>
            );
        }

        case "MI": {
            const estadosMI = (unidade || "").split("/");
            return (
                <div className="bg-white rounded-2xl shadow p-4 text-center hover:shadow-md transition">
                    <div className="text-gray-600 text-sm mb-2">{nome}</div>
                    <div className="text-lg font-semibold text-gray-700">{estadosMI[valor] || "—"}</div>
                </div>
            );
        }

        case "MO": {
            const estadosMO = (unidade || "").split("/");
            return (
                <div className="bg-white rounded-2xl shadow p-4 text-center hover:shadow-md transition">
                    <div className="text-gray-600 text-sm mb-2">{nome}</div>
                    <select defaultValue={valor} onChange={(e) => enviarComando(parseInt(e.target.value))} className="border rounded-md p-1 text-gray-700">
                        {estadosMO.map((op, i) => (
                            <option key={i} value={i}>
                                {op}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        default:
            return (
                <div className="bg-white rounded-2xl shadow p-4 text-center hover:shadow-md transition">
                    {nome}: {valor} {unidade}
                </div>
            );
    }
}

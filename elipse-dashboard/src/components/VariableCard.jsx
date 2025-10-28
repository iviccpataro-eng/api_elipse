// src/components/VariableCard.jsx
import React, { useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function VariableCard({ variavel, equipamentoTag }) {
    if (!Array.isArray(variavel) || variavel.length < 2) return null;

    const [tipo, nome, valorInicial, unidade, mostrar, nominal] = variavel;
    const [valor, setValor] = useState(valorInicial);

    const API_BASE =
        import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

    // 🔹 Função para enviar comandos ao backend
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

    // 🔹 Gráfico semicircular
    const ArcGraph = ({ valor, nominal }) => {
        const min = nominal * 0.8;
        const max = nominal * 1.2;
        const dentroDoRange = valor >= min && valor <= max;

        const data = {
            datasets: [
                {
                    data: [valor, max - valor],
                    backgroundColor: [
                        dentroDoRange ? "#22c55e" : "#ef4444",
                        "rgba(229,231,235,0.5)",
                    ],
                    borderWidth: 0,
                    cutout: "75%",
                    circumference: 180,
                    rotation: -90,
                },
            ],
        };

        const options = {
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            responsive: true,
        };

        return (
            <div className="w-20 h-10 mx-auto mb-2">
                <Doughnut data={data} options={options} />
            </div>
        );
    };

    // 🔸 Renderização de acordo com o tipo
    switch (tipo) {
        case "AI":
            return (
                <div className="bg-white rounded-2xl shadow p-4 flex flex-col items-center text-center hover:shadow-md transition">
                    <div className="text-gray-600 text-sm mb-2">{nome}</div>
                    {mostrar && nominal ? <ArcGraph valor={valor} nominal={nominal} /> : null}
                    <div
                        className={`text-2xl font-semibold ${nominal && (valor < nominal * 0.8 || valor > nominal * 1.2)
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                    >
                        {valor}{" "}
                        <span className="text-sm text-gray-500">{unidade}</span>
                    </div>
                </div>
            );

        case "AO":
            return (
                <div className="bg-white rounded-2xl shadow p-4 text-center flex flex-col items-center hover:shadow-md transition">
                    <div className="text-gray-600 text-sm mb-2">{nome}</div>
                    <input
                        type="number"
                        className="border rounded-md text-center p-1 w-20"
                        defaultValue={valor}
                        onBlur={(e) => enviarComando(parseFloat(e.target.value))}
                    />
                    <span className="text-xs text-gray-400 mt-1">{unidade}</span>
                </div>
            );

        case "DI": {
            const [onLabel, offLabel] = (unidade || "LIGADO/DESLIGADO").split("/");
            return (
                <div className="bg-white rounded-2xl shadow p-4 text-center hover:shadow-md transition">
                    <div className="text-gray-600 text-sm mb-2">{nome}</div>
                    <div
                        className={`text-lg font-semibold ${valor ? "text-green-600" : "text-red-600"
                            }`}
                    >
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
                            className={`px-3 py-1 rounded-md ${valor ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                                }`}
                        >
                            {onDO}
                        </button>
                        <button
                            onClick={() => enviarComando(false)}
                            className={`px-3 py-1 rounded-md ${!valor ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"
                                }`}
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
                    <div className="text-lg font-semibold text-gray-700">
                        {estadosMI[valor] || "—"}
                    </div>
                </div>
            );
        }

        case "MO": {
            const estadosMO = (unidade || "").split("/");
            return (
                <div className="bg-white rounded-2xl shadow p-4 text-center hover:shadow-md transition">
                    <div className="text-gray-600 text-sm mb-2">{nome}</div>
                    <select
                        defaultValue={valor}
                        onChange={(e) => enviarComando(parseInt(e.target.value))}
                        className="border rounded-md p-1 text-gray-700"
                    >
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

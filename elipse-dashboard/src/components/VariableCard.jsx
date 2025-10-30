// src/components/VariableCard.jsx
import React, { useState } from "react";
import {
    RadialBarChart,
    RadialBar,
    PolarAngleAxis,
} from "recharts";

// Utilitário simples para conversão numérica
function toNumberMaybe(v) {
    const n = parseFloat(v);
    return isNaN(n) ? undefined : n;
}

export default function VariableCard({ variavel, equipamentoTag }) {
    if (!Array.isArray(variavel) || variavel.length < 2) return null;

    // Estrutura padrão das variáveis Elipse
    const [tipo, nome, valorInicial, unidade, hasGraphRaw, nominalRaw] = variavel;
    const [valor, setValor] = useState(parseFloat(valorInicial));
    const hasGraph = hasGraphRaw === true || hasGraphRaw === "true";
    const nominal = toNumberMaybe(nominalRaw);

    const API_BASE =
        import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

    // Envia comandos ao backend (para AO, DO, MO)
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
            if (data.ok) setValor(novoValor);
            else alert("Erro ao enviar comando: " + (data.erro || "Desconhecido"));
        } catch (err) {
            alert("Falha na comunicação com o servidor.");
        }
    };

    // Função para renderizar o arco com Recharts
    const ArcGraph = ({ nome, valor, unidade, nominal }) => {
        const valNum = toNumberMaybe(valor);
        const nomNum = toNumberMaybe(nominal);
        if (!hasGraph || !nomNum || valNum === undefined) return null;

        const min = nomNum * 0.9;
        const max = nomNum * 1.1;
        const clamped = Math.max(min, Math.min(valNum, max));
        const percent = ((clamped - min) / (max - min)) * 100;

        let fill = "#22c55e"; // verde
        if (valNum < nomNum * 0.95 || valNum > nomNum * 1.05) fill = "#f97316"; // laranja
        if (valNum < min || valNum > max) fill = "#ef4444"; // vermelho

        const chartData = [{ name: nome, value: percent, fill }];

        return (
            <div className="flex flex-col items-center">
                <RadialBarChart
                    width={180}
                    height={120}
                    innerRadius="70%"
                    outerRadius="100%"
                    startAngle={180}
                    endAngle={0}
                    data={chartData}
                >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        background
                        clockWise
                    />
                </RadialBarChart>

                <div className="text-xl font-semibold text-gray-800 -mt-4">
                    {valor} {unidade}
                </div>
                <div className="text-sm text-gray-500">
                    Nominal: {nomNum}
                    {unidade}
                </div>
            </div>
        );
    };

    // Renderização conforme o tipo da variável
    switch (tipo) {
        // ---------------- ANALOG INPUT ----------------
        case "AI":
            return (
                <div className="rounded-xl border bg-white shadow p-4 text-center hover:shadow-md transition">
                    <div className="font-medium mb-2 text-gray-700">{nome}</div>
                    {hasGraph && nominal ? (
                        <ArcGraph nome={nome} valor={valor} unidade={unidade} nominal={nominal} />
                    ) : (
                        <>
                            <div className="text-2xl font-semibold text-gray-800">
                                {valor} {unidade}
                            </div>
                            {nominal && (
                                <div className="mt-2 text-sm text-gray-600">
                                    Nominal: {nominal}
                                    {unidade}
                                </div>
                            )}
                        </>
                    )}
                </div>
            );

        // ---------------- ANALOG OUTPUT ----------------
        case "AO":
            return (
                <div className="rounded-xl border bg-white shadow p-4 text-center hover:shadow-md transition">
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

        // ---------------- DIGITAL INPUT ----------------
        case "DI": {
            const [onLabel, offLabel] = (unidade || "LIGADO/DESLIGADO").split("/");
            return (
                <div className="rounded-xl border bg-white shadow p-4 text-center hover:shadow-md transition">
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

        // ---------------- DIGITAL OUTPUT ----------------
        case "DO": {
            const [onDO, offDO] = (unidade || "LIGAR/DESLIGAR").split("/");
            return (
                <div className="rounded-xl border bg-white shadow p-4 text-center hover:shadow-md transition">
                    <div className="text-gray-600 text-sm mb-3">{nome}</div>
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={() => enviarComando(true)}
                            className={`px-3 py-1 rounded-md ${valor
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-200 text-gray-600"
                                }`}
                        >
                            {onDO}
                        </button>
                        <button
                            onClick={() => enviarComando(false)}
                            className={`px-3 py-1 rounded-md ${!valor
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-200 text-gray-600"
                                }`}
                        >
                            {offDO}
                        </button>
                    </div>
                </div>
            );
        }

        // ---------------- MULTIVARIABLE INPUT ----------------
        case "MI": {
            const estados = (unidade || "").split("/");
            return (
                <div className="rounded-xl border bg-white shadow p-4 text-center hover:shadow-md transition">
                    <div className="text-gray-600 text-sm mb-2">{nome}</div>
                    <div className="text-lg font-semibold text-gray-700">
                        {estados[valor] || "—"}
                    </div>
                </div>
            );
        }

        // ---------------- MULTIVARIABLE OUTPUT ----------------
        case "MO": {
            const estados = (unidade || "").split("/");
            return (
                <div className="rounded-xl border bg-white shadow p-4 text-center hover:shadow-md transition">
                    <div className="text-gray-600 text-sm mb-2">{nome}</div>
                    <select
                        defaultValue={valor}
                        onChange={(e) => enviarComando(parseInt(e.target.value))}
                        className="border rounded-md p-1 text-gray-700"
                    >
                        {estados.map((op, i) => (
                            <option key={i} value={i}>
                                {op}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        // ---------------- DEFAULT (FALLBACK) ----------------
        default:
            return (
                <div className="rounded-xl border bg-white shadow p-4 text-center hover:shadow-md transition">
                    {nome}: {valor} {unidade}
                </div>
            );
    }
}

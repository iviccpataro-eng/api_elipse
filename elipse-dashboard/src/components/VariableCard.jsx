// src/components/VariableCard.jsx
import React, { useState } from "react";
import {
    RadialBarChart,
    RadialBar,
    PolarAngleAxis,
} from "recharts";

// Função auxiliar
function toNumberMaybe(value) {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
}

export default function VariableCard({ variavel }) {
    if (!Array.isArray(variavel)) return null;

    const [tipo, nome, valor, unidade, hasGraph, nominalRaw] = variavel;
    const [value, setValue] = useState(valor ?? "");
    const [editing, setEditing] = useState(false);

    // NOMINAL pode ser número ou string com faixa "X/Y"
    let nominalMin = null;
    let nominalMax = null;

    if (typeof nominalRaw === "string" && nominalRaw.includes("/")) {
        const [min, max] = nominalRaw.split("/").map(toNumberMaybe);
        nominalMin = min;
        nominalMax = max;
    } else {
        nominalMin = 0;
        nominalMax = toNumberMaybe(nominalRaw);
    }

    const valNum = toNumberMaybe(valor);
    const nomNum = toNumberMaybe(nominalMax);

    // === BLOCO: RENDER DE ACORDO COM TIPO === //
    switch (tipo?.toUpperCase()) {
        // =======================================================================
        // 🔹 AI — Variáveis analógicas de Entrada
        // =======================================================================
        case "AI": {
            const min = nomNum ? nomNum * 0.9 : 0;
            const max = nomNum ? nomNum * 1.1 : 100;
            const clamped = valNum ? Math.max(min, Math.min(valNum, max)) : 0;
            const percent = nomNum ? ((clamped - min) / (max - min)) * 100 : 0;

            let fill = "#22c55e";
            if (valNum < nomNum * 0.95 || valNum > nomNum * 1.05) fill = "#f97316";
            if (valNum < min || valNum > max) fill = "#ef4444";

            const showGraph = hasGraph !== false;

            return (
                <div className="rounded-xl border bg-white shadow p-4">
                    <div className="font-medium mb-2 text-gray-800">{nome}</div>

                    {showGraph && (
                        <div className="flex justify-center relative w-[180px] h-[120px] mx-auto">
                            {/* 🎨 Arco fantasma perfeitamente alinhado */}
                            <svg
                                width="180"
                                height="120"
                                viewBox="0 0 180 120"
                                className="absolute inset-0 opacity-60"
                            >
                                <defs>
                                    <linearGradient id="ghostGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#e5e7eb" />
                                        <stop offset="50%" stopColor="#d1d5db" />
                                        <stop offset="100%" stopColor="#e5e7eb" />
                                    </linearGradient>
                                </defs>
                                {/* ⚙️ Trajeto exato do arco do Recharts (mesmo centro e raio) */}
                                <path
                                    d="M45,100 A45,45 0 0,1 135,100"
                                    fill="none"
                                    stroke="url(#ghostGradient)"
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                />
                            </svg>

                            {/* 🟢 Arco dinâmico perfeitamente sobreposto */}
                            <div className="absolute inset-0 z-10">
                                <RadialBarChart
                                    width={180}
                                    height={120}
                                    innerRadius="75%"
                                    outerRadius="100%"
                                    startAngle={180}
                                    endAngle={0}
                                    data={[{ nome, valor: percent, fill }]}
                                >
                                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                    <RadialBar
                                        dataKey="valor"
                                        cornerRadius={10}
                                        clockWise
                                        background={false}
                                    />
                                </RadialBarChart>
                            </div>
                        </div>
                    )}

                    {/* 🔢 Valor numérico */}
                    <div className="text-center mt-2">
                        <div className="text-xl font-semibold">
                            {valor}
                            {unidade ? ` ${unidade}` : ""}
                        </div>
                        {nomNum && (
                            <div className="text-sm text-gray-500">
                                Nominal: {nomNum}
                                {unidade}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // =======================================================================
        // 🔹 AO — Variáveis analógicas de Saída
        // =======================================================================
        case "AO": {
            const [min, max] =
                typeof nominalRaw === "string" && nominalRaw.includes("/")
                    ? nominalRaw.split("/").map(toNumberMaybe)
                    : [0, nomNum || 100];

            const handleChange = (e) => {
                const val = parseFloat(e.target.value);
                setValue(isNaN(val) ? "" : val);
            };

            return (
                <div className="rounded-xl border bg-white shadow p-4 text-center">
                    <div className="font-medium mb-2">{nome}</div>
                    <input
                        type="number"
                        min={min}
                        max={max}
                        value={value}
                        onChange={handleChange}
                        className="border rounded-md p-2 w-full text-center"
                    />
                    <div className="text-sm text-gray-500 mt-1">
                        Faixa: {min} - {max} {unidade || ""}
                    </div>
                </div>
            );
        }

        // =======================================================================
        // 🔸 DI — Variáveis digitais de entrada
        // =======================================================================
        case "DI": {
            const [offLabel, onLabel] = (unidade || "").split("/");
            const status = valor ? onLabel || "ON" : offLabel || "OFF";

            return (
                <div className="rounded-xl border bg-white shadow p-4 text-center">
                    <div className="font-medium mb-2">{nome}</div>
                    <div
                        className={`text-lg font-semibold ${valor ? "text-green-600" : "text-gray-400"
                            }`}
                    >
                        {status}
                    </div>
                </div>
            );
        }

        // =======================================================================
        // 🔸 DO — Variáveis digitais de saída
        // =======================================================================
        case "DO": {
            const [offLabel, onLabel] = (unidade || "").split("/");
            return (
                <div className="rounded-xl border bg-white shadow p-4 text-center">
                    <div className="font-medium mb-3">{nome}</div>
                    <div className="flex justify-center gap-2">
                        <button
                            className={`px-4 py-2 rounded-md border ${!valor
                                ? "bg-gray-200 text-gray-700"
                                : "bg-white text-gray-500 hover:bg-gray-100"
                                }`}
                        >
                            {offLabel || "OFF"}
                        </button>
                        <button
                            className={`px-4 py-2 rounded-md border ${valor
                                ? "bg-red-500 text-white"
                                : "bg-white text-gray-500 hover:bg-gray-100"
                                }`}
                        >
                            {onLabel || "ON"}
                        </button>
                    </div>
                </div>
            );
        }

        // =======================================================================
        // 🔸 MI — Variáveis multiestados de entrada
        // =======================================================================
        case "MI": {
            const estados = (unidade || "").split("/");
            const index = Math.max(0, Math.min(estados.length - 1, valor || 0));
            const estadoAtual = estados[index] || "DESCONHECIDO";

            return (
                <div className="rounded-xl border bg-white shadow p-4 text-center">
                    <div className="font-medium mb-2">{nome}</div>
                    <div className="text-lg font-semibold text-gray-700">
                        {estadoAtual}
                    </div>
                </div>
            );
        }

        // =======================================================================
        // 🔸 MO — Variáveis multiestados de saída
        // =======================================================================
        case "MO": {
            const estados = (unidade || "").split("/");
            const index = Math.max(0, Math.min(estados.length - 1, valor || 0));

            return (
                <div className="rounded-xl border bg-white shadow p-4 text-center">
                    <div className="font-medium mb-2">{nome}</div>
                    <select
                        value={index}
                        className="border rounded-md p-2 w-full text-center"
                        onChange={(e) => setValue(parseInt(e.target.value))}
                    >
                        {estados.map((estado, i) => (
                            <option key={i} value={i}>
                                {estado}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        // =======================================================================
        // 🔹 DEFAULT
        // =======================================================================
        default:
            return (
                <div className="rounded-xl border bg-white shadow p-4 text-center">
                    <div className="font-medium">{nome}</div>
                    <div className="text-xl font-semibold">
                        {valor}
                        {unidade ? ` ${unidade}` : ""}
                    </div>
                </div>
            );
    }
}

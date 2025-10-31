// src/components/VariableCard.jsx
import React, { useState } from "react";
import {
    RadialBarChart,
    RadialBar,
    PolarAngleAxis,
} from "recharts";

export default function VariableCard({ variavel, equipamentoTag }) {
    if (!variavel || !Array.isArray(variavel)) return null;

    const [tipo, nome, valor, unidade, hasGraph, nominal] = variavel;
    const [currentValue, setCurrentValue] = useState(valor ?? 0);

    // 🔧 Utilitários
    const toNumberMaybe = (v) => {
        const n = Number(v);
        return isNaN(n) ? undefined : n;
    };

    const valNum = toNumberMaybe(valor);
    const nomNum = toNumberMaybe(nominal);

    // ===================================================
    // =============== 1️⃣ AI (Analógica In) ===============
    // ===================================================
    if (tipo === "AI") {
        if (hasGraph && valNum !== undefined && nomNum) {
            const min = nomNum * 0.9;
            const max = nomNum * 1.1;
            const clamped = Math.max(min, Math.min(valNum, max));
            const percent = ((clamped - min) / (max - min)) * 100;

            let fill = "#22c55e";
            if (valNum < nomNum * 0.95 || valNum > nomNum * 1.05)
                fill = "#f97316";
            if (valNum < min || valNum > max) fill = "#ef4444";

            const chartData = [{ name: nome, value: percent, fill }];

            return (
                <div className="rounded-xl border bg-white shadow p-4">
                    <div className="font-medium mb-2">{nome}</div>
                    <div className="flex justify-center">
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
                            <RadialBar dataKey="value" cornerRadius={10} clockWise />
                        </RadialBarChart>
                    </div>
                    <div className="text-center mt-2">
                        <div className="text-xl font-semibold">
                            {valor} {unidade}
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

        // Sem gráfico
        return (
            <div className="rounded-xl border bg-white shadow p-4 text-center">
                <div className="font-medium">{nome}</div>
                <div className="text-2xl font-semibold">
                    {valor} {unidade}
                </div>
                {/*{nomNum && (
                    <div className="mt-2 text-sm text-gray-600">
                        Nominal: {nomNum}
                        {unidade}
                    </div>
                )}*/}
            </div>
        );
    }

    // ===================================================
    // =============== 2️⃣ AO (Analógica Out) ==============
    // ===================================================
    if (tipo === "AO") {
        let min = 0;
        let max = 100;

        if (typeof nominal === "string" && nominal.includes("/")) {
            const [low, high] = nominal.split("/").map(Number);
            min = low;
            max = high;
        } else if (!isNaN(Number(nominal))) {
            max = Number(nominal);
        }

        const handleChange = (e) => {
            const newVal = Math.min(Math.max(Number(e.target.value), min), max);
            setCurrentValue(newVal);
        };

        return (
            <div className="rounded-xl border bg-white shadow p-4 text-center">
                <div className="font-medium mb-2">{nome}</div>
                <input
                    type="number"
                    value={currentValue}
                    onChange={handleChange}
                    min={min}
                    max={max}
                    className="border rounded-md p-2 w-24 text-center text-lg"
                />
                <div className="text-sm text-gray-500 mt-1">
                    Limite: {min}–{max} {unidade}
                </div>
            </div>
        );
    }

    // ===================================================
    // =============== 3️⃣ DI (Digital In) =================
    // ===================================================
    if (tipo === "DI") {
        const estados = unidade?.split("/") || ["DESLIGADO", "LIGADO"];
        const display = valor ? estados[1] : estados[0];
        return (
            <div className="rounded-xl border bg-white shadow p-4 text-center">
                <div className="font-medium mb-2">{nome}</div>
                <div
                    className={`text-xl font-semibold ${valor ? "text-green-600" : "text-red-500"
                        }`}
                >
                    {display}
                </div>
            </div>
        );
    }

    // ===================================================
    // =============== 4️⃣ DO (Digital Out) ================
    // ===================================================
    if (tipo === "DO") {
        const [labelOff, labelOn] = unidade?.split("/") || ["OFF", "ON"];
        return (
            <div className="rounded-xl border bg-white shadow p-4 text-center">
                <div className="font-medium mb-3">{nome}</div>
                <div className="flex justify-center gap-3">
                    <button
                        className={`px-4 py-2 rounded-md ${valor ? "bg-gray-200 text-gray-700" : "bg-red-500 text-white"
                            }`}
                    >
                        {labelOff}
                    </button>
                    <button
                        className={`px-4 py-2 rounded-md ${!valor ? "bg-gray-200 text-gray-700" : "bg-green-600 text-white"
                            }`}
                    >
                        {labelOn}
                    </button>

                </div>
            </div>
        );
    }

    // ===================================================
    // =============== 5️⃣ MI (Multi In) ===================
    // ===================================================
    if (tipo === "MI") {
        const estados = unidade?.split("/") || [];
        const idx = Number(valor) || 0;
        const display = estados[idx] || `Estado ${idx}`;
        return (
            <div className="rounded-xl border bg-white shadow p-4 text-center">
                <div className="font-medium mb-2">{nome}</div>
                <div className="text-xl font-semibold text-blue-600">{display}</div>
            </div>
        );
    }

    // ===================================================
    // =============== 6️⃣ MO (Multi Out) ==================
    // ===================================================
    if (tipo === "MO") {
        const estados = unidade?.split("/") || [];
        const idx = Number(valor) || 0;

        const handleChange = (e) => setCurrentValue(Number(e.target.value));

        return (
            <div className="rounded-xl border bg-white shadow p-4 text-center">
                <div className="font-medium mb-2">{nome}</div>
                <select
                    value={idx}
                    onChange={handleChange}
                    className="border rounded-md p-2 text-lg"
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

    // ===================================================
    // =============== fallback (segurança) ===============
    // ===================================================
    return (
        <div className="rounded-xl border bg-white shadow p-4 text-center">
            <div className="font-medium">{nome}</div>
            <div className="text-2xl font-semibold">
                {valor} {unidade}
            </div>
        </div>
    );
}

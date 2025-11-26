// src/components/VariableRow.jsx
import React, { useState } from "react";
//import { toNumberMaybe } from "./VariableUtils"; // criaremos depois se quiser externalizar

export default function VariableSimpleRow({ variavel }) {
    const [tipo, nome, valor, unidade, hasGraph, nominalRaw] = variavel;
    const [value, setValue] = useState(valor ?? "");

    let nominalMin = null;
    let nominalMax = null;

    if (typeof nominalRaw === "string" && nominalRaw.includes("/")) {
        const [min, max] = nominalRaw.split("/").map(parseFloat);
        nominalMin = min;
        nominalMax = max;
    } else {
        nominalMin = 0;
        nominalMax = parseFloat(nominalRaw);
    }

    // === BLOCO: RENDER DE ACORDO COM TIPO === //
    switch (tipo?.toUpperCase()) {
        // =======================================================================
        // 🔹 AI — Variáveis analógicas de Entrada
        // =======================================================================
        case "AI":
            return (
                <>
                    <span className="font-medium text-gray-800">{nome}</span>
                    <span className="text-gray-900">
                        {valor} {unidade}
                    </span>
                </>
            );

        // =======================================================================
        // 🔹 AO — Variáveis analógicas de Saída
        // =======================================================================
        case "AO": {
            const min = nominalMin || 0;
            const max = nominalMax || 100;

            return (
                <>
                    <span className="font-medium text-gray-800">{nome}</span>
                    <span>
                        <input
                            type="number"
                            className="border rounded-md p-1 w-24"
                            value={value}
                            min={min}
                            max={max}
                            onChange={(e) => setValue(e.target.value)}
                        />
                    </span>
                </>
            );
        }

        // =======================================================================
        // 🔸 DI — Variáveis digitais de entrada
        // =======================================================================
        case "DI": {
            const [offLabel, onLabel] = (unidade || "").split("/");
            const status = valor ? onLabel ?? "ON" : offLabel ?? "OFF";

            return (
                <>
                    <span className="font-medium text-gray-800">{nome}</span>
                    <span className={`font-semibold ${valor ? "text-green-600" : "text-red-600"}`}>
                        {status}
                    </span>
                </>
            );
        }

        // =======================================================================
        // 🔸 DO — Variáveis digitais de saída
        // =======================================================================
        case "DO": {
            const [offLabel, onLabel] = (unidade || "").split("/");

            return (
                <>
                    <span className="font-medium text-gray-800">{nome}</span>
                    <span>
                        <select
                            value={valor ? 1 : 0}
                            onChange={(e) => setValue(parseInt(e.target.value))}
                            className="border rounded-md p-1"
                        >
                            <option value={0}>{offLabel || "OFF"}</option>
                            <option value={1}>{onLabel || "ON"}</option>
                        </select>
                    </span>
                </>
            );
        }

        // =======================================================================
        // 🔸 MI — Variáveis multiestados de entrada
        // =======================================================================
        case "MI": {
            const estados = (unidade || "").split("/");
            const estadoAtual = estados[valor] || "-";

            return (
                <>
                    <span className="font-medium text-gray-800">{nome}</span>
                    <span className="text-gray-900">{estadoAtual}</span>
                </>
            );
        }

        // =======================================================================
        // 🔸 MO — Variáveis multiestados de saída
        // =======================================================================
        case "MO": {
            const estados = (unidade || "").split("/");

            return (
                <>
                    <span className="font-medium text-gray-800">{nome}</span>
                    <span>
                        <select
                            value={valor}
                            onChange={(e) => setValue(parseInt(e.target.value))}
                            className="border rounded-md p-1"
                        >
                            {estados.map((e, i) => (
                                <option key={i} value={i}>
                                    {e}
                                </option>
                            ))}
                        </select>
                    </span>
                </>
            );
        }

        // =======================================================================
        // 🔹 DEFAULT/FALLBACK
        // =======================================================================
        default:
            return (
                <>
                    <span className="font-medium">{nome}</span>
                    <span>
                        {valor}
                        {unidade}
                    </span>
                </>
            );
    }
}

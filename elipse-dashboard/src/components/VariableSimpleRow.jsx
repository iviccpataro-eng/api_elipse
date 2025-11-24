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

    // === RENDERIZAÇÃO POR TIPO === //
    switch (tipo?.toUpperCase()) {
        // ============================================================
        case "AI":
            return (
                <>
                    <div className="font-medium text-gray-800">{nome}</div>
                    <div className="text-gray-900">
                        {valor} {unidade}
                    </div>
                </>
            );

        // ============================================================
        case "AO": {
            const min = nominalMin || 0;
            const max = nominalMax || 100;

            return (
                <>
                    <div className="font-medium text-gray-800">{nome}</div>
                    <div>
                        <input
                            type="number"
                            className="border rounded-md p-1 w-24"
                            value={value}
                            min={min}
                            max={max}
                            onChange={(e) => setValue(e.target.value)}
                        />
                    </div>
                </>
            );
        }

        // ============================================================
        case "DI": {
            const [offLabel, onLabel] = (unidade || "").split("/");
            const status = valor ? onLabel ?? "ON" : offLabel ?? "OFF";

            return (
                <>
                    <div className="font-medium text-gray-800">{nome}</div>
                    <div className={`font-semibold ${valor ? "text-green-600" : "text-red-600"}`}>
                        {status}
                    </div>
                </>
            );
        }

        // ============================================================
        case "DO": {
            const [offLabel, onLabel] = (unidade || "").split("/");

            return (
                <>
                    <div className="font-medium text-gray-800">{nome}</div>
                    <div>
                        <select
                            value={valor ? 1 : 0}
                            onChange={(e) => setValue(parseInt(e.target.value))}
                            className="border rounded-md p-1"
                        >
                            <option value={0}>{offLabel || "OFF"}</option>
                            <option value={1}>{onLabel || "ON"}</option>
                        </select>
                    </div>
                </>
            );
        }

        // ============================================================
        case "MI": {
            const estados = (unidade || "").split("/");
            const estadoAtual = estados[valor] || "-";

            return (
                <>
                    <div className="font-medium text-gray-800">{nome}</div>
                    <div className="text-gray-900">{estadoAtual}</div>
                </>
            );
        }

        // ============================================================
        case "MO": {
            const estados = (unidade || "").split("/");

            return (
                <>
                    <div className="font-medium text-gray-800">{nome}</div>
                    <div>
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
                    </div>
                </>
            );
        }

        // ============================================================
        default:
            return (
                <>
                    <div className="font-medium">{nome}</div>
                    <div>
                        {valor}
                        {unidade}
                    </div>
                </>
            );
    }
}

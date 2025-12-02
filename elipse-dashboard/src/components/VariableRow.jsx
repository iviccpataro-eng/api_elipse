// src/components/VariableRow.jsx
import React, { useState } from "react";
//import { toNumberMaybe } from "./VariableUtils"; // criaremos depois se quiser externalizar

export default function VariableRow({ variavel }) {
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

    const valNum = parseFloat(valor);
    const nomNum = parseFloat(nominalMax);

    // === BLOCO: RENDER DE ACORDO COM TIPO === //
    switch (tipo?.toUpperCase()) {
        // =======================================================================
        // 🔹 AI — Variáveis analógicas de Entrada
        // =======================================================================
        case "AI":
            return (
                <>
                    <div className="font-medium text-gray-800">{nome}</div>
                    <div className="text-gray-600 hidden lg:flex">{tipo}</div>
                    <div className="text-gray-900">
                        {valor} {unidade}
                    </div>
                    <div className="text-gray-500">
                        {nomNum ? `${nomNum} ${unidade || ""}` : "-"}
                    </div>
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
                    <div className="font-medium text-gray-800">{nome}</div>
                    <div className="text-gray-600 hidden lg:flex">{tipo}</div>
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
                    <div className="text-gray-500">
                        {min} – {max} {unidade || ""}
                    </div>
                </>
            );
        }

        // =======================================================================
        // 🔸 DI — Variáveis digitais de entrada
        // =======================================================================
        case "DI": {
            const [offLabel, onLabel] = (unidade || "").split("/");
            const status = valor ? onLabel ?? "ON" : offLabel ?? "OFF";
            const nominalVal = nominalRaw ? onLabel ?? "ON" : offLabel ?? "OFF";

            return (
                <>
                    <div className="font-medium text-gray-800">{nome}</div>
                    <div className="text-gray-600 hidden lg:flex">{tipo}</div>
                    <div className={`font-semibold ${valor ? "text-green-600" : "text-red-600"}`}>
                        {status}
                    </div>
                    <div className="">{nominalVal}</div>
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
                    <div className="font-medium text-gray-800">{nome}</div>
                    <div className="text-gray-600 hidden lg:flex">{tipo}</div>
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
                    <div>-</div>
                </>
            );
        }

        // =======================================================================
        // 🔸 MI — Variáveis multiestados de entrada
        // =======================================================================
        case "MI": {
            const estados = (unidade || "").split("/");
            const estadoAtual = estados[valor] || "-";
            const nominalVal = estados[nominalRaw] || "-";

            return (
                <>
                    <div className="font-medium text-gray-800">{nome}</div>
                    <div className="text-gray-600 hidden lg:flex">{tipo}</div>
                    <div className="text-gray-900">{estadoAtual}</div>
                    <div className="">{nominalVal}</div>
                </>
            );
        }

        // =======================================================================
        // 🔸 MO — Variáveis multiestados de saída
        // =======================================================================
        case "MO": {
            const estados = (unidade || "").split("/");
            const nominalVal = estados[nominalRaw] || "-";

            return (
                <>
                    <div className="font-medium text-gray-800">{nome}</div>
                    <div className="text-gray-600 hidden lg:flex">{tipo}</div>
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
                    <div className="">{nominalVal}</div>
                </>
            );
        }

        // =======================================================================
        // 🔹 DEFAULT/FALLBACK
        // =======================================================================
        default:
            return (
                <>
                    <div className="font-medium">{nome}</div>
                    <div className="hidden lg:flex">{tipo}</div>
                    <div>
                        {valor}
                        {unidade}
                    </div>
                    <div>-</div>
                </>
            );
    }
}

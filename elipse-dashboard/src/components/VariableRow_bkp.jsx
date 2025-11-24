import React, { useState } from "react";

export default function VariableRow({ variable }) {
    const { tipo, nome, valor, unidade, nominal } = variable;

    const [value, setValue] = useState(valor ?? "");

    switch (tipo?.toUpperCase()) {
        /* ===============================
           🔹 AO — Analógica de Saída
        ================================ */
        case "AO": {
            return (
                <div className="flex justify-between px-4 py-3 items-center">
                    <span className="font-medium text-gray-700">{nome}</span>

                    <input
                        type="number"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="border rounded-md p-2 w-28 text-center"
                    />
                </div>
            );
        }

        /* ===============================
           🔸 MO — Multiestado de Saída
        ================================ */
        case "MO": {
            const estados = (unidade || "").split("/");
            return (
                <div className="flex justify-between px-4 py-3 items-center">
                    <span className="font-medium text-gray-700">{nome}</span>

                    <select
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="border rounded-md p-2"
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

        /* ===============================
           🔸 DO — Digital de Saída
        ================================ */
        case "DO": {
            const [offLabel, onLabel] = (unidade || "").split("/");
            return (
                <div className="flex justify-between px-4 py-3 items-center">
                    <span className="font-medium text-gray-700">{nome}</span>

                    <div className="flex gap-2">
                        <button className="px-3 py-1 border rounded">
                            {offLabel || "OFF"}
                        </button>
                        <button className="px-3 py-1 border rounded bg-red-500 text-white">
                            {onLabel || "ON"}
                        </button>
                    </div>
                </div>
            );
        }

        /* ===============================
           🔸 DI — Digital de Entrada
        ================================ */
        case "DI": {
            const [offLabel, onLabel] = (unidade || "").split("/");
            return (
                <div className="flex justify-between px-4 py-3">
                    <span className="font-medium text-gray-700">{nome}</span>
                    <span className="font-semibold">
                        {valor ? onLabel || "ON" : offLabel || "OFF"}
                    </span>
                </div>
            );
        }

        /* ===============================
           🔹 MI — Multiestado de Entrada
        ================================ */
        case "MI": {
            const estados = (unidade || "").split("/");
            const index = Math.max(0, Math.min(estados.length - 1, valor || 0));

            return (
                <div className="flex justify-between px-4 py-3">
                    <span className="font-medium text-gray-700">{nome}</span>
                    <span className="font-semibold">{estados[index]}</span>
                </div>
            );
        }

        /* ===============================
           🔸 DEFAULT
        ================================ */
        default:
            return (
                <div className="flex justify-between px-4 py-3">
                    <span className="font-medium text-gray-700">{nome}</span>
                    <span>
                        {valor} {unidade}
                    </span>
                </div>
            );
    }
}

import React, { useState } from "react";
import { toNumberMaybe } from "./VariableCard"; // reutiliza função auxiliar

export default function VariableRow({ variable }) {
    const { tipo, nome, valor, unidade, nominal } = variable;
    const [value, setValue] = useState(valor ?? "");

    // Tipos interativos seguem a mesma lógica do VariableCard
    switch (tipo?.toUpperCase()) {
        case "AO":
            return (
                <div className="flex justify-between px-4 py-3">
                    <span className="font-medium text-gray-700">{nome}</span>

                    <input
                        type="number"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="border rounded-md p-1 w-24 text-center"
                    />
                </div>
            );

        case "MO": {
            const estados = (unidade || "").split("/");
            return (
                <div className="flex justify-between px-4 py-3">
                    <span className="font-medium text-gray-700">{nome}</span>

                    <select
                        className="border rounded-md p-1"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    >
                        {estados.map((e, i) => (
                            <option key={i} value={i}>{e}</option>
                        ))}
                    </select>
                </div>
            );
        }

        case "DO": {
            const [offLabel, onLabel] = (unidade || "").split("/");
            return (
                <div className="flex justify-between px-4 py-3 items-center">
                    <span className="font-medium text-gray-700">{nome}</span>

                    <div className="flex gap-1">
                        <button className="px-2 py-1 border rounded">
                            {offLabel || "OFF"}
                        </button>
                        <button className="px-2 py-1 border rounded">
                            {onLabel || "ON"}
                        </button>
                    </div>
                </div>
            );
        }

        case "DI": {
            const [offLabel, onLabel] = (unidade || "").split("/");
            return (
                <div className="flex justify-between px-4 py-3 items-center">
                    <span className="font-medium text-gray-700">{nome}</span>

                    <span className="font-semibold">
                        {valor ? onLabel || "ON" : offLabel || "OFF"}
                    </span>
                </div>
            );
        }

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

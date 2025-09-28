import React, { useState } from "react";

export default function SystemConfig({ onChange }) {
    const [refreshTime, setRefreshTime] = useState(5);
    const [theme, setTheme] = useState("light");

    const handleSave = () => {
        if (onChange) onChange({ refreshTime, theme });
    };

    return (
        <div className="bg-white rounded-2xl shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">Configurações do Sistema</h2>

            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">
                    Tempo de recarga (segundos, mínimo 5)
                </label>
                <input
                    type="number"
                    min={5}
                    value={refreshTime}
                    onChange={(e) => setRefreshTime(parseInt(e.target.value, 10))}
                    className="mt-1 block w-full px-3 py-2 border rounded-xl text-sm"
                />
            </div>

            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">
                    Tema
                </label>
                <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border rounded-xl text-sm"
                >
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                </select>
            </div>

            <button
                onClick={handleSave}
                className="w-full px-3 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
            >
                Salvar
            </button>
        </div>
    );
}

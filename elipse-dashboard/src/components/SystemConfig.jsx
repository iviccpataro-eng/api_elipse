import React, { useState } from "react";

export default function SystemConfig() {
    const [refreshTime, setRefreshTime] = useState(10);
    const [theme, setTheme] = useState("light");

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Configurações do Sistema</h1>
            <div className="space-y-4 max-w-md">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Tempo de recarga (segundos) *
                    </label>
                    <input
                        type="number"
                        min={5}
                        value={refreshTime}
                        onChange={(e) => setRefreshTime(Number(e.target.value))}
                        className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Tema *
                    </label>
                    <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                    >
                        <option value="light">Claro</option>
                        <option value="dark">Escuro</option>
                    </select>
                </div>
                <button
                    onClick={() => alert(`Configurações salvas!\nRefresh: ${refreshTime}s\nTema: ${theme}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Salvar
                </button>
            </div>
        </div>
    );
}

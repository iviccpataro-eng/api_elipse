// src/pages/Dashboard.jsx
import React from "react";

export default function Dashboard() {
    const cards = [
        { title: "Consumo de Energia", value: "—", unit: "kWh" },
        { title: "Consumo de Água", value: "—", unit: "m³" },
        { title: "Temperatura Média", value: "—", unit: "°C" },
        { title: "Alarmes Ativos", value: "—", unit: "" },
        { title: "Custo Total", value: "—", unit: "R$" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Dashboard Geral</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <div
                        key={card.title}
                        className="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between border hover:shadow-lg transition"
                    >
                        <h2 className="text-lg font-semibold text-gray-700">
                            {card.title}
                        </h2>
                        <p className="text-3xl font-bold text-blue-600 mt-2">
                            {card.value}
                            <span className="text-base text-gray-500 ml-1">{card.unit}</span>
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

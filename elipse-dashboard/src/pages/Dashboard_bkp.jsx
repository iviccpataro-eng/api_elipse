// src/pages/Dashboard.jsx
import React from "react";
import { Zap, Droplet, Wind, Thermometer, Gauge } from "lucide-react";

export default function Dashboard() {
    const cards = [
        { title: "Energia", icon: <Zap className="w-6 h-6 text-yellow-500" />, value: "Em breve" },
        { title: "Água", icon: <Droplet className="w-6 h-6 text-blue-500" />, value: "Em breve" },
        { title: "Ar Condicionado", icon: <Wind className="w-6 h-6 text-cyan-500" />, value: "Em breve" },
        { title: "Temperatura", icon: <Thermometer className="w-6 h-6 text-red-500" />, value: "Em breve" },
        { title: "Pressão", icon: <Gauge className="w-6 h-6 text-green-500" />, value: "Em breve" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <div
                        key={card.title}
                        className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-gray-700">{card.title}</h2>
                            {card.icon}
                        </div>
                        <p className="text-gray-400 text-sm">{card.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

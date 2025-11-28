// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/apiFetch";

export default function Dashboard() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [dados, setDados] = useState(null);

    // futuramente você pode alimentar estes cards com dados reais
    const defaultCards = [
        { title: "Consumo de Energia", value: "—", unit: "kWh" },
        { title: "Consumo de Água", value: "—", unit: "m³" },
        { title: "Temperatura Média", value: "—", unit: "°C" },
        { title: "Alarmes Ativos", value: "—", unit: "" },
        { title: "Custo Total", value: "—", unit: "R$" },
    ];

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);

                // 👉 chama API já com tratamento de token
                const resp = await apiFetch("/dashboard");

                if (resp?.ok) {
                    setDados(resp.data);
                } else {
                    setDados(null);
                }

            } catch (err) {
                // token inválido → apiFetch já redirecionou
                setErro(err.message || "Erro ao carregar Dashboard");
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Carregando Dashboard...
            </div>
        );
    }

    if (erro) {
        return (
            <div className="p-6 text-center text-red-500 font-medium">
                {erro}
            </div>
        );
    }

    const cards = dados || defaultCards;

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

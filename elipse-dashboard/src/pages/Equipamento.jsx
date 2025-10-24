// src/pages/Equipamento.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ArcElement, Chart as ChartJS } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement);

export default function Equipamento() {
    const { tag } = useParams();
    const navigate = useNavigate();
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(true);

    const API_BASE =
        import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            setErro("Token não encontrado. Faça login novamente.");
            setLoading(false);
            return;
        }

        fetch(`${API_BASE}/equipamento/${encodeURIComponent(tag)}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.ok) setDados(data.dados);
                else setErro(data.erro || "Erro ao carregar dados do equipamento.");
            })
            .catch(() => setErro("Falha na comunicação com a API."))
            .finally(() => setLoading(false));
    }, [tag]);

    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Carregando dados do equipamento...
            </div>
        );

    if (erro)
        return (
            <div className="p-6 text-center text-red-500 font-medium">{erro}</div>
        );

    const info = dados?.info || {};
    const grandezas = dados?.tags || {};

    // 🔹 Caso tenha vindo no formato data[] (com gráfico, nominal etc)
    const rawData = dados?.raw || dados?.data || [];
    const temDataEstruturada = Array.isArray(rawData) && rawData.length > 0;

    // 🔹 Helper para gerar gráfico semicircular com cor dinâmica
    const ArcGraph = ({ valor, nominal }) => {
        const min = nominal * 0.8;
        const max = nominal * 1.2;
        const percent = Math.min(Math.max((valor - min) / (max - min), 0), 1);
        const dentroDoRange = valor >= min && valor <= max;

        const data = {
            datasets: [
                {
                    data: [percent, 1 - percent],
                    backgroundColor: [dentroDoRange ? "#22c55e" : "#ef4444", "#e5e7eb"],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270,
                },
            ],
        };

        const options = {
            cutout: "70%",
            responsive: true,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
        };

        return <Doughnut data={data} options={options} />;
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20 p-6">
            <div className="max-w-6xl mx-auto">
                {/* 🔙 Botão voltar */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                </button>

                {/* Cabeçalho do equipamento */}
                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        {info.name || tag}
                    </h1>
                    <p className="text-gray-500 mb-1">
                        {info.descricao || "Equipamento sem descrição"}
                    </p>
                    <p className="text-sm text-gray-400">
                        {info.fabricante && `${info.fabricante} `}
                        {info.modelo && `• ${info.modelo}`}
                        {info.statusComunicacao &&
                            ` • Comunicação: ${info.statusComunicacao}`}
                        {info.ultimaAtualizacao &&
                            ` • Último envio: ${new Date(
                                info.ultimaAtualizacao
                            ).toLocaleString("pt-BR")}`}
                    </p>
                </div>

                {/* Cards das grandezas */}
                {temDataEstruturada ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rawData.map(([nome, valor, unidade, mostrarGrafico, nominal]) => (
                            <div
                                key={nome}
                                className="bg-white rounded-2xl shadow p-4 flex flex-col items-center justify-center text-center hover:shadow-md transition"
                            >
                                <div className="text-gray-600 text-sm mb-2">{nome}</div>

                                {mostrarGrafico ? (
                                    <div className="w-28 h-14 mb-2">
                                        <ArcGraph valor={valor} nominal={nominal} />
                                    </div>
                                ) : null}

                                <div
                                    className={`text-2xl font-semibold ${valor >= nominal * 0.8 && valor <= nominal * 1.2
                                        ? "text-green-600"
                                        : "text-red-600"
                                        }`}
                                >
                                    {valor} {unidade}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : Object.keys(grandezas).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(info.grandezas).map(([nome, valor]) => {
                            const unidade = info.unidades?.[nome] || "";
                            const dadosVar = info.data?.find((d) => d[0] === nome);

                            const mostrarGrafico = dadosVar?.[3] === true;
                            const nominal = dadosVar?.[4] ?? 0;
                            const min = nominal * 0.8;
                            const max = nominal * 1.2;

                            const cor =
                                valor < min || valor > max
                                    ? "rgba(255, 99, 132, 0.8)" // Vermelho
                                    : "rgba(75, 192, 192, 0.8)"; // Verde

                            const data = {
                                datasets: [
                                    {
                                        data: [valor, max - valor],
                                        backgroundColor: [cor, "rgba(240,240,240,0.4)"],
                                        borderWidth: 0,
                                        cutout: "75%",
                                    },
                                ],
                            };

                            const options = {
                                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                                rotation: -90,
                                circumference: 180,
                            };

                            return (
                                <div
                                    key={nome}
                                    className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center justify-center transition hover:shadow-lg"
                                    style={{ height: "180px" }}
                                >
                                    <div className="text-gray-600 text-sm mb-2 text-center">{nome}</div>
                                    {mostrarGrafico ? (
                                        <div className="w-24 h-24">
                                            <Doughnut data={data} options={options} />
                                        </div>
                                    ) : (
                                        <div className="text-2xl font-semibold text-gray-800">
                                            {valor} <span className="text-sm text-gray-500">{unidade}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-gray-400 text-center py-10">
                        Nenhuma grandeza disponível para este equipamento.
                    </div>
                )}
            </div>
        </div>
    );
}

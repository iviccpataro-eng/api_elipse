// src/pages/Equipamento.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Equipamento() {
    const { tag } = useParams();
    const navigate = useNavigate();
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(true);

    const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

    // 🔄 Função para buscar os dados do equipamento
    const carregarDados = useCallback(() => {
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
                console.log("📡 Retorno da API Equipamento:", data);
                if (data.ok) setDados(data.dados);
                else setErro(data.erro || "Erro ao carregar dados do equipamento.");
            })
            .catch(() => setErro("Falha na comunicação com a API."))
            .finally(() => setLoading(false));
    }, [tag, API_BASE]);

    // 🔁 Atualiza de acordo com o refreshTime
    useEffect(() => {
        carregarDados();
        const refreshTime = localStorage.getItem("refreshTime") || 15000; // default 15s
        const interval = setInterval(carregarDados, parseInt(refreshTime, 10));
        return () => clearInterval(interval);
    }, [carregarDados]);

    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Carregando dados do equipamento...
            </div>
        );

    if (erro)
        return <div className="p-6 text-center text-red-500 font-medium">{erro}</div>;

    const info = dados?.info || {};
    const variaveis = Array.isArray(dados?.data) ? dados.data : [];

    // 🧮 Componente gráfico semicircular
    const ArcGraph = ({ valor, nominal }) => {
        const min = nominal * 0.8;
        const max = nominal * 1.2;
        const dentroDoRange = valor >= min && valor <= max;

        const data = {
            datasets: [
                {
                    data: [valor, max - valor],
                    backgroundColor: [
                        dentroDoRange ? "#22c55e" : "#ef4444",
                        "rgba(229,231,235,0.5)",
                    ],
                    borderWidth: 0,
                    cutout: "75%",
                    circumference: 180,
                    rotation: -90,
                },
            ],
        };

        const options = {
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            responsive: true,
        };

        return (
            <div className="w-20 h-10 mx-auto mb-2">
                <Doughnut data={data} options={options} />
            </div>
        );
    };

    // 🎛️ Renderização de cards conforme o tipo
    const renderCard = (variavel, index) => {
        if (!Array.isArray(variavel) || variavel.length < 2) return null;

        const [tipo, nome, valor, unidade, mostrar, nominal] = variavel;

        switch (tipo) {
            // ----- ANALOG INPUT -----
            case "AI":
                return (
                    <div
                        key={index}
                        className="bg-white rounded-2xl shadow p-4 flex flex-col items-center justify-center text-center hover:shadow-md transition"
                    >
                        <div className="text-gray-600 text-sm mb-2">{nome}</div>
                        {mostrar && nominal ? (
                            <ArcGraph valor={valor} nominal={nominal} />
                        ) : null}
                        <div
                            className={`text-2xl font-semibold ${nominal && (valor < nominal * 0.8 || valor > nominal * 1.2)
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                        >
                            {valor}{" "}
                            <span className="text-sm text-gray-500">{unidade}</span>
                        </div>
                    </div>
                );

            // ----- ANALOG OUTPUT -----
            case "AO":
                return (
                    <div
                        key={index}
                        className="bg-white rounded-2xl shadow p-4 text-center flex flex-col items-center hover:shadow-md transition"
                    >
                        <div className="text-gray-600 text-sm mb-2">{nome}</div>
                        <input
                            type="number"
                            className="border rounded-md text-center p-1 w-20"
                            defaultValue={valor}
                        />
                        <span className="text-xs text-gray-400 mt-1">{unidade}</span>
                    </div>
                );

            // ----- DIGITAL INPUT -----
            case "DI":
                const [onLabel, offLabel] = (unidade || "LIGADO/DESLIGADO").split("/");
                return (
                    <div
                        key={index}
                        className="bg-white rounded-2xl shadow p-4 text-center hover:shadow-md transition"
                    >
                        <div className="text-gray-600 text-sm mb-2">{nome}</div>
                        <div
                            className={`text-lg font-semibold ${valor ? "text-green-600" : "text-red-600"
                                }`}
                        >
                            {valor ? onLabel : offLabel}
                        </div>
                    </div>
                );

            // ----- DIGITAL OUTPUT -----
            case "DO":
                const [onDO, offDO] = (unidade || "LIGAR/DESLIGAR").split("/");
                return (
                    <div
                        key={index}
                        className="bg-white rounded-2xl shadow p-4 text-center hover:shadow-md transition"
                    >
                        <div className="text-gray-600 text-sm mb-3">{nome}</div>
                        <div className="flex gap-2 justify-center">
                            <button
                                className={`px-3 py-1 rounded-md ${valor ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                                    }`}
                            >
                                {onDO}
                            </button>
                            <button
                                className={`px-3 py-1 rounded-md ${!valor ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"
                                    }`}
                            >
                                {offDO}
                            </button>
                        </div>
                    </div>
                );

            // ----- MULTIVARIABLE INPUT -----
            case "MI":
                const estadosMI = (unidade || "").split("/");
                return (
                    <div
                        key={index}
                        className="bg-white rounded-2xl shadow p-4 text-center hover:shadow-md transition"
                    >
                        <div className="text-gray-600 text-sm mb-2">{nome}</div>
                        <div className="text-lg font-semibold text-gray-700">
                            {estadosMI[valor] || "—"}
                        </div>
                    </div>
                );

            // ----- MULTIVARIABLE OUTPUT -----
            case "MO":
                const estadosMO = (unidade || "").split("/");
                return (
                    <div
                        key={index}
                        className="bg-white rounded-2xl shadow p-4 text-center hover:shadow-md transition"
                    >
                        <div className="text-gray-600 text-sm mb-2">{nome}</div>
                        <select
                            defaultValue={valor}
                            className="border rounded-md p-1 text-gray-700"
                        >
                            {estadosMO.map((op, i) => (
                                <option key={i} value={i}>
                                    {op}
                                </option>
                            ))}
                        </select>
                    </div>
                );

            default:
                return (
                    <div
                        key={index}
                        className="bg-white rounded-2xl shadow p-4 text-center hover:shadow-md transition"
                    >
                        {nome}: {valor} {unidade}
                    </div>
                );
        }
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

                {/* Cabeçalho */}
                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        {info.name || tag}
                    </h1>
                    <p className="text-gray-500 mb-1">
                        {info.descricao || info.description || "Equipamento sem descrição"}
                    </p>
                    <p className="text-sm text-gray-400">
                        {info.fabricante && `${info.fabricante}`}
                        {info.modelo && ` • ${info.modelo}`}
                        {info.statusComunicacao && ` • Comunicação: ${info.statusComunicacao}`}
                        {info.ultimaAtualizacao &&
                            ` • Último envio: ${new Date(
                                info.ultimaAtualizacao
                            ).toLocaleString("pt-BR")}`}
                    </p>
                </div>

                {/* Variáveis */}
                {variaveis.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {variaveis.map(renderCard)}
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

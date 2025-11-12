// src/components/EquipamentGrid.jsx
import React from "react";
import { Gauge } from "lucide-react";

export default function EquipmentGrid({
    equipamentos = [],
    detalhes = {},
    selectedBuilding,
    selectedFloor,
    onClick,
}) {
    if (!equipamentos || equipamentos.length === 0) {
        return (
            <div className="flex items-center justify-center text-gray-400 italic py-6">
                Nenhum equipamento encontrado neste pavimento.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {equipamentos.map((tag) => {
                const info = detalhes[tag] || {};
                const nomeAmigavel =
                    info.nomeExibicao ||
                    tag.replace(/_/g, "-"); // Ex: MM_01_01 → MM-01-01
                const descricao = info.descricao || "Equipamento sem descrição";
                const comunicacao = info.comunicacao ?? true; // true=ok, false=erro
                const status = comunicacao ? "OK" : "Falha de Comunicação";
                const statusColor = comunicacao ? "text-green-600" : "text-red-600";

                return (
                    <div
                        key={tag}
                        onClick={() => onClick && onClick(tag)}
                        className="flex items-center bg-white rounded-2xl shadow hover:shadow-lg transition cursor-pointer overflow-hidden border border-gray-100 hover:border-blue-300"
                    >
                        {/* SVG Gauge lateral */}
                        <div className="bg-gray-50 flex items-center justify-center p-4 w-24 h-full">
                            <svg
                                viewBox="0 0 100 100"
                                className="w-12 h-12 text-blue-500"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                            >
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    stroke="currentColor"
                                    strokeOpacity="0.2"
                                />
                                <path
                                    d="M50 50 L50 10"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M50 50 L85 50"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>

                        {/* Linha divisória */}
                        <div className="h-20 w-px bg-gray-200"></div>

                        {/* Texto */}
                        <div className="flex-1 p-4 overflow-hidden">
                            <h3 className="text-lg font-semibold text-gray-800 truncate">
                                {nomeAmigavel}
                            </h3>
                            <p className="text-sm text-gray-600 truncate flex items-center gap-1">
                                {descricao}
                                <span className="text-gray-400">•</span>
                                <span className={`font-medium ${statusColor}`}>{status}</span>
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

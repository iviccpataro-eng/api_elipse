// EquipmentGrid.jsx — VERSÃO FINAL
import React from "react";
import { Gauge } from "lucide-react";

export default function EquipmentGrid({
    equipamentos,
    selectedBuilding,
    selectedFloor,
    detalhes,
    onClick
}) {
    if (!equipamentos || equipamentos.length === 0)
        return (
            <div className="text-gray-400 italic text-sm text-center py-4">
                Nenhum equipamento encontrado.
            </div>
        );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipamentos.map((equipTag) => {
                // Caminho completo dentro do structureDetails
                const fullTag = `EL/${selectedBuilding}/${selectedFloor}/${equipTag}`;

                const detail = detalhes[fullTag] || null;

                const name = detail?.name || equipTag;
                const description = detail?.description || "";
                const comm = detail?.communication || "FAIL!";

                const statusColor =
                    comm === "OK"
                        ? "text-green-600"
                        : comm.toLowerCase().includes("fail")
                            ? "text-red-600"
                            : "text-gray-400";

                return (
                    <div
                        key={equipTag}
                        onClick={() => onClick(fullTag)}
                        className="flex items-center bg-white rounded-2xl shadow-md border hover:shadow-lg transition cursor-pointer p-4"
                    >
                        <Gauge className="text-gray-500" size={48} strokeWidth={1.5} />

                        <div className="mx-4 border-l h-12 border-gray-200" />

                        <div className="flex flex-col">
                            <span className="font-semibold text-gray-800">{name}</span>
                            <span className="text-sm text-gray-600">
                                {description || "Sem descrição"}
                                <span className="mx-1 text-gray-400">•</span>
                                <span className={statusColor}>
                                    {comm === "OK" ? "Comunicação OK" : "Falha de Comunicação"}
                                </span>
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

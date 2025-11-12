import React from "react";
import { Gauge } from "lucide-react";

export default function EquipmentGrid({ equipamentos, onClick }) {
    if (!equipamentos || equipamentos.length === 0) {
        return (
            <div className="text-gray-400 italic text-sm text-center py-4">
                Nenhum equipamento encontrado neste pavimento.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipamentos.map((equip) => {
                const statusOk =
                    equip.communication === "OK" ||
                    equip.communication?.toLowerCase() === "ok";

                return (
                    <div
                        key={equip.tag}
                        onClick={() => onClick(equip.tag)}
                        className="flex items-center bg-white rounded-2xl shadow-md border hover:shadow-lg hover:border-blue-400 transition cursor-pointer p-4"
                    >
                        <div className="flex-shrink-0 text-gray-500">
                            <Gauge size={48} strokeWidth={1.75} />
                        </div>

                        <div className="mx-4 border-l h-12 border-gray-200" />

                        <div className="flex flex-col justify-center flex-grow">
                            <span className="font-semibold text-gray-800 text-base">
                                {equip.name}
                            </span>
                            <span className="text-sm text-gray-600 flex items-center gap-1">
                                {equip.description}
                                <span className="text-gray-400">•</span>
                                <span
                                    className={`font-medium ${statusOk ? "text-green-600" : "text-red-600"
                                        }`}
                                >
                                    {statusOk
                                        ? "Comunicação OK"
                                        : "Falha de Comunicação"}
                                </span>
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

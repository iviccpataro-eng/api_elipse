// src/components/EquipmentGrid.jsx
export default function EquipmentGrid({ estrutura, building, floor }) {
    if (!building) {
        return (
            <div className="text-gray-500">
                Selecione um prédio na barra lateral para visualizar os equipamentos.
            </div>
        );
    }

    const floors = estrutura[building];
    const floorsToShow = floor ? [floor] : Object.keys(floors);

    return (
        <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                {building}
                {floor && ` - ${floor}`}
            </h2>

            {floorsToShow.map((fl) => (
                <div key={fl} className="mb-6">
                    {!floor && (
                        <h3 className="text-lg font-medium text-gray-600 mb-2">{fl}</h3>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {floors[fl].map((equip, idx) => (
                            <div
                                key={idx}
                                className="rounded-xl border border-gray-200 bg-white p-3 shadow hover:shadow-md transition"
                            >
                                <h4 className="font-semibold text-gray-800">{equip}</h4>
                                <p className="text-sm text-gray-500">Equipamento</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

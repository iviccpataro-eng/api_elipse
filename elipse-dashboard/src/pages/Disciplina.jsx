// src/pages/Disciplina.jsx
import { useEffect, useState } from "react";
import DisciplineSidebar from "../components/DisciplineSidebar";
import EquipmentGrid from "../components/EquipmentGrid";

export default function Disciplina({ disciplina }) {
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [selectedFloor, setSelectedFloor] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `https://api-elipse.vercel.app/${disciplina}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const result = await response.json();
                if (!result.ok) throw new Error(result.erro || "Erro ao carregar dados.");
                setDados(result.dados.estrutura);
            } catch (err) {
                setErro(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [disciplina]);

    if (loading)
        return (
            <div className="flex h-screen items-center justify-center text-gray-500">
                Carregando dados da disciplina {disciplina.toUpperCase()}...
            </div>
        );

    if (erro)
        return (
            <div className="p-4 text-red-600">
                <h2>Erro:</h2>
                <p>{erro}</p>
            </div>
        );

    if (!dados || Object.keys(dados).length === 0)
        return <div className="p-4">Nenhum dado encontrado.</div>;

    return (
        <div className="flex h-screen">
            <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto">
                <h1 className="mb-4 text-xl font-semibold text-gray-700 capitalize">
                    {disciplina}
                </h1>
                <DisciplineSidebar
                    estrutura={dados}
                    onSelectBuilding={setSelectedBuilding}
                    onSelectFloor={setSelectedFloor}
                />
            </aside>

            <main className="flex-1 p-6 overflow-y-auto">
                <EquipmentGrid
                    estrutura={dados}
                    building={selectedBuilding}
                    floor={selectedFloor}
                />
            </main>
        </div>
    );
}

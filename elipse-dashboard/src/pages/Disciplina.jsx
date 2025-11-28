// src/pages/Disciplina.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DisciplineSidebar from "../components/DisciplineSideBar";
import EquipmentGrid from "../components/EquipmentGrid";
import { apiFetch } from "../utils/api";

export default function Disciplina({ disciplina }) {
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [selectedFloor, setSelectedFloor] = useState(null);

    const navigate = useNavigate();

    const API_BASE =
        import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

    const fetchData = useCallback(async () => {
        const data = await apiFetch(`${API_BASE}/${disciplina}`, {}, navigate);

        if (!data) {
            // apiFetch já redirecionou, então apenas interrompe
            return;
        }

        if (!data.ok) {
            setErro(data.erro || "Erro ao carregar dados.");
            setLoading(false);
            return;
        }

        setDados(data.dados?.estrutura || {});
        setLoading(false);
    }, [API_BASE, disciplina, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto">
                <h1 className="mb-4 text-xl font-semibold text-gray-700 capitalize">
                    {disciplina}
                </h1>

                <DisciplineSidebar
                    estrutura={dados}
                    onSelectBuilding={(b) => {
                        setSelectedBuilding(b);
                        setSelectedFloor(null);
                    }}
                    onSelectFloor={(b, f) => {
                        setSelectedBuilding(b);
                        setSelectedFloor(f);
                    }}
                />
            </aside>

            {/* Conteúdo */}
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

// src/pages/Equipamento.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

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
        console.log("📡 Retorno da API Equipamento:", data); // 👀 LOG COMPLETO
        if (data.ok) setDados(data.dados);
        else setErro(data.erro || "Erro ao carregar dados do equipamento.");
      })
      .catch((err) => {
        console.error("Erro de comunicação:", err);
        setErro("Falha na comunicação com a API.");
      })
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

  if (!dados)
    return (
      <div className="p-6 text-center text-gray-400">
        Nenhum dado disponível.
      </div>
    );

  // 🔹 Ajustado conforme retorno atual do backend
  const info = dados.info || {};
  const grandezas = dados.tags || {}; // ⬅️ Corrigido
  const unidades = dados.units || {}; // ⬅️ Corrigido

  return (
    <div className="min-h-screen bg-gray-50 pt-20 p-6">
      <div className="max-w-5xl mx-auto">
        {/* 🔙 Botão de voltar */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        {/* 🏷 Cabeçalho */}
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          {info.name || tag}
        </h1>
        <p className="text-gray-500 mb-6">
          {info.descricao || "Equipamento sem descrição"}
        </p>

        {/* ✅ Status de comunicação */}
        {info.statusComunicacao && (
          <p
            className={`mb-4 text-sm font-medium ${info.statusComunicacao === "OK"
              ? "text-green-600"
              : "text-red-500"
              }`}
          >
            Comunicação: {info.statusComunicacao}
          </p>
        )}

        {/* 📊 Grade de grandezas */}
        {Object.keys(grandezas).length === 0 ? (
          <div className="text-gray-400 text-center py-10">
            Nenhuma grandeza disponível para este equipamento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(grandezas).map(([nome, valor]) => (
              <div
                key={nome}
                className="bg-white rounded-xl shadow p-4 hover:shadow-md transition"
              >
                <div className="text-gray-600 text-sm mb-1">{nome}</div>
                <div className="text-2xl font-semibold text-gray-800">
                  {valor} {unidades?.[nome] || ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

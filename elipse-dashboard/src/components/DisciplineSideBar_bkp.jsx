// components/DisciplineSidebar.jsx
import React from "react";

export default function DisciplineSidebar({ estrutura, onSelectBuilding, onSelectFloor }) {
  if (!estrutura || Object.keys(estrutura).length === 0) {
    return <p className="text-gray-400 text-sm italic">Nenhum dado disponível.</p>;
  }

  return (
    <div className="space-y-4">
      {Object.entries(estrutura).map(([buildingName, pavimentos]) => {
        // 🔹 Coleta todos os pavimentos com seus nomes amigáveis e ordem
        const pavimentosInfo = Object.entries(pavimentos).map(([alias, equipamentos]) => {
          let floorName = alias;
          let ordPav = 0;

          // Busca o primeiro equipamento que tenha o campo "info"
          const primeiroEquip = Object.values(equipamentos)[0];
          if (primeiroEquip?.info?.[0]) {
            floorName = primeiroEquip.info[0].floor || alias;
            ordPav = parseInt(primeiroEquip.info[0].ordPav) || 0;
          }

          return { alias, floorName, ordPav };
        });

        // 🔽 Ordena de forma decrescente (ordPav maior primeiro)
        pavimentosInfo.sort((a, b) => b.ordPav - a.ordPav);

        return (
          <div key={buildingName}>
            <button
              onClick={() => onSelectBuilding(buildingName)}
              className="w-full text-left font-semibold text-gray-700 hover:text-blue-600 transition"
            >
              {buildingName}
            </button>
            <ul className="ml-3 mt-1 space-y-1">
              {pavimentosInfo.map(({ alias, floorName }) => (
                <li key={alias}>
                  <button
                    onClick={() => onSelectFloor(alias)}
                    className="text-gray-600 hover:text-blue-500 text-sm"
                  >
                    {floorName}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

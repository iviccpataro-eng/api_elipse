import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Power, AlertTriangle } from "lucide-react";

export default function VariableCard({ variable }) {
  const [tipo, nome, valor, unidade, show, referencia] = variable;

  // 🔹 AI e AO → valor analógico
  if (tipo === "AI" || tipo === "AO") {
    const min = referencia * 0.8;
    const max = referencia * 1.2;
    const dentroDoRange = valor >= min && valor <= max;

    const data = {
      datasets: [
        {
          data: [valor - min, max - valor],
          backgroundColor: [dentroDoRange ? "#22c55e" : "#ef4444", "#e5e7eb"],
          borderWidth: 0,
          circumference: 180,
          rotation: 270,
        },
      ],
    };

    return (
      <div className="bg-white rounded-2xl shadow p-4 text-center">
        <div className="text-gray-600 text-sm mb-2">{nome}</div>
        {show && (
          <div className="w-28 h-14 mx-auto">
            <Doughnut data={data} options={{ cutout: "70%", plugins: { legend: { display: false } } }} />
          </div>
        )}
        <div className={`text-xl font-semibold ${dentroDoRange ? "text-green-600" : "text-red-600"}`}>
          {valor} <span className="text-sm text-gray-500">{unidade}</span>
        </div>
        {tipo === "AO" && (
          <input
            type="number"
            defaultValue={valor}
            className="mt-2 w-20 border rounded text-center text-sm"
          />
        )}
      </div>
    );
  }

  // 🔹 DI e DO → variáveis digitais
  if (tipo === "DI" || tipo === "DO") {
    const estados = unidade?.split("/") || ["OFF", "ON"];
    const estadoAtual = valor ? estados[0] : estados[1];
    const emAlarme = show && valor !== referencia;

    return (
      <div className="bg-white rounded-2xl shadow p-4 text-center">
        <div className="text-gray-600 text-sm mb-2">{nome}</div>
        <div className={`text-lg font-semibold ${valor ? "text-green-600" : "text-red-600"}`}>
          {estadoAtual}
        </div>
        {emAlarme && <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mt-2" />}
        {tipo === "DO" && (
          <div className="flex justify-center gap-2 mt-2">
            <button className="px-2 py-1 bg-green-500 text-white rounded text-xs">Ligar</button>
            <button className="px-2 py-1 bg-red-500 text-white rounded text-xs">Desligar</button>
          </div>
        )}
      </div>
    );
  }

  // 🔹 MI e MO → multivariáveis
  if (tipo === "MI" || tipo === "MO") {
    const estados = unidade?.split("/") || [];
    const valorAtual = estados[valor] || "—";
    const emAlarme = show && valor !== referencia;

    return (
      <div className="bg-white rounded-2xl shadow p-4 text-center">
        <div className="text-gray-600 text-sm mb-2">{nome}</div>
        {tipo === "MI" ? (
          <div className="text-lg font-semibold text-gray-700">{valorAtual}</div>
        ) : (
          <select defaultValue={valor} className="border rounded text-sm p-1 w-full">
            {estados.map((e, i) => (
              <option key={i} value={i}>
                {e}
              </option>
            ))}
          </select>
        )}
        {emAlarme && <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mt-2" />}
      </div>
    );
  }

  return null;
}

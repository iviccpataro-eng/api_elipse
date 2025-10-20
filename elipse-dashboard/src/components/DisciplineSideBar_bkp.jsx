// src/components/DisciplineSidebar.jsx
export default function DisciplineSidebar({
  estrutura,
  onSelectBuilding,
  onSelectFloor,
}) {
  return (
    <div>
      {Object.entries(estrutura).map(([building, floors]) => (
        <div key={building} className="mb-4">
          <button
            onClick={() => onSelectBuilding(building)}
            className="block w-full text-left font-semibold text-blue-700 hover:text-blue-900"
          >
            🏢 {building}
          </button>

          <div className="ml-4 mt-2 space-y-1">
            {Object.keys(floors)
              .sort((a, b) => a.localeCompare(b))
              .map((floor) => (
                <button
                  key={floor}
                  onClick={() => {
                    onSelectBuilding(building);
                    onSelectFloor(floor);
                  }}
                  className="block w-full text-left text-gray-700 hover:text-blue-700"
                >
                  • {floor}
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

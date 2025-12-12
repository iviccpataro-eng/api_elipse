export default function NodeTooltip({ info }) {
    return (
        <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2
                    bg-white border border-gray-300 rounded-md p-3 shadow-lg
                    w-64 text-sm text-gray-700">
            <div className="font-semibold text-gray-800 mb-2">Detalhes</div>

            <div><strong>Descrição:</strong> {info.description}</div>
            <div><strong>Marca:</strong> {info.producer}</div>
            <div><strong>Modelo:</strong> {info.model}</div>
            <div><strong>Pavimento:</strong> {info.floor}</div>
            <div><strong>Prédio:</strong> {info.building}</div>
            <div><strong>Protocolo:</strong> {info.protocol}</div>
            <div><strong>Endereço:</strong> {info.address}</div>
            <div><strong>Último envio:</strong> {info["last-send"]}</div>
        </div>
    );
}

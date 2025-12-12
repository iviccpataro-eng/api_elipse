import { useCommTree } from "../../hooks/useComms";
import CommNode from "./CommNode";

export default function CommTree({ data }) {
    if (!data || data.length === 0) return <p>Nenhum dispositivo encontrado.</p>;

    return (
        <div className="w-full flex flex-col items-center py-6">
            {data.map((root) => (
                <CommNode key={root.deviceId} node={root} />
            ))}
        </div>
    );
}

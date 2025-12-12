import { useCommTree } from "../../hooks/useComms";
import CommNode from "./CommNode";

export default function CommTree() {
    const { tree, loading } = useCommTree();

    if (loading) return <p>Carregando estrutura...</p>;
    if (!tree || tree.length === 0) return <p>Nenhum dispositivo encontrado.</p>;

    return (
        <div className="w-full flex flex-col items-center py-6">
            {tree.map((root) => (
                <CommNode key={root.deviceId} node={root} />
            ))}
        </div>
    );
}

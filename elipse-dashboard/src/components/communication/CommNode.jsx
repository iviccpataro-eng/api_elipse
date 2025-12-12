import NodeBox from "./NodeBox";
import ConnectionLines from "./ConnectionLines";

export default function CommNode({ node }) {
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="flex flex-col items-center relative">
            <NodeBox info={node.info} />

            {hasChildren && (
                <>
                    <ConnectionLines
                        childrenCount={node.children.length}
                    />

                    <div className="flex justify-center gap-8 mt-2">
                        {node.children.map((child) => (
                            <CommNode key={child.deviceId} node={child} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

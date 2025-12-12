export default function ConnectionLines({ childrenCount = 0 }) {
    if (childrenCount === 0) return null;

    const multiple = childrenCount > 1;

    return (
        <div className="flex flex-col items-center">
            {/* Linha vertical descendo do pai */}
            <svg width="2" height="24">
                <line
                    x1="1"
                    y1="0"
                    x2="1"
                    y2="24"
                    stroke="#555"
                    strokeWidth="2"
                />
            </svg>

            {/* Linha horizontal se houver mais de 1 filho */}
            {multiple && (
                <svg width={childrenCount * 80} height="2" className="my-1">
                    <line
                        x1="0"
                        y1="1"
                        x2={childrenCount * 80}
                        y2="1"
                        stroke="#555"
                        strokeWidth="2"
                    />
                </svg>
            )}
        </div>
    );
}

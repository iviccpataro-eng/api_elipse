export default function ConnectionLines({ childrenCount }) {
    if (childrenCount === 0) return null;

    // Caso apenas 1 filho: linha vertical simples
    if (childrenCount === 1) {
        return (
            <svg
                width="2"
                height="40"
                className="absolute top-full left-1/2 -translate-x-1/2 z-0"
            >
                <line
                    x1="1"
                    y1="0"
                    x2="1"
                    y2="40"
                    stroke="#444"
                    strokeWidth="2"
                />
            </svg>
        );
    }

    // Caso múltiplos filhos
    const width = childrenCount * 160;

    return (
        <svg
            width={width}
            height="40"
            className="absolute top-full left-1/2 -translate-x-1/2 z-0"
        >
            {/* Linha vertical do pai */}
            <line
                x1={width / 2}
                y1="0"
                x2={width / 2}
                y2="20"
                stroke="#444"
                strokeWidth="2"
            />

            {/* Linha horizontal */}
            <line
                x1="20"
                y1="20"
                x2={width - 20}
                y2="20"
                stroke="#444"
                strokeWidth="2"
            />

            {/* Linhas verticais para cada filho */}
            {Array.from({ length: childrenCount }).map((_, index) => {
                const x = 80 + index * 160;
                return (
                    <line
                        key={index}
                        x1={x}
                        y1="20"
                        x2={x}
                        y2="40"
                        stroke="#444"
                        strokeWidth="2"
                    />
                );
            })}
        </svg>
    );
}

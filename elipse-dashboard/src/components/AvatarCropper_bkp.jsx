import React, { useRef, useState, useEffect } from "react";

/* ------------------------------------------------------------
   Este cropper usa apenas Canvas + drag + zoom
   Super leve — perfeito para avatar quadrado estilo Instagram
------------------------------------------------------------- */

export default function AvatarCropper({ imageSrc, onCancel, onCrop }) {
    const canvasRef = useRef(null);
    const imgRef = useRef(null);

    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // ===============================================
    // Carrega imagem
    // ===============================================
    useEffect(() => {
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            imgRef.current = img;
            draw();
        };
    }, [imageSrc]);

    // ===============================================
    // FUNÇÃO DE DESENHO
    // ===============================================
    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas || !imgRef.current) return;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const size = canvas.width; // quadrado

        const img = imgRef.current;

        const w = img.width * scale;
        const h = img.height * scale;

        const x = position.x + (size - w) / 2;
        const y = position.y + (size - h) / 2;

        ctx.drawImage(img, x, y, w, h);

        // Máscara quadrada
        ctx.strokeStyle = "#00A8FF";
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, size, size);
    };

    // ===============================================
    // Drag
    // ===============================================
    const startDrag = (e) => {
        setDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    };

    const duringDrag = (e) => {
        if (!dragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
        draw();
    };

    const endDrag = () => setDragging(false);

    // ===============================================
    // Zoom
    // ===============================================
    const changeZoom = (delta) => {
        let newScale = scale + delta;
        if (newScale < 0.5) newScale = 0.5;
        if (newScale > 3) newScale = 3;

        setScale(newScale);
        draw();
    };

    // ===============================================
    // Exportar o avatar recortado
    // ===============================================
    const handleCrop = () => {
        const canvas = canvasRef.current;

        canvas.toBlob(
            (blob) => {
                onCrop(blob);
            },
            "image/png",
            0.9
        );
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md">
                <h2 className="text-lg font-semibold mb-3">
                    Ajustar foto de perfil
                </h2>

                <div
                    className="relative mx-auto border rounded-lg overflow-hidden"
                    style={{ width: 300, height: 300 }}
                    onMouseDown={startDrag}
                    onMouseMove={duringDrag}
                    onMouseUp={endDrag}
                    onMouseLeave={endDrag}
                >
                    <canvas
                        ref={canvasRef}
                        width={300}
                        height={300}
                        className="cursor-grab active:cursor-grabbing"
                    />
                </div>

                {/* Controles */}
                <div className="flex items-center justify-between mt-3">
                    <button
                        onClick={() => changeZoom(-0.1)}
                        className="px-3 py-1 bg-gray-200 rounded-lg"
                    >
                        − Zoom
                    </button>

                    <button
                        onClick={() => changeZoom(+0.1)}
                        className="px-3 py-1 bg-gray-200 rounded-lg"
                    >
                        + Zoom
                    </button>
                </div>

                {/* Ações */}
                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded-lg">
                        Cancelar
                    </button>

                    <button
                        onClick={handleCrop}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Aplicar Recorte
                    </button>
                </div>
            </div>
        </div>
    );
}

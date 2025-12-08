// src/components/AvatarCropper.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * AvatarCropper (Canvas puro)
 *
 * Props:
 *  - imageSrc: dataURL / URL da imagem carregada
 *  - onCancel: () => void
 *  - onCrop: (blob) => void  // retorna um Blob PNG (400x400)
 *
 * Comportamento:
 *  - viewport quadrado fixo de 400x400 (pixels)
 *  - usuário pode arrastar para posicionar e usar o slider para dar zoom
 *  - ao "Crop", gera PNG 400x400 e retorna via onCrop
 *
 * Nota: usamos canvas para desenho e export (sem libs externas).
 */

export default function AvatarCropper({ imageSrc, onCancel, onCrop }) {
    const VIEWPORT = 400; // saída final (pixels) e tamanho do quadro de crop
    const canvasRef = useRef(null);
    const imgRef = useRef(null);

    // posição e escala para controlar o desenho da imagem SOB O VIEWPORT
    const [scale, setScale] = useState(1);
    const [minScale, setMinScale] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 }); // top-left da imagem dentro do viewport (em canvas coords)
    const [dragging, setDragging] = useState(false);
    const dragStart = useRef({ mx: 0, my: 0, x: 0, y: 0 });

    // Carrega a imagem e calcula escala mínima para cobrir o viewport
    useEffect(() => {
        if (!imageSrc) return;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            imgRef.current = img;

            // escala mínima: garante que a imagem cubra toda a área do viewport
            const scaleX = VIEWPORT / img.width;
            const scaleY = VIEWPORT / img.height;
            const min = Math.max(scaleX, scaleY, 0.1);
            setMinScale(min);
            setScale(min);

            // inicializa pos em maneira que centralize a imagem
            const drawW = img.width * min;
            const drawH = img.height * min;
            const startX = (VIEWPORT - drawW) / 2;
            const startY = (VIEWPORT - drawH) / 2;
            setPos({ x: startX, y: startY });

            // forçar redraw
            requestAnimationFrame(drawCanvas);
        };
        img.src = imageSrc;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageSrc]);

    // Redesenha canvas quando escala/pos/mudam
    useEffect(() => {
        drawCanvas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scale, pos]);

    // Desenha a imagem no canvas (viewport)
    function drawCanvas() {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;

        // padrão DPR pra ficar nítido em telas retina
        const dpr = window.devicePixelRatio || 1;
        canvas.width = VIEWPORT * dpr;
        canvas.height = VIEWPORT * dpr;
        canvas.style.width = VIEWPORT + "px";
        canvas.style.height = VIEWPORT + "px";

        const ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // ajustar para DPR (usamos css px depois)
        // fundo (para feedback visual)
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, VIEWPORT, VIEWPORT);

        // desenha a imagem de acordo com pos + scale
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        ctx.drawImage(img, pos.x, pos.y, drawW, drawH);

        // desenha borda do crop (opcional)
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.lineWidth = 2;
        ctx.strokeRect(0.5, 0.5, VIEWPORT - 1, VIEWPORT - 1); // borda leve
    }

    // Eventos de mouse/touch para pan
    function onPointerDown(e) {
        e.preventDefault();
        setDragging(true);
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
        const my = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
        dragStart.current = { mx, my, x: pos.x, y: pos.y };
    }

    function onPointerMove(e) {
        if (!dragging) return;
        e.preventDefault();
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
        const my = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;

        const dx = mx - dragStart.current.mx;
        const dy = my - dragStart.current.my;
        let nx = dragStart.current.x + dx;
        let ny = dragStart.current.y + dy;

        // limites: evitar que o canvas deixe área vazia. Calculamos limites com base no tamanho desenhado
        const img = imgRef.current;
        if (img) {
            const drawW = img.width * scale;
            const drawH = img.height * scale;
            // limites X
            const leftLimit = Math.min(0, VIEWPORT - drawW); // por exemplo drawW maior que viewport => leftLimit negativo
            const rightLimit = Math.max(0, VIEWPORT - drawW); // caso drawW < viewport
            // mas preferimos permitir somente que imagem cubra viewport: se drawW >= VIEWPORT, leftLimit = VIEWPORT - drawW (neg) ; rightLimit = 0
            const minX = Math.min(0, VIEWPORT - drawW);
            const maxX = Math.max(0, VIEWPORT - drawW) ? 0 : 0;
            // Ajusta: mais direto:
            const minAllowedX = Math.min(0, VIEWPORT - drawW);
            const maxAllowedX = 0;
            const minAllowedY = Math.min(0, VIEWPORT - drawH);
            const maxAllowedY = 0;

            nx = Math.max(minAllowedX - 20, Math.min(maxAllowedX + 20, nx)); // margem pequena de tolerância
            ny = Math.max(minAllowedY - 20, Math.min(maxAllowedY + 20, ny));
        }

        setPos({ x: nx, y: ny });
    }

    function onPointerUp() {
        setDragging(false);
    }

    // Zoom change: atualiza scale e ajusta pos para manter o ponto central
    function handleZoom(newScale) {
        const img = imgRef.current;
        if (!img) {
            setScale(newScale);
            return;
        }
        // queremos manter o centro do viewport apontando para o mesmo ponto da imagem ao trocar scale
        const centerX = VIEWPORT / 2;
        const centerY = VIEWPORT / 2;

        // ponto na imagem antes do zoom em coords da imagem natural:
        const imgXBefore = (centerX - pos.x) / scale;
        const imgYBefore = (centerY - pos.y) / scale;

        // nova pos tal que imgXBefore continue no centro:
        const newPosX = centerX - imgXBefore * newScale;
        const newPosY = centerY - imgYBefore * newScale;

        setScale(newScale);
        setPos({ x: newPosX, y: newPosY });
    }

    // Executa o crop: gera blob 400x400 PNG usando canvas
    function doCrop() {
        const img = imgRef.current;
        if (!img) return;

        // cria canvas temporário com tamanho VIEWPORT (em device pixels)
        const outCanvas = document.createElement("canvas");
        outCanvas.width = VIEWPORT;
        outCanvas.height = VIEWPORT;
        const ctx = outCanvas.getContext("2d");

        // desenha com as mesmas transformações usadas na renderização
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, VIEWPORT, VIEWPORT);

        ctx.drawImage(
            img,
            pos.x / 1, // pos.x está em px, relativo à viewport
            pos.y / 1,
            img.width * scale,
            img.height * scale
        );

        // converte para blob (PNG)
        outCanvas.toBlob(
            (blob) => {
                if (!blob) {
                    alert("Falha ao gerar imagem. Tente novamente.");
                    return;
                }
                // garante o tamanho de pelo menos VIEWPORT x VIEWPORT (já está)
                onCrop(blob);
            },
            "image/png",
            0.92
        );
    }

    // ESC para cancelar
    useEffect(() => {
        function onKey(e) {
            if (e.key === "Escape") onCancel();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden">
                {/* header */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="font-semibold">Recortar Foto de Perfil</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCancel}
                            className="px-3 py-1 rounded hover:bg-gray-100 text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={doCrop}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                            Recortar e Salvar
                        </button>
                    </div>
                </div>

                <div className="p-4 flex flex-col md:flex-row gap-4">
                    {/* Canvas viewport */}
                    <div className="flex-shrink-0">
                        <div className="w-[400px] h-[400px] bg-gray-100 rounded-md overflow-hidden border">
                            <canvas
                                ref={canvasRef}
                                className="w-full h-full touch-pan-y"
                                onMouseDown={onPointerDown}
                                onMouseMove={onPointerMove}
                                onMouseUp={onPointerUp}
                                onMouseLeave={onPointerUp}
                                onTouchStart={(e) => onPointerDown(e)}
                                onTouchMove={(e) => onPointerMove(e)}
                                onTouchEnd={onPointerUp}
                                role="img"
                                aria-label="Área de recorte da imagem"
                            />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex-1 flex flex-col justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-2">
                                Ajuste a posição arrastando a imagem. Use o slider para dar zoom.
                            </p>

                            <div className="mt-3">
                                <label className="text-xs text-gray-500">Zoom</label>
                                <input
                                    type="range"
                                    min={minScale}
                                    max={Math.max(minScale * 4, minScale + 0.1)}
                                    step={0.01}
                                    value={scale}
                                    onChange={(e) => handleZoom(Number(e.target.value))}
                                    className="w-full mt-2"
                                />
                            </div>

                            <div className="mt-4 text-sm text-gray-700">
                                <p>
                                    Saída: <strong>{VIEWPORT}×{VIEWPORT}px</strong> (PNG).
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Garantimos recorte quadrado. Mantenha o elemento importante da foto centrado.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={onCancel}
                                className="px-3 py-2 rounded border hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={doCrop}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Salvar Recorte
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

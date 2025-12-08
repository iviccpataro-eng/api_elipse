// services/processAvatar.js
import sharp from "sharp";
import fs from "fs";
import path from "path";

/**
 * processAvatar
 * - inputPath: caminho do arquivo de upload (ex: uploads/avatars/tmpname.jpg)
 * - username: nome do usuário (usado para nome final do arquivo)
 *
 * Retorna caminho relativo do arquivo processado (ex: 'uploads/avatars/username.webp')
 *
 * Regras:
 * - valida dimensões mínimas: 400x400
 * - redimensiona para 800x800 (mantendo proporção) e depois gera 400x400 (centrado) OR fazer resize 400x400 crop center
 * - converte para WebP otimizado
 * - apaga o arquivo original enviado
 */
export async function processAvatar(inputPath, username = "avatar") {
  const uploadDir = path.resolve("uploads", "avatars");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  // nome final
  const finalFilename = `${username}.webp`;
  const finalPath = path.join(uploadDir, finalFilename);

  try {
    // ler metadados
    const image = sharp(inputPath);
    const meta = await image.metadata();

    // valida dimensões (mínimo 400x400)
    const minSize = 400;
    const width = meta.width || 0;
    const height = meta.height || 0;

    if (width < minSize || height < minSize) {
      // remove arquivo temporário
      try { fs.unlinkSync(inputPath); } catch (e) {}
      throw new Error(`Imagem muito pequena. Minimo: ${minSize}x${minSize}px (enviada: ${width}x${height}).`);
    }

    // Process:
    // - crop center para garantir proporção quadrada
    // - redimensionar para 400x400 (min required) ou 800x800 para qualidade -> aqui 400x400 suficiente
    // - converter para webp com qualidade 80
    await image
      .resize({
        width: 800,
        height: 800,
        fit: sharp.fit.cover,
        position: sharp.strategy.attention, // melhor corte automático
      })
      .resize(400, 400) // garante 400x400 final
      .webp({ quality: 80, effort: 6 })
      .toFile(finalPath);

    // remove o arquivo original recebido
    try {
      if (inputPath !== finalPath && fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }
    } catch (e) {
      // não fatal
      console.warn("[processAvatar] não conseguiu remover original:", e.message);
    }

    // retorna caminho relativo a partir da raiz do projeto (para servir publicamente)
    // por exemplo: 'uploads/avatars/username.webp'
    return path.join("uploads", "avatars", finalFilename).replace(/\\/g, "/");
  } catch (err) {
    // em caso de erro, tenta remover o input temporário
    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch (e) {}
    throw err;
  }
}

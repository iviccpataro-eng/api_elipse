import sharp from "sharp";
import path from "path";

export const processAvatar = async (filePath) => {
    const outputPath = filePath.replace(/\.(png|jpg|jpeg|webp)$/i, ".webp");

    await sharp(filePath)
        .resize(256, 256, { fit: "cover" })
        .webp({ quality: 80 })
        .toFile(outputPath);

    return outputPath;
};

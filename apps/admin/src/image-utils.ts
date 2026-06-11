import imageCompression from "browser-image-compression";

const MAX_IMAGE_SIZE_MB = 200 / 1024;

type CompressImageOptions = {
  maxWidthOrHeight: number;
};

export async function compressImageToWebp(
  file: File,
  { maxWidthOrHeight }: CompressImageOptions,
) {
  const compressedBlob = await imageCompression(file, {
    maxSizeMB: MAX_IMAGE_SIZE_MB,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: "image/webp",
  });

  return new File([compressedBlob], toWebpFileName(file.name), {
    type: "image/webp",
  });
}

function toWebpFileName(fileName: string) {
  const baseName = fileName.replace(/\.[^/.]+$/, "") || "image";
  return `${baseName}.webp`;
}

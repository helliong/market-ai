export type BadgeCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const BADGE_CORNERS: BadgeCorner[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

const TOP_CORNER_BIAS = 14;

function getPixelLuminance(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function sampleCornerLuminance(
  img: HTMLImageElement,
  corner: BadgeCorner,
): number {
  if (!img.naturalWidth || !img.naturalHeight) {
    return 255;
  }

  const canvas = document.createElement("canvas");
  const sampleSize = 28;
  canvas.width = sampleSize;
  canvas.height = sampleSize;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return 255;
  }

  const regionWidth = img.naturalWidth * 0.3;
  const regionHeight = img.naturalHeight * 0.16;
  const startX =
    corner === "top-right" || corner === "bottom-right"
      ? Math.max(0, img.naturalWidth - regionWidth)
      : 0;
  const startY =
    corner === "bottom-left" || corner === "bottom-right"
      ? Math.max(0, img.naturalHeight - regionHeight)
      : 0;

  ctx.drawImage(
    img,
    startX,
    startY,
    regionWidth,
    regionHeight,
    0,
    0,
    sampleSize,
    sampleSize,
  );

  const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);
  let sum = 0;
  const pixels = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    sum += getPixelLuminance(data[i], data[i + 1], data[i + 2]);
  }

  return sum / pixels;
}

/** Ищет самый тёмный угол под размер плашки «Реклама». */
export function findDarkestBadgeCorner(img: HTMLImageElement): BadgeCorner {
  const ranked = BADGE_CORNERS.map((corner) => ({
    corner,
    luminance: sampleCornerLuminance(img, corner),
  })).sort((a, b) => a.luminance - b.luminance);

  const darkest = ranked[0]?.luminance ?? 0;
  const preferredTop = ranked.find(
    (item) =>
      item.corner.startsWith("top") &&
      item.luminance <= darkest + TOP_CORNER_BIAS,
  );

  return preferredTop?.corner ?? ranked[0]?.corner ?? "top-right";
}

export const BADGE_CORNER_CLASSES: Record<BadgeCorner, string> = {
  "top-left": "left-3 top-3 sm:left-4 sm:top-4",
  "top-right": "right-3 top-3 sm:right-4 sm:top-4",
  "bottom-left": "left-3 bottom-3 sm:left-4 sm:bottom-4",
  "bottom-right": "right-3 bottom-3 sm:right-4 sm:bottom-4",
};

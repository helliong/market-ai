export type ProductImageLike = {
  url: string;
  isMain?: boolean;
  sortOrder?: number;
};

export function getMainProductImageUrl(
  images?: ProductImageLike[] | null,
): string | undefined {
  if (!images?.length) {
    return undefined;
  }

  return (
    images.find((image) => image.isMain)?.url ??
    [...images].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))[0]?.url
  );
}

type PresignedUploadResponse = {
  uploadUrl?: string;
  publicUrl?: string;
  url?: string;
  presignedUrl?: string;
};

const STORAGE_API_URL =
  import.meta.env.VITE_STORAGE_API_URL ?? "http://127.0.0.1:4005";

export async function uploadProductImage(file: File) {
  const response = await fetch(`${STORAGE_API_URL}/uploads/presigned-url`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      folder: "products",
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | PresignedUploadResponse
    | null;

  if (!response.ok || !data) {
    throw new Error(formatStorageError(data) ?? "Failed to prepare image upload");
  }

  const uploadUrl = data.uploadUrl ?? data.presignedUrl;
  const publicUrl = data.publicUrl ?? data.url;

  if (!uploadUrl || !publicUrl) {
    throw new Error("Storage service returned invalid upload data");
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload image");
  }

  return publicUrl;
}

function formatStorageError(data: unknown) {
  if (!data || typeof data !== "object") {
    return null;
  }

  const payload = data as { message?: string | string[]; error?: string };

  if (Array.isArray(payload.message)) {
    return payload.message.join("\n");
  }

  return payload.message ?? payload.error ?? null;
}

import { HEIC_MESSAGE, HEIC_TYPES, MAX_FILE_BYTES, MAX_FILES, rejectReason } from "@/lib/images";

const MAX_EDGE = 2000;
const QUALITY = 0.82;

export function validateClientFile(file: File): string | null {
  if (HEIC_TYPES.includes(file.type as (typeof HEIC_TYPES)[number])) {
    return HEIC_MESSAGE;
  }
  return rejectReason(file.type, file.size);
}

export function validateBatchCount(count: number): string | null {
  if (count < 1) return "Choose at least one image.";
  if (count > MAX_FILES) return "Up to 10 images at a time.";
  return null;
}

export async function resizeToJpeg(file: File): Promise<Blob> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Each image must be under 8 MB.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      file.type.startsWith("image/hei")
        ? HEIC_MESSAGE
        : "That file type is not supported.",
    );
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Could not process that image.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", QUALITY);
  });
  if (!blob) throw new Error("Could not process that image.");
  return blob;
}

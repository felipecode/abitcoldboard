export const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const HEIC_TYPES = ["image/heic", "image/heif"] as const;
export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const MAX_FILES = 10;
export const MAX_CAPTION = 200;
export const HEIC_MESSAGE =
  "Export as JPEG, or pick the photo again from the upload sheet.";

const MAGIC: { type: (typeof ALLOWED_TYPES)[number]; test: (bytes: Uint8Array) => boolean }[] = [
  { type: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: "image/png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { type: "image/gif", test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
  {
    type: "image/webp",
    test: (b) =>
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
];

export function rejectReason(type: string, size: number): string | null {
  if (HEIC_TYPES.includes(type as (typeof HEIC_TYPES)[number])) {
    return HEIC_MESSAGE;
  }
  if (type && !ALLOWED_TYPES.includes(type as (typeof ALLOWED_TYPES)[number])) {
    return "That file type is not supported.";
  }
  if (size > MAX_FILE_BYTES) {
    return "Each image must be under 8 MB.";
  }
  return null;
}

export function sniffImageType(bytes: Uint8Array): (typeof ALLOWED_TYPES)[number] | null {
  return MAGIC.find((entry) => entry.test(bytes))?.type ?? null;
}

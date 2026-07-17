/**
 * Cloudinary / S3 adapter stub.
 * Local FS (design + session storage) is the default until credentials are set.
 */

export type CloudAsset = {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  bytes?: number;
};

export function isCloudStorageConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim(),
  );
}

export function isS3Configured(): boolean {
  return Boolean(
    process.env.AWS_S3_BUCKET?.trim() &&
      process.env.AWS_ACCESS_KEY_ID?.trim() &&
      process.env.AWS_SECRET_ACCESS_KEY?.trim(),
  );
}

/**
 * Upload SVG/PNG print asset. Throws until Cloudinary/S3 env is configured.
 * Callers should fall back to local `/api/design/{id}?format=svg` URLs.
 */
export async function uploadPrintAsset(_input: {
  data: string | Buffer;
  filename: string;
  folder?: string;
  contentType?: string;
}): Promise<CloudAsset> {
  void _input;
  if (isCloudStorageConfigured()) {
    throw new Error(
      "Cloudinary credentials present but upload adapter not wired yet — use local design URLs or implement uploadPrintAsset.",
    );
  }
  if (isS3Configured()) {
    throw new Error(
      "S3 credentials present but upload adapter not wired yet — use local design URLs or implement uploadPrintAsset.",
    );
  }
  throw new Error(
    "Cloud storage not configured. Set CLOUDINARY_* or AWS_S3_* env vars.",
  );
}

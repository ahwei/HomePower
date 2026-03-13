import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function compressImage(
  file: File,
  options: { maxSizeMB: number; maxWidthOrHeight: number }
): Promise<File> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("僅支援 JPG、PNG、WebP 格式");
  }
  return imageCompression(file, {
    ...options,
    fileType: "image/webp",
    useWebWorker: true,
  });
}

export async function uploadToStorage(
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFromStorage(
  bucket: string,
  path: string
): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from(bucket).remove([path]);
}

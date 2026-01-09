import { del } from "@vercel/blob";

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  return result.url;
}

export async function deleteImage(imageUrl: string) {
  if (!imageUrl) return;

  try {
    const url = new URL(imageUrl);
    const pathname = url.pathname.substring(1);

    await del(pathname);
  } catch (error) {
    console.error("Erro ao deletar imagem:", error);
  }
}

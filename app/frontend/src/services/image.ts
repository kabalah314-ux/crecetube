// image.ts — reescala una imagen a un data-URL ligero (se guarda dentro del VideoProject
// en la BD, así que evitamos miniaturas pesadas). Sin filesystem: apto para serverless.
export async function fileToThumbnailDataUrl(file: File, maxW = 800, quality = 0.82): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error("No se pudo leer el archivo"));
    fr.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("No se pudo decodificar la imagen"));
    im.src = dataUrl;
  });

  const escala = Math.min(1, maxW / img.width);
  const w = Math.round(img.width * escala);
  const h = Math.round(img.height * escala);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl; // fallback: data-url original
  ctx.drawImage(img, 0, 0, w, h);
  // JPEG para peso bajo; conserva PNG solo si era pequeño y con transparencia no crítica
  return canvas.toDataURL("image/jpeg", quality);
}

const TARGET_SIZE_KB = 200; // aim for ~200KB per photo
const MAX_WIDTH = 1200;
const MIN_QUALITY = 0.4;
const MAX_QUALITY = 0.85;

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onerror = () => reject(new Error("Failed to load image"));

    img.onload = async () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      // Scale down if needed
      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = (height * MAX_WIDTH) / width;
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Try high quality first; if too large, reduce iteratively
      let quality = MAX_QUALITY;
      let blob: Blob | null = null;

      while (quality >= MIN_QUALITY) {
        blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, "image/jpeg", quality)
        );
        if (blob && blob.size <= TARGET_SIZE_KB * 1024) break;
        quality -= 0.1;
      }

      // If still too large, scale down further
      if (blob && blob.size > TARGET_SIZE_KB * 1024) {
        const scale = Math.sqrt((TARGET_SIZE_KB * 1024) / blob.size);
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, "image/jpeg", MIN_QUALITY)
        );
      }

      URL.revokeObjectURL(img.src);
      resolve(blob!);
    };

    img.src = URL.createObjectURL(file);
  });
}

export async function uploadPhoto(
  familyId: string,
  reportId: string,
  file: File
): Promise<string> {
  const compressed = await compressImage(file);

  const formData = new FormData();
  formData.append("file", compressed, `${reportId}.jpg`);
  formData.append("familyId", familyId);
  formData.append("reportId", reportId);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Photo upload failed");
  }

  const { url } = await res.json();
  return url;
}

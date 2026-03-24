import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

function compressImage(file: File, maxWidth = 1024, quality = 0.6): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob!),
        "image/jpeg",
        quality
      );
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
  const storageRef = ref(
    storage,
    `families/${familyId}/photos/${reportId}.jpg`
  );
  await uploadBytes(storageRef, compressed, {
    contentType: "image/jpeg",
  });
  return getDownloadURL(storageRef);
}

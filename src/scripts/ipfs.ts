import { PinataSDK } from "pinata";
import { config } from "../config";

const pinata = new PinataSDK({
  pinataJwt: config.pinataJwt,
  pinataGateway: config.pinataGateway,
  
});


function getFileExtensionFromMime(file: File | Blob): string {
  const mimeToExt: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "application/pdf": "pdf",
    "text/plain": "txt",
    "application/json": "json",
  };

  return mimeToExt[file.type] || "unknown";
}

function getFileExtension(file: File | Blob): string {
  if (file instanceof File) {
    return file.name.split(".").pop() || getFileExtensionFromMime(file);
  }
  return getFileExtensionFromMime(file);
}

/**
 * Загружает изображение в IPFS и возвращает его CID
 * @param fileName - имя файла
 * @param file - объект File или Blob
 * @returns CID загруженного файла
 */
export async function uploadImageToIPFS(fileName: string, fileData: File | Blob): Promise<string> {
  try {
    let fileExtension = getFileExtension(fileData);
    console.log("Расширение файла:", fileExtension);

    if (fileExtension !== "png" && fileExtension !== "jpg") {
      throw new Error("Неправильный формат изображения");
    }

    const file = new File([fileData], `${fileName}.${fileExtension}`, { type: `image/${fileExtension}` });

    const result = await pinata.upload.public.file(file);
    console.log("Файл загружен в IPFS с CID:", result.cid);
    return result.cid;
  } catch (error) {
    console.error("Ошибка загрузки в IPFS:", error);
    throw new Error("Не удалось загрузить изображение в IPFS");
  }
}

/**
 * Загружает JSON в IPFS и возвращает его CID
 * @param jsonData - данные в формате JSON
 * @returns CID загруженного JSON
 */
export async function uploadJSONToIPFS(jsonData: any): Promise<string> {
  try {
    const result = await pinata.upload.public.json(jsonData);
    console.log("Файл загружен в IPFS с CID:", result.cid);
    return result.cid;
  } catch (error) {
    console.error("Ошибка загрузки в IPFS:", error);
    throw new Error("Не удалось загрузить JSON в IPFS");
  }
}

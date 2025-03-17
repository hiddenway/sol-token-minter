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

// Пример использования
const blob = new Blob(["content"], { type: "image/png" });
console.log(getFileExtensionFromMime(blob)); // "png"


function getFileExtension(file: File | Blob): string {
  if (file instanceof File) {
    return file.name.split('.').pop() || getFileExtensionFromMime(file);
  }
  return getFileExtensionFromMime(file);
}


/**
 * Загружает изображение в IPFS и возвращает его CID
 * @param file - объект File или Blob
 * @returns CID загруженного файла
 */
export async function uploadImageToIPFS(fileName: string, file: File | Blob): Promise<string> {
  const pinataApiKey = "bfdaa4df0081b1949b5f";
  const pinataSecretApiKey = "3c4be9820fbd7eb95c78fe415325ac1edb6b2634ca82b4ae5c536c63ac0b5f68";

  const formData = new FormData();
  formData.append("file", file);

  const metadata = JSON.stringify({
    name: fileName + "." + getFileExtension(file), // Здесь указываем название файла
  });

  formData.append("pinataMetadata", metadata);

  try {
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        body: formData,
        headers: {
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretApiKey,
        },
      }
    );

    const data = await response.json();
    console.log("Файл загружен в IPFS с CID:", data.IpfsHash);
    return data.IpfsHash;
  } catch (error) {
    console.error("Ошибка загрузки в IPFS:", error);
    throw new Error("Не удалось загрузить изображение в IPFS");
  }
}

export async function uploadJSONToIPFS(jsonData: any): Promise<string> {
  const pinataApiKey = "bfdaa4df0081b1949b5f";
  const pinataSecretApiKey = "3c4be9820fbd7eb95c78fe415325ac1edb6b2634ca82b4ae5c536c63ac0b5f68";

  try {
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretApiKey,
        },
        body: JSON.stringify({
          pinataContent: jsonData,
        }),
      }
    );

    const data = await response.json();

    console.log("Файл загружен в IPFS с CID:", data.IpfsHash);
    return data.IpfsHash;
  } catch (error) {
    console.error("Ошибка загрузки в IPFS:", error);
    throw new Error("Не удалось загрузить изображение в IPFS");
  }
}

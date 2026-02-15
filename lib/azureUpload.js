// lib/azureUpload.js
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from "@azure/storage-blob";

function parseConnString(conn) {
  const out = {};
  if (!conn || typeof conn !== "string") return out;

  for (const part of conn.split(";")) {
    if (!part) continue;
    const [k, ...rest] = part.split("=");
    if (!k) continue;
    out[k] = rest.join("=");
  }
  return out;
}

function getAccountNameAndKey() {
  const envName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const envKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  if (envName && envKey) return { accountName: envName, accountKey: envKey };

  const parsed = parseConnString(process.env.AZURE_STORAGE_CONNECTION_STRING);
  if (parsed.AccountName && parsed.AccountKey) {
    return { accountName: parsed.AccountName, accountKey: parsed.AccountKey };
  }

  return { accountName: "", accountKey: "" };
}

export function makeBlobReadSasUrl({
  blobUrl,
  blobName,
  containerName,
  expiresInMinutes = 60 * 24,
}) {
  if (!blobUrl) return "";

  const { accountName, accountKey } = getAccountNameAndKey();

  // If we can't generate SAS (missing key), return the plain URL.
  // This will only play if the container is public.
  if (!accountName || !accountKey || !containerName || !blobName) {
    return blobUrl;
  }

  const credential = new StorageSharedKeyCredential(accountName, accountKey);
  const expiresOn = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  const sas = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      expiresOn,
    },
    credential,
  ).toString();

  return `${blobUrl}?${sas}`;
}

export async function uploadMp4ToAzure({ buffer, blobName }) {
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "videos";

  if (!conn) throw new Error("Missing AZURE_STORAGE_CONNECTION_STRING");
  if (!blobName) throw new Error("Missing blobName for upload");

  const service = BlobServiceClient.fromConnectionString(conn);
  const container = service.getContainerClient(containerName);

  await container.createIfNotExists();

  const blob = container.getBlockBlobClient(blobName);

  await blob.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: "video/mp4" },
  });

  const plainUrl = blob.url;
  const signedUrl = makeBlobReadSasUrl({
    blobUrl: plainUrl,
    blobName,
    containerName,
    expiresInMinutes: 60 * 24,
  });

  return { blobName, plainUrl, signedUrl };
}

export async function uploadAudioToAzure({ buffer, blobName }) {
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName =
    process.env.AZURE_STORAGE_CONTAINER_NAME || "videos";

  if (!conn) throw new Error("Missing AZURE_STORAGE_CONNECTION_STRING");
  if (!blobName) throw new Error("Missing blobName for upload");

  const service = BlobServiceClient.fromConnectionString(conn);
  const container = service.getContainerClient(containerName);

  await container.createIfNotExists();

  const blob = container.getBlockBlobClient(blobName);

  await blob.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: "audio/mpeg" },
  });

  const plainUrl = blob.url;
  const signedUrl = makeBlobReadSasUrl({
    blobUrl: plainUrl,
    blobName,
    containerName,
    expiresInMinutes: 60 * 24,
  });

  return { blobName, plainUrl, signedUrl };
}

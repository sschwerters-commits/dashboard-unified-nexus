import { google, drive_v3 } from "googleapis";
import { PassThrough } from "stream";

const DEFAULT_FILE_NAME = process.env.GOOGLE_DRIVE_FILE_NAME ?? "unified-dashboard-agents.json";
const DEFAULT_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost";
const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

let cachedFileId: string | null = null;

function hasDriveConfig() {
  return (
    !!process.env.GOOGLE_CLIENT_ID &&
    !!process.env.GOOGLE_CLIENT_SECRET &&
    !!process.env.GOOGLE_REFRESH_TOKEN
  );
}

function getOAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error("Google Drive no está configurado. Define GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN.");
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    DEFAULT_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return oauth2Client;
}

async function getDriveClient() {
  const auth = getOAuthClient();
  return google.drive({ version: "v3", auth });
}

async function findFileId(existingDrive?: drive_v3.Drive) {
  if (process.env.GOOGLE_DRIVE_FILE_ID) {
    return process.env.GOOGLE_DRIVE_FILE_ID;
  }

  if (cachedFileId) {
    return cachedFileId;
  }

  const drive = existingDrive ?? (await getDriveClient());

  const queryParts = [`name='${DEFAULT_FILE_NAME}'`, "trashed=false"];
  if (driveFolderId) {
    queryParts.push(`'${driveFolderId}' in parents`);
  }
  const q = queryParts.join(" and ");

  const list = await drive.files.list({
    q,
    fields: "files(id, name)",
    pageSize: 1,
  });

  if (list.data.files && list.data.files.length > 0) {
    cachedFileId = list.data.files[0].id ?? null;
    return cachedFileId;
  }

  return null;
}

async function createFile(initialBody: string, existingDrive?: drive_v3.Drive) {
  const drive = existingDrive ?? (await getDriveClient());

  const requestBody: drive_v3.Schema$File = {
    name: DEFAULT_FILE_NAME,
    mimeType: "application/json",
  };

  if (driveFolderId) {
    requestBody.parents = [driveFolderId];
  }

  const response = await drive.files.create({
    requestBody,
    media: {
      mimeType: "application/json",
      body: createStream(initialBody),
    },
    fields: "id",
  });

  cachedFileId = response.data.id ?? null;
  return cachedFileId;
}

function createStream(body: string) {
  const stream = new PassThrough();
  stream.end(body);
  return stream;
}

export async function ensureDriveFile(initialBody: string) {
  if (!hasDriveConfig()) {
    return null;
  }

  const drive = await getDriveClient();
  const existingId = await findFileId(drive);

  if (existingId) {
    return existingId;
  }

  return createFile(initialBody, drive);
}

export async function readDriveFile(fileId: string) {
  const drive = await getDriveClient();
  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(response.data as ArrayBuffer).toString("utf-8");
}

export async function writeDriveFile(fileId: string, body: string) {
  const drive = await getDriveClient();
  await drive.files.update({
    fileId,
    media: {
      mimeType: "application/json",
      body: createStream(body),
    },
  });
}

export function driveAvailable() {
  return hasDriveConfig();
}

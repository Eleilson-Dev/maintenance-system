import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { r2Client } from "./r2.js";

const bucketName = process.env.R2_BUCKET_NAME;

if (!bucketName) {
  throw new Error("R2_BUCKET_NAME is missing.");
}

type GenerateUploadUrlParams = {
  key: string;
  contentType: string;
};

type GenerateReadUrlParams = {
  key: string;
};

type DeleteObjectParams = {
  key: string;
};

type ObjectExistsParams = {
  key: string;
};

export async function generateR2UploadUrl({
  key,
  contentType,
}: GenerateUploadUrlParams) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(r2Client, command, {
    expiresIn: 300,
  });
}

export async function generateR2ReadUrl({ key }: GenerateReadUrlParams) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(r2Client, command, {
    expiresIn: 900,
  });
}

export async function deleteR2Object({ key }: DeleteObjectParams) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await r2Client.send(command);
}

export async function r2ObjectExists({ key }: ObjectExistsParams) {
  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
    );

    return true;
  } catch (error) {
    if (typeof error === "object" && error !== null && "$metadata" in error) {
      const metadata = (
        error as {
          $metadata?: {
            httpStatusCode?: number;
          };
        }
      ).$metadata;

      if (metadata?.httpStatusCode === 404) {
        return false;
      }
    }

    throw error;
  }
}

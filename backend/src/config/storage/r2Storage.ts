import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { r2Client } from "./r2.js";

const bucketName = process.env.R2_BUCKET_NAME;

if (!bucketName) {
  throw new Error("R2_BUCKET_NAME is missing.");
}

type UploadR2ObjectParams = {
  key: string;
  body: Buffer;
  contentType: string;
};

type GenerateReadUrlParams = {
  key: string;
};

type DeleteObjectParams = {
  key: string;
};

export async function uploadR2Object({
  key,
  body,
  contentType,
}: UploadR2ObjectParams) {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return {
    storageKey: key,
  };
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
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
  );
}

import { PutObjectCommand } from "@aws-sdk/client-s3";

import { r2Client } from "./r2.js";

export async function testR2Upload() {
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("R2_BUCKET_NAME is missing.");
  }

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,

      Key: "tests/r2-test.txt",

      Body: Buffer.from("mxOS conectado ao Cloudflare R2", "utf-8"),

      ContentType: "text/plain",
    }),
  );

  console.log("✅ R2 upload realizado com sucesso.");
}

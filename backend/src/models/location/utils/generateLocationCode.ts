import crypto from "node:crypto";
import { prisma } from "../../../config/db/database.js";

export const generateLocationCode = async () => {
  while (true) {
    const code = `LOC-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    const exists = await prisma.location.findUnique({
      where: {
        locationCode: code,
      },
    });

    if (!exists) {
      return code;
    }
  }
};

import { createHash, randomUUID } from "node:crypto";

export const generateProtocol = (prefix = "CAL"): string => {
  const year = new Date().getFullYear();

  const uuid = randomUUID();

  const hash = createHash("sha256")
    .update(uuid + Date.now().toString() + Math.random())
    .digest("hex")
    .toUpperCase();

  const part1 = hash.slice(0, 4);
  const part2 = hash.slice(4, 8);

  return `${prefix}-${year}-${part1}-${part2}`;
};

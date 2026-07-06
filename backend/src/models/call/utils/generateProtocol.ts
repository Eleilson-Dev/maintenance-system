export const generateProtocol = (count: number, prefix = "CAL"): string => {
  const year = new Date().getFullYear();

  const number = count.toString().padStart(8, "0");

  return `${prefix}-${year}-${number}`;
};

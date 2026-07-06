export const generateProtocol = (sequence: number, prefix = "CAL"): string => {
  const year = new Date().getFullYear();

  return `${prefix}-${year}-${sequence.toString().padStart(6, "0")}`;
};

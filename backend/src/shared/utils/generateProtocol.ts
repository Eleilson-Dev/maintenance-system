export const generateProtocol = (count: number, prefix = "CH"): string => {
  const year = new Date().getFullYear();

  return `#${prefix}-${year}-${String(count).padStart(6, "0")}`;
};

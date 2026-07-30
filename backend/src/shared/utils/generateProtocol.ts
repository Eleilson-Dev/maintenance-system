export const generateProtocol = (count: number, prefix = "OS"): string => {
  const year = new Date().getFullYear();

  return `#${prefix}-${year}-${String(count).padStart(6, "0")}`;
};

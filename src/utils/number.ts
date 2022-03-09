export const parseNumber = (value: string | undefined | null, fallback: number): number => {
  if (value === undefined || value === null || value.trim() === "") {
    return fallback;
  }

  const result = Number(value);

  return Number.isNaN(result) ? fallback : result;
};

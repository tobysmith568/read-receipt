export const parseNumber = (value: string | undefined | null, fallback: number): number => {
  const result = Number(value);

  return isNaN(result) ? fallback : result;
};

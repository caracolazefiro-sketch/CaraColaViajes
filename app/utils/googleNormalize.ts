export const normalizeForGoogle = (text: string) => {
  const parts = text.split(',');
  const location = parts.length > 1 ? `${parts[0].trim()}, ${parts[1].trim()}` : text.trim();
  return location.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

export const normalizeForComparison = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

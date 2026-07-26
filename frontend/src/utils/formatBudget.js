export const formatBudget = (min, max) => {
  if (min === max) return `₹${min}`;
  return `₹${min}–₹${max}`;
};

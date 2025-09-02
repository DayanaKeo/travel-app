export function generateSharePin(): string {
  const digits = () => Math.floor(Math.random() * 10);
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const letter = letters[Math.floor(Math.random() * letters.length)];
  return `${digits()}${digits()}${digits()}${digits()}${digits()}${letter}`;
}

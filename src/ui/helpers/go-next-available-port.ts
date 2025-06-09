export const getNextAvailablePort = (used: number[], start: number): number => {
  let port = start;
  while (used.includes(port)) {
    port++;
  }
  return port;
};

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Environment variable ${name} is required but was not found.`);
  }
  return v;
}

export default requireEnv;

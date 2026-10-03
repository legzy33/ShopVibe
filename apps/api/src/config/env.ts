const getRequiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }

  return value;
};

const parseOptionalListEnv = (name: string): Set<string> => {
  const value = process.env[name];

  if (!value) {
    return new Set();
  }

  return new Set(
    value
      .split(',')
      .map(item => item.trim().toLowerCase())
      .filter(Boolean)
  );
};

export const JWT_SECRET = getRequiredEnv('JWT_SECRET');
export const ADMIN_EMAILS = parseOptionalListEnv('ADMIN_EMAILS');

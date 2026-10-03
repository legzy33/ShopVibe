// Must be imported before any module that reads process.env.
// In production the variables come from the host, so a missing .env is fine.
try {
  process.loadEnvFile();
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
    throw error;
  }
}

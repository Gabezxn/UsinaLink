// Variáveis do backend de teste (banco local, segredos só de QA). Compartilhado por up.mjs e testes que sobem outra instância.
export const PGPORT = 54329;
export function backendEnv(overrides = {}) {
  return { ...process.env, PORT: '3000', DB_TYPE: 'postgres', DB_HOST: 'localhost', DB_PORT: String(PGPORT), DB_USERNAME: 'postgres', DB_PASSWORD: '', DB_NAME: 'usinalink_qa', DB_SSL: 'false', DB_SYNCHRONIZE: 'true', JWT_SECRET: 'qa-only-secret-qa-only-secret-qa-only', THROTTLE_LIMIT: '100000', LOGIN_THROTTLE_LIMIT: '1000', SEED_ADMIN_PASSWORD: 'Admin@QA-123', ALLOWED_ORIGINS: 'http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000', ...overrides };
}

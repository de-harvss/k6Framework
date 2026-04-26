// Select an environment at runtime: k6 run --env ENV=staging
// Secrets must be passed via --env flags, never hard-coded here.

const ENV = __ENV.ENV || 'dev';

export interface EnvConfig {
  baseUrl: string;
  thinkTimeMs: number;
}

const configs: Record<string, EnvConfig> = {
  dev: {
    baseUrl: __ENV.DEV_BASE_URL || 'http://localhost:5058',
    thinkTimeMs: 500,
  },
  staging: {
    baseUrl: __ENV.STAGING_BASE_URL || 'https://staging-api.example.com',
    thinkTimeMs: 1000,
  },
};

export const config: EnvConfig = configs[ENV] ?? configs['dev'];

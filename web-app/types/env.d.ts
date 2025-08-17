declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Next.js
      NODE_ENV: 'development' | 'production' | 'test';
      NEXT_PUBLIC_APP_URL: string;
      
      // API Configuration
      API_URL: string;
      NEXT_PUBLIC_API_URL: string;
      
      // Authentication
      JWT_SECRET: string;
      JWT_REFRESH_SECRET: string;
      NEXT_PUBLIC_JWT_EXPIRES_IN: string;
      
      // File Upload
      NEXT_PUBLIC_MAX_FILE_SIZE: string;
      NEXT_PUBLIC_ALLOWED_FILE_TYPES: string;
      
      // Features
      NEXT_PUBLIC_ENABLE_CHAT: string;
      NEXT_PUBLIC_ENABLE_NOTIFICATIONS: string;
      NEXT_PUBLIC_ENABLE_GEOLOCATION: string;
      
      // External Services
      GOOGLE_MAPS_API_KEY: string;
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: string;
      
      // Development
      NEXT_PUBLIC_DEBUG: string;
      NEXT_PUBLIC_MOCK_API: string;
      
      // Database
      DATABASE_URL: string;
      REDIS_URL: string;
      
      // Storage
      STORAGE_PROVIDER: 'local' | 'minio' | 's3';
      MINIO_ENDPOINT: string;
      MINIO_ACCESS_KEY: string;
      MINIO_SECRET_KEY: string;
      MINIO_BUCKET: string;
      
      // Email
      SMTP_HOST: string;
      SMTP_PORT: string;
      SMTP_USER: string;
      SMTP_PASS: string;
      FROM_EMAIL: string;
      
      // Analytics
      NEXT_PUBLIC_GA_ID: string;
      
      // Error Reporting
      SENTRY_DSN: string;
      NEXT_PUBLIC_SENTRY_DSN: string;
    }
  }
}

export {};

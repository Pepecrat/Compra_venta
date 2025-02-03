import dotenv from 'dotenv';

dotenv.config();

export const aliexpressConfig = {
    apiKey: process.env.ALIEXPRESS_API_KEY || '',
    apiSecret: process.env.ALIEXPRESS_API_SECRET || '',
    baseUrl: 'https://api-sg.aliexpress.com',
    endpoints: {
        sync: '/sync',
        auth: '/rest/auth/token/create'
    },
    signMethod: 'sha256',
    defaultTimeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
};

export const validateConfig = () => {
    const requiredEnvVars = ['ALIEXPRESS_API_KEY', 'ALIEXPRESS_API_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }
}; 
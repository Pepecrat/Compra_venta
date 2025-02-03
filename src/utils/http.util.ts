import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { aliexpressConfig } from '../config/aliexpress.config';

export class HttpClient {
    private static async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private static async retryRequest<T>(
        config: AxiosRequestConfig,
        attempt: number = 1
    ): Promise<AxiosResponse<T>> {
        try {
            return await axios(config);
        } catch (error) {
            if (
                attempt >= aliexpressConfig.retryAttempts ||
                !this.shouldRetry(error as AxiosError)
            ) {
                throw error;
            }

            await this.delay(aliexpressConfig.retryDelay * attempt);
            return this.retryRequest<T>(config, attempt + 1);
        }
    }

    private static shouldRetry(error: AxiosError): boolean {
        // Retry on network errors or 5xx server errors
        if (!error.response) {
            return true;
        }

        const { status } = error.response;
        return status >= 500 && status <= 599;
    }

    static async get<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
        const response = await this.retryRequest<T>({
            ...config,
            method: 'GET',
            url,
            timeout: config.timeout || aliexpressConfig.defaultTimeout
        });
        return response.data;
    }

    static async post<T>(
        url: string,
        data?: any,
        config: AxiosRequestConfig = {}
    ): Promise<T> {
        const response = await this.retryRequest<T>({
            ...config,
            method: 'POST',
            url,
            data,
            timeout: config.timeout || aliexpressConfig.defaultTimeout
        });
        return response.data;
    }

    static async put<T>(
        url: string,
        data?: any,
        config: AxiosRequestConfig = {}
    ): Promise<T> {
        const response = await this.retryRequest<T>({
            ...config,
            method: 'PUT',
            url,
            data,
            timeout: config.timeout || aliexpressConfig.defaultTimeout
        });
        return response.data;
    }

    static async delete<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
        const response = await this.retryRequest<T>({
            ...config,
            method: 'DELETE',
            url,
            timeout: config.timeout || aliexpressConfig.defaultTimeout
        });
        return response.data;
    }
} 
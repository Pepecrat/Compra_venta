import crypto from 'crypto';
import { aliexpressConfig } from '../../config/aliexpress.config';
import { HttpClient } from '../../utils/http.util';
import {
    AliExpressProduct,
    AliExpressSearchParams,
    AliExpressSearchResponse,
    AliExpressAuthResponse,
    AliExpressError
} from '../../types/aliexpress.types';
import axios from 'axios';
import { AppError } from '../../utils/errorHandler';

export interface AliexpressProduct {
    productId: string;
    title: string;
    price: {
        current: number;
        currency: string;
    };
    ratings: {
        average: number;
        count: number;
    };
    images: string[];
    url: string;
    shipping: {
        cost: number;
        time: string;
    };
}

export class AliExpressService {
    private accessToken: string | null = null;
    private tokenExpiration: Date | null = null;
    private readonly apiKey: string;
    private readonly baseUrl: string;

    constructor() {
        this.validateConfig();
        this.apiKey = process.env.ALIEXPRESS_API_KEY || '';
        this.baseUrl = 'https://api.aliexpress.com/v2/';

        if (!this.apiKey) {
            throw new AppError(500, 'API Key de AliExpress no configurada');
        }
    }

    private validateConfig() {
        if (!aliexpressConfig.apiKey || !aliexpressConfig.apiSecret) {
            throw new Error('AliExpress API configuration is missing');
        }
    }

    private generateSignature(params: Record<string, string>, apiPath?: string): string {
        // Ordenar parámetros alfabéticamente
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((acc: Record<string, string>, key: string) => {
                acc[key] = params[key];
                return acc;
            }, {});

        // Concatenar parámetros
        let signString = '';
        if (apiPath) {
            signString += apiPath;
        }
        
        Object.entries(sortedParams).forEach(([key, value]) => {
            signString += key + value;
        });

        // Generar firma usando SHA256
        return crypto
            .createHmac('sha256', aliexpressConfig.apiSecret)
            .update(signString)
            .digest('hex')
            .toUpperCase();
    }

    private async refreshAccessToken(): Promise<void> {
        try {
            const params = {
                grant_type: 'authorization_code',
                code: 'YOUR_AUTH_CODE', // Este código se obtiene del flujo de autorización
                sign_method: aliexpressConfig.signMethod,
                timestamp: Date.now().toString(),
                app_key: aliexpressConfig.apiKey
            };

            const response = await this.makeRequest<AliExpressAuthResponse>(
                '/auth/token/create',
                params,
                true
            );

            this.accessToken = response.access_token;
            this.tokenExpiration = new Date(Date.now() + response.expires_in * 1000);
        } catch (error) {
            console.error('Error refreshing access token:', error);
            throw error;
        }
    }

    protected async makeRequest<T>(
        method: string,
        params: Record<string, string>,
        isAuthEndpoint: boolean = false
    ): Promise<T> {
        try {
            if (!isAuthEndpoint && (!this.accessToken || this.isTokenExpired())) {
                await this.refreshAccessToken();
            }

            const timestamp = Date.now().toString();
            const commonParams = {
                app_key: aliexpressConfig.apiKey,
                timestamp,
                sign_method: aliexpressConfig.signMethod,
                ...(this.accessToken && !isAuthEndpoint ? { access_token: this.accessToken } : {})
            };

            const allParams = { ...commonParams, ...params };
            const signature = this.generateSignature(allParams, isAuthEndpoint ? method : undefined);
            
            const baseUrl = aliexpressConfig.baseUrl;
            const endpoint = isAuthEndpoint ? '/rest' + method : '/sync';
            const queryParams = new URLSearchParams({ ...allParams, sign: signature }).toString();
            const url = `${baseUrl}${endpoint}?${queryParams}`;

            return await HttpClient.get<T>(url);
        } catch (error) {
            console.error('Error in AliExpress API request:', error);
            throw this.handleError(error);
        }
    }

    private handleError(error: any): Error {
        if (error.response?.data) {
            const aliError = error.response.data as AliExpressError;
            return new Error(`AliExpress API Error: ${aliError.code} - ${aliError.message}`);
        }
        return error;
    }

    private isTokenExpired(): boolean {
        return !this.tokenExpiration || this.tokenExpiration < new Date();
    }

    // Métodos públicos para interactuar con la API

    public async searchProducts(query: string, options: {
        page?: number;
        limit?: number;
        minPrice?: number;
        maxPrice?: number;
        sort?: 'price_asc' | 'price_desc' | 'orders' | 'rating';
    } = {}): Promise<AliexpressProduct[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/products/search`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                params: {
                    q: query,
                    page: options.page || 1,
                    limit: options.limit || 20,
                    min_price: options.minPrice,
                    max_price: options.maxPrice,
                    sort: options.sort
                }
            });

            return response.data.products;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new AppError(
                    error.response?.status || 500,
                    `Error al buscar productos en AliExpress: ${error.message}`
                );
            }
            throw error;
        }
    }

    public async getProductDetails(productId: string): Promise<AliexpressProduct> {
        try {
            const response = await axios.get(`${this.baseUrl}/product/${productId}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new AppError(
                    error.response?.status || 500,
                    `Error al obtener detalles del producto de AliExpress: ${error.message}`
                );
            }
            throw error;
        }
    }

    private transformSearchParams(params: AliExpressSearchParams): Record<string, string> {
        const transformed: Record<string, string> = {};

        if (params.keywords) transformed.keywords = params.keywords;
        if (params.category_id) transformed.category_id = params.category_id;
        if (params.page) transformed.page = params.page.toString();
        if (params.items_per_page) transformed.items_per_page = params.items_per_page.toString();
        if (params.sort_by) transformed.sort_by = params.sort_by;
        if (params.price_min) transformed.price_min = params.price_min.toString();
        if (params.price_max) transformed.price_max = params.price_max.toString();
        if (params.ship_to_country) transformed.ship_to_country = params.ship_to_country;
        if (params.free_shipping !== undefined) transformed.free_shipping = params.free_shipping.toString();

        return transformed;
    }
} 
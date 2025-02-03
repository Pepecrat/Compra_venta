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

export class AliExpressService {
    private accessToken: string | null = null;
    private tokenExpiration: Date | null = null;

    constructor() {
        this.validateConfig();
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

    public async searchProducts(params: AliExpressSearchParams): Promise<AliExpressSearchResponse> {
        const apiParams = {
            method: 'aliexpress.ds.product.search',
            ...this.transformSearchParams(params)
        };

        return await this.makeRequest<AliExpressSearchResponse>('', apiParams);
    }

    public async getProductDetails(productId: string): Promise<AliExpressProduct> {
        const params = {
            method: 'aliexpress.ds.product.get',
            product_id: productId
        };

        return await this.makeRequest<AliExpressProduct>('', params);
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
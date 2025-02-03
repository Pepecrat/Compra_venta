export interface AliExpressProduct {
    product_id: string;
    title: string;
    description?: string;
    category_id: string;
    price: {
        currency_code: string;
        amount: number;
    };
    shipping: {
        is_free: boolean;
        cost?: number;
    };
    ratings?: {
        average: number;
        count: number;
    };
    stock: number;
    specifications?: Record<string, string>;
    images: string[];
    seller: {
        id: string;
        name: string;
        ratings?: number;
    };
    links: {
        detail: string;
        affiliate?: string;
    };
}

export interface AliExpressCategory {
    id: string;
    name: string;
    level: number;
    parent_id?: string;
    children?: AliExpressCategory[];
}

export interface AliExpressSearchParams {
    keywords?: string;
    category_id?: string;
    page?: number;
    items_per_page?: number;
    sort_by?: 'BEST_MATCH' | 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'ORDERS_DESC';
    price_min?: number;
    price_max?: number;
    ship_to_country?: string;
    free_shipping?: boolean;
}

export interface AliExpressSearchResponse {
    total_count: number;
    current_page: number;
    total_pages: number;
    products: AliExpressProduct[];
}

export interface AliExpressError {
    code: string;
    message: string;
    request_id?: string;
}

export interface AliExpressAuthResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    refresh_expires_in?: number;
}

export interface AliExpressConfig {
    apiKey: string;
    apiSecret: string;
    baseUrl: string;
    endpoints: {
        sync: string;
        auth: string;
    };
    signMethod: string;
    defaultTimeout: number;
    retryAttempts: number;
    retryDelay: number;
} 
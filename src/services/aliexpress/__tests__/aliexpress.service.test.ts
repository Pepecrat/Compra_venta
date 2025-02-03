import { AliExpressService } from '../aliexpress.service';
import { aliexpressConfig } from '../../../config/aliexpress.config';

// Mock del módulo de configuración
jest.mock('../../../config/aliexpress.config', () => ({
    aliexpressConfig: {
        apiKey: 'test_key',
        apiSecret: 'test_secret',
        baseUrl: 'https://api-sg.aliexpress.com',
        endpoints: {
            sync: '/sync',
            auth: '/rest/auth/token/create'
        },
        signMethod: 'sha256',
        defaultTimeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000
    }
}));

describe('AliExpressService', () => {
    let service: AliExpressService;

    beforeEach(() => {
        service = new AliExpressService();
    });

    it('should create an instance', () => {
        expect(service).toBeInstanceOf(AliExpressService);
    });

    it('should throw error if config is missing', () => {
        // Simular configuración faltante
        (aliexpressConfig as any).apiKey = '';
        (aliexpressConfig as any).apiSecret = '';

        expect(() => {
            new AliExpressService();
        }).toThrow('AliExpress API configuration is missing');
    });

    // Aquí agregaremos más tests cuando implementemos la funcionalidad completa
}); 
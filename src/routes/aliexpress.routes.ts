import { Router } from 'express';
import { AliexpressService } from '../services/aliexpress/aliexpress.service';
import { AppError } from '../utils/errorHandler';

const router = Router();
const aliexpressService = new AliexpressService();

// GET /api/aliexpress/search
router.get('/search', async (req, res, next) => {
    try {
        const { 
            q, 
            page, 
            limit, 
            minPrice, 
            maxPrice, 
            sort 
        } = req.query;

        if (!q) {
            throw new AppError(400, 'El parámetro de búsqueda (q) es requerido');
        }

        const products = await aliexpressService.searchProducts(
            q as string,
            {
                page: page ? parseInt(page as string) : undefined,
                limit: limit ? parseInt(limit as string) : undefined,
                minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
                maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
                sort: sort as 'price_asc' | 'price_desc' | 'orders' | 'rating'
            }
        );

        res.json({
            status: 'success',
            data: products
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/aliexpress/product/:id
router.get('/product/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await aliexpressService.getProductDetails(id);

        res.json({
            status: 'success',
            data: product
        });
    } catch (error) {
        next(error);
    }
});

export default router; 
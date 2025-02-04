import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public isOperational = true
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

// Middleware para rutas no encontradas
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    const error = new AppError(404, `Ruta no encontrada: ${req.originalUrl}`);
    next(error);
};

// Manejador de errores global mejorado
export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('Error:', err);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            statusCode: err.statusCode,
            message: err.message,
            ...(process.env.NODE_ENV === 'development' && { 
                stack: err.stack,
                path: req.originalUrl
            })
        });
    }

    // Error no controlado
    return res.status(500).json({
        status: 'error',
        statusCode: 500,
        message: 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { 
            originalMessage: err.message,
            stack: err.stack,
            path: req.originalUrl
        })
    });
}; 
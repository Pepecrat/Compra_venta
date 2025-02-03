import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { validateConfig } from './config/aliexpress.config';

// Cargar variables de entorno
dotenv.config();

// Validar configuración
try {
    validateConfig();
} catch (error) {
    console.error('Configuration error:', error);
    process.exit(1);
}

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Variables de entorno
const PORT = process.env.PORT || 3000;

// Rutas básicas
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Manejo de errores global
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 
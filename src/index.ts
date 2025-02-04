import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './utils/errorHandler';
import aliexpressRoutes from './routes/aliexpress.routes';

// Cargar variables de entorno
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Seguridad
app.use(cors()); // CORS
app.use(express.json()); // Parser JSON
app.use(express.urlencoded({ extended: true }));

// Rutas de la API
const apiRouter = express.Router();

// Health check
apiRouter.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Rutas de AliExpress
apiRouter.use('/aliexpress', aliexpressRoutes);

// Montar el router de la API
app.use('/api', apiRouter);

// Manejador para rutas no encontradas
app.use(notFoundHandler);

// Manejador de errores global
app.use(errorHandler);

// Iniciar el servidor
app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
    console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
}); 
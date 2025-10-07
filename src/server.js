import express from 'express';
import 'dotenv/config.js';
import cors from 'cors';
import pino from 'pino-http';
import helmet from 'helmet';
import { errors } from 'celebrate';
import { connectMongoDB } from './db/connectMongoDB.js';
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import notesRoutes from './routes/notesRoutes.js';

const app = express();
const PORT = process.env.PORT ?? 3030;

app.use(logger);
app.use(express.json());
app.use(cors());
app.use(pino());
app.use(helmet());

app.use(notesRoutes);

//Обробка неіснуючих маршрутів 404
app.use(notFoundHandler);

// обробка помилок від celebrate (валідація)
app.use(errors());

//Глобально обробка помилок 500
app.use(errorHandler);

await connectMongoDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

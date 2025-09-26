import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import pino from 'pino-http';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3030;

app.use(express.json());
app.use(cors());
app.use(pino());

app.get('/notes', (req, res) => {
  res.status(200).json({ message: 'Retrieved all notes' });
});

app.get('/notes/:noteId', (req, res) => {
  const { noteId } = req.params;
  res.status(200).json({ message: `Retrieved note with ID: ${noteId}` });
});

//тестовий маршрут для імітації виникнення помилки
app.get('/test-error', () => {
  throw new Error('Simulated server error');
});

//Обробка неіснуючих маршрутів
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
  });
});

//Обробка помилок
app.use((err, req, res, next) => {
  res.status(500).json({
    message: 'Simulated server error',
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

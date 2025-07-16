import { Router } from 'express';
import { database } from '../config/database';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SIGATA API Health Check',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get('/ready', (req, res) => {
  res.json({
    status: 'READY',
    service: 'SIGATA Backend',
    version: '1.0.0',
  });
});

router.get('/database', async (req, res) => {
  try {
    const healthCheck = await database.healthCheck();
    res.json({
      status: 'OK',
      database: healthCheck,
      message: 'Conexão com banco de dados funcionando',
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Erro na conexão com banco de dados',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

export default router;

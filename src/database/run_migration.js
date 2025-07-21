const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_HOST.includes('rds.amazonaws.com') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('📊 Conectando ao banco de dados...');
    const client = await pool.connect();
    
    console.log('🔄 Iniciando migração para converter IDs para integer...');
    
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'migrations', '002_convert_ids_to_integer_specific.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Executar o SQL
    console.log('⚙️ Executando script de migração...');
    await client.query(sqlContent);
    
    console.log('✅ Migração concluída com sucesso!');
    
    client.release();
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error);
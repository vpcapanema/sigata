/**
 * Script rápido para criar constraints SIGATA
 */
const { Pool } = require('pg');

const pool = new Pool({
  host: 'pli-db.c6j00cu4izbw.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'pli_db',
  user: 'postgres',
  password: 'semil2025*',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000
});

async function quickCreateConstraints() {
  console.log('🚀 Criando constraints rapidamente...');
  
  const client = await pool.connect();
  
  try {
    // Constraint 1: status_processamento
    console.log('⚙️ Criando constraint status_processamento...');
    try {
      await client.query(`
        ALTER TABLE sigata.documento_controle 
        DROP CONSTRAINT IF EXISTS status_processamento
      `);
      
      await client.query(`
        ALTER TABLE sigata.documento_controle 
        ADD CONSTRAINT status_processamento 
        CHECK (status_processamento IN ('PENDENTE', 'PROCESSANDO', 'CONCLUIDO'))
      `);
      console.log('✅ Constraint status_processamento criada!');
    } catch (error) {
      console.log('⚠️ Status constraint:', error.message);
    }
    
    // Constraint 2: tipo_usuario
    console.log('⚙️ Criando constraint tipo_usuario...');
    try {
      await client.query(`
        ALTER TABLE usuarios.user_account 
        DROP CONSTRAINT IF EXISTS tipo_usuario
      `);
      
      await client.query(`
        ALTER TABLE usuarios.user_account 
        ADD CONSTRAINT tipo_usuario 
        CHECK (role IN ('ADMIN', 'GESTOR', 'ANALISTA', 'OPERADOR', 'VISUALIZADOR'))
      `);
      console.log('✅ Constraint tipo_usuario criada!');
    } catch (error) {
      console.log('⚠️ Tipo constraint:', error.message);
    }
    
    console.log('🎉 Processo concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

quickCreateConstraints().catch(console.error);

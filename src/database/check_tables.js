const { Pool } = require('pg');
require('dotenv').config();

async function checkTables() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  try {
    console.log('📊 Conectando ao banco de dados...');
    const client = await pool.connect();
    
    console.log('🔍 Verificando tabelas existentes...');
    
    // Consulta para listar todas as tabelas
    const query = `
      SELECT 
        table_schema,
        table_name
      FROM 
        information_schema.tables
      WHERE 
        table_schema IN ('sigata', 'usuarios', 'public')
        AND table_type = 'BASE TABLE'
      ORDER BY 
        table_schema, table_name
    `;
    
    const result = await client.query(query);
    
    console.log('\n📋 Tabelas encontradas:');
    result.rows.forEach(row => {
      console.log(`${row.table_schema}.${row.table_name}`);
    });
    
    client.release();
  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error);
  } finally {
    await pool.end();
  }
}

checkTables().catch(console.error);
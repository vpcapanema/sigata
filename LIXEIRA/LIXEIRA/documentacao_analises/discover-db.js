/**
 * Script para descobrir estrutura real do banco
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

async function discoverStructure() {
  console.log('🔍 DESCOBRINDO ESTRUTURA REAL DO BANCO');
  console.log('=====================================');
  
  const client = await pool.connect();
  
  try {
    // 1. Todos os schemas
    console.log('📂 Schemas disponíveis:');
    const schemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);
    schemas.rows.forEach(row => console.log(`  - ${row.schema_name}`));
    
    // 2. Todas as tabelas
    console.log('\n📋 Todas as tabelas:');
    const tables = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY table_schema, table_name
    `);
    tables.rows.forEach(row => console.log(`  - ${row.table_schema}.${row.table_name}`));
    
    // 3. Colunas com "status" no nome
    console.log('\n🔍 Colunas com "status":');
    const statusCols = await client.query(`
      SELECT table_schema, table_name, column_name, data_type
      FROM information_schema.columns 
      WHERE column_name ILIKE '%status%'
      ORDER BY table_schema, table_name, column_name
    `);
    statusCols.rows.forEach(row => 
      console.log(`  - ${row.table_schema}.${row.table_name}.${row.column_name} (${row.data_type})`)
    );
    
    // 4. Colunas com "role" ou "tipo" no nome
    console.log('\n👤 Colunas com "role" ou "tipo":');
    const roleCols = await client.query(`
      SELECT table_schema, table_name, column_name, data_type
      FROM information_schema.columns 
      WHERE column_name ILIKE '%role%' OR column_name ILIKE '%tipo%'
      ORDER BY table_schema, table_name, column_name
    `);
    roleCols.rows.forEach(row => 
      console.log(`  - ${row.table_schema}.${row.table_name}.${row.column_name} (${row.data_type})`)
    );
    
    // 5. Constraints existentes
    console.log('\n🔐 Constraints existentes:');
    const constraints = await client.query(`
      SELECT constraint_schema, table_name, constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE constraint_schema NOT IN ('information_schema', 'pg_catalog')
      AND constraint_type = 'CHECK'
      ORDER BY constraint_schema, table_name, constraint_name
    `);
    constraints.rows.forEach(row => 
      console.log(`  - ${row.constraint_schema}.${row.table_name}: ${row.constraint_name}`)
    );
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

discoverStructure().catch(console.error);

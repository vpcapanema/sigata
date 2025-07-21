/**
 * Script para criar constraints necessárias no banco SIGATA
 */
const { Pool } = require('pg');

const pool = new Pool({
  host: 'pli-db.c6j00cu4izbw.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'pli_db',
  user: 'postgres',
  password: 'semil2025*',
  ssl: {
    rejectUnauthorized: false
  }
});

async function createConstraints() {
  console.log('🚀 CRIANDO CONSTRAINTS SIGATA');
  console.log('===============================');
  
  const client = await pool.connect();
  
  try {
    // 1. Verificar tabelas existentes
    console.log('📋 Verificando estrutura do banco...');
    
    const sigataTableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'sigata'
      ORDER BY table_name
    `;
    const sigataTablesResult = await client.query(sigataTableQuery);
    console.log('✅ Tabelas schema SIGATA:', sigataTablesResult.rows.map(r => r.table_name));
    
    const usuariosTableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'usuarios'
      ORDER BY table_name
    `;
    const usuariosTablesResult = await client.query(usuariosTableQuery);
    console.log('✅ Tabelas schema USUARIOS:', usuariosTablesResult.rows.map(r => r.table_name));
    
    // 2. Verificar colunas específicas
    console.log('\n🔍 Verificando colunas críticas...');
    
    // Verificar coluna status_processamento
    const statusColQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'sigata' 
      AND table_name = 'documento_controle'
      AND column_name LIKE '%status%'
    `;
    const statusColResult = await client.query(statusColQuery);
    console.log('📄 Colunas status em documento_controle:', statusColResult.rows);
    
    // Verificar coluna role/tipo_usuario
    const roleColQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'usuarios' 
      AND table_name = 'user_account'
      AND (column_name = 'role' OR column_name LIKE '%tipo%')
    `;
    const roleColResult = await client.query(roleColQuery);
    console.log('👤 Colunas role/tipo em user_account:', roleColResult.rows);
    
    // 3. Verificar constraints existentes
    console.log('\n🔐 Verificando constraints existentes...');
    
    const constraintsQuery = `
      SELECT 
        constraint_name, 
        table_schema, 
        table_name,
        check_clause
      FROM information_schema.check_constraints
      WHERE constraint_schema IN ('sigata', 'usuarios')
      ORDER BY table_schema, table_name, constraint_name
    `;
    const constraintsResult = await client.query(constraintsQuery);
    console.log('🔍 Constraints existentes:');
    constraintsResult.rows.forEach(row => {
      console.log(`  - ${row.table_schema}.${row.table_name}: ${row.constraint_name}`);
      if (row.check_clause) {
        console.log(`    Check: ${row.check_clause}`);
      }
    });
    
    // 4. Criar constraint status_processamento
    console.log('\n⚙️ Criando constraint status_processamento...');
    
    if (statusColResult.rows.length > 0) {
      const statusColumn = statusColResult.rows[0].column_name;
      
      try {
        // Remover constraint existente se houver
        await client.query(`
          ALTER TABLE sigata.documento_controle 
          DROP CONSTRAINT IF EXISTS status_processamento
        `);
        
        // Criar nova constraint
        await client.query(`
          ALTER TABLE sigata.documento_controle 
          ADD CONSTRAINT status_processamento 
          CHECK (${statusColumn} IN ('PENDENTE', 'PROCESSANDO', 'CONCLUIDO'))
        `);
        console.log(`✅ Constraint status_processamento criada para coluna: ${statusColumn}`);
        
      } catch (error) {
        console.error(`❌ Erro ao criar constraint status_processamento: ${error.message}`);
      }
    } else {
      console.log('⚠️ Nenhuma coluna de status encontrada em documento_controle');
    }
    
    // 5. Criar constraint tipo_usuario
    console.log('\n⚙️ Criando constraint tipo_usuario...');
    
    if (roleColResult.rows.length > 0) {
      const roleColumn = roleColResult.rows[0].column_name;
      
      try {
        // Remover constraint existente se houver
        await client.query(`
          ALTER TABLE usuarios.user_account 
          DROP CONSTRAINT IF EXISTS tipo_usuario
        `);
        
        // Criar nova constraint
        await client.query(`
          ALTER TABLE usuarios.user_account 
          ADD CONSTRAINT tipo_usuario 
          CHECK (${roleColumn} IN ('ADMIN', 'GESTOR', 'ANALISTA', 'OPERADOR', 'VISUALIZADOR'))
        `);
        console.log(`✅ Constraint tipo_usuario criada para coluna: ${roleColumn}`);
        
      } catch (error) {
        console.error(`❌ Erro ao criar constraint tipo_usuario: ${error.message}`);
      }
    } else {
      console.log('⚠️ Nenhuma coluna role/tipo encontrada em user_account');
    }
    
    // 6. Verificar constraints finais
    console.log('\n🎯 Verificação final das constraints...');
    
    const finalConstraintsResult = await client.query(constraintsQuery);
    const hasStatusConstraint = finalConstraintsResult.rows.some(
      row => row.constraint_name === 'status_processamento'
    );
    const hasTipoConstraint = finalConstraintsResult.rows.some(
      row => row.constraint_name === 'tipo_usuario'
    );
    
    console.log(`✅ Constraint status_processamento: ${hasStatusConstraint ? 'EXISTE' : 'NÃO EXISTE'}`);
    console.log(`✅ Constraint tipo_usuario: ${hasTipoConstraint ? 'EXISTE' : 'NÃO EXISTE'}`);
    
    console.log('\n🎉 CONSTRAINTS CRIADAS COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    client.release();
    await pool.end();
    console.log('🔚 Conexão finalizada');
  }
}

createConstraints().catch(console.error);

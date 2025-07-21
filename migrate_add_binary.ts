import { database } from './src/config/database';

async function addBinaryColumn() {
  try {
    console.log('🔧 Iniciando migration: adicionar coluna arquivo_binario...');
    
    const sql = `
      -- Adicionar colunas necessárias para armazenamento de arquivos
      ALTER TABLE sigata.documento_base 
      ADD COLUMN IF NOT EXISTS nome_arquivo VARCHAR(255),
      ADD COLUMN IF NOT EXISTS tipo_arquivo VARCHAR(100),
      ADD COLUMN IF NOT EXISTS tamanho_arquivo BIGINT,
      ADD COLUMN IF NOT EXISTS arquivo_binario BYTEA,
      ADD COLUMN IF NOT EXISTS texto_extraido TEXT,
      ADD COLUMN IF NOT EXISTS hash_arquivo VARCHAR(64);
    `;
    
    await database.query(sql);
    console.log('✅ Migration executada com sucesso!');
    
    // Verificar se as colunas foram criadas
    const checkColumns = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'documento_base' 
      AND table_schema = 'sigata'
      AND column_name IN ('nome_arquivo', 'tipo_arquivo', 'arquivo_binario', 'texto_extraido')
      ORDER BY column_name;
    `;
    
    const result = await database.query(checkColumns);
    console.log('📋 Colunas adicionadas:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro na migration:', error);
    process.exit(1);
  }
}

addBinaryColumn();

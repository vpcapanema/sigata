import { database } from '../config/database';

/**
 * Função para verificar a estrutura da tabela documento_base
 */
export async function checkDocumentoBaseTable() {
  try {
    console.log('=== DIAGNÓSTICO DA TABELA DOCUMENTO_BASE ===');
    
    // Verificar estrutura da tabela
    const tableStructureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'sigata' AND table_name = 'documento_base'
      ORDER BY ordinal_position;
    `;
    
    const tableStructure = await database.query(tableStructureQuery);
    console.log('Estrutura da tabela documento_base:');
    console.table(tableStructure.rows);
    
    // Verificar alguns registros
    const sampleRecordsQuery = `
      SELECT id, codigo_documento, nome_arquivo, status_processamento
      FROM sigata.documento_base
      LIMIT 5;
    `;
    
    const sampleRecords = await database.query(sampleRecordsQuery);
    console.log('Amostra de registros:');
    console.table(sampleRecords.rows);
    
    return {
      structure: tableStructure.rows,
      samples: sampleRecords.rows
    };
  } catch (error) {
    console.error('Erro ao verificar estrutura da tabela:', error);
    return { error };
  }
}

/**
 * Função para executar diagnóstico completo do banco de dados
 */
export async function runDiagnostics() {
  try {
    await checkDocumentoBaseTable();
    console.log('Diagnóstico concluído com sucesso');
  } catch (error) {
    console.error('Erro ao executar diagnóstico:', error);
  }
}

// Executar diagnóstico se este arquivo for executado diretamente
if (require.main === module) {
  runDiagnostics()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}
import { database } from './src/config/database';

async function testSimpleProcessing() {
  try {
    const documentId = '301b0357-117c-49c5-89fe-f528111a14265';
    
    console.log('🧪 Testando processamento simplificado...');
    
    // Buscar documento
    const result = await database.query(
      'SELECT nome_arquivo, texto_extraido, status_processamento FROM sigata.documento_base WHERE id = $1',
      [documentId]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Documento não encontrado');
      return;
    }
    
    const document = result.rows[0];
    console.log('📄 Documento encontrado:', document.nome_arquivo);
    console.log('📝 Texto:', document.texto_extraido.substring(0, 100) + '...');
    console.log('🔄 Status atual:', document.status_processamento);
    
    // Análise simples
    const text = document.texto_extraido;
    const words = text.toLowerCase().split(/\s+/);
    
    console.log('🔍 Análise:');
    console.log(`  - Palavras: ${words.length}`);
    console.log(`  - Caracteres: ${text.length}`);
    
    // Atualizar status
    await database.query(
      'UPDATE sigata.documento_base SET status_processamento = $1 WHERE id = $2',
      ['CONCLUIDO', documentId]
    );
    
    console.log('✅ Teste concluído com sucesso!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

testSimpleProcessing();

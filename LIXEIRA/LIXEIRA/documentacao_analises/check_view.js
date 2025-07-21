const { Client } = require('pg');

const client = new Client({
  host: 'pli-db.c6j00cu4izbw.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'pli_db',
  user: 'postgres',
  password: 'semil2025*',
  ssl: { rejectUnauthorized: false }
});

async function checkView() {
  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');
    
    const result = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'sigata' 
        AND table_name = 'documentos_processamento_full'
      )
    `);
    
    console.log('View exists:', result.rows[0].exists);
    
    if (!result.rows[0].exists) {
      console.log('🔧 Criando view documentos_processamento_full...');
      await client.query(`
        CREATE VIEW sigata.documentos_processamento_full AS
        SELECT 
          db.id as documento_id,
          db.codigo_documento,
          db.titulo_documento,
          db.tipo_documento,
          db.status_processamento,
          da.nome_arquivo_original,
          ROUND(da.tamanho_arquivo_bytes / 1048576.0, 2) as tamanho_arquivo_mb,
          TO_CHAR(db.data_upload, 'DD/MM/YYYY HH24:MI') as data_upload_formatada,
          dad.local_reuniao,
          TO_CHAR(dad.data_reuniao, 'DD/MM/YYYY') as data_reuniao_formatada,
          dad.tipo_ata,
          dad.total_participantes as participantes_total,
          dq.score_qualidade_geral,
          CASE 
            WHEN dq.score_qualidade_geral >= 90 THEN 'EXCELENTE'
            WHEN dq.score_qualidade_geral >= 70 THEN 'BOM'
            WHEN dq.score_qualidade_geral >= 50 THEN 'REGULAR'
            ELSE 'RUIM'
          END as nivel_qualidade,
          dn.resumo_executivo,
          dn.palavras_chave_principais,
          dn.sentimentos_detectados,
          dnm.score_legibilidade,
          dnm.score_completude,
          dnm.score_consistencia,
          dnm.tempo_processamento_ms,
          dnm.modelo_nlp_utilizado,
          dnm.confiabilidade_analise
        FROM sigata.documento_base db
        LEFT JOIN sigata.documento_arquivo da ON db.id = da.documento_id
        LEFT JOIN sigata.documento_ata_dados dad ON db.id = dad.documento_id
        LEFT JOIN sigata.documento_qualidade dq ON db.id = dq.documento_id
        LEFT JOIN sigata.documento_nlp_dados dn ON db.id = dn.documento_id
        LEFT JOIN sigata.documento_nlp_metricas dnm ON db.id = dnm.documento_id
        WHERE db.data_exclusao IS NULL
        ORDER BY db.data_upload DESC
      `);
      console.log('✅ View created successfully!');
    } else {
      console.log('✅ View já existe!');
    }
    
    // Testar a view
    const testResult = await client.query('SELECT COUNT(*) FROM sigata.documentos_processamento_full');
    console.log('📊 Total de registros na view:', testResult.rows[0].count);
    
    await client.end();
    console.log('🔚 Conexão fechada');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkView();

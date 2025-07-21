-- Desabilitar restrições de chave estrangeira temporariamente
SET session_replication_role = 'replica';

-- Primeiro, vamos identificar todas as tabelas e suas colunas de ID
DO $$
DECLARE
    table_record RECORD;
    column_record RECORD;
    fk_record RECORD;
    create_sequence_sql TEXT;
    alter_table_sql TEXT;
    update_sequence_sql TEXT;
BEGIN
    -- Criar sequências para cada tabela
    FOR table_record IN 
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema IN ('sigata', 'usuarios', 'public')
        AND table_type = 'BASE TABLE'
    LOOP
        -- Verificar se a tabela tem uma coluna id do tipo uuid
        FOR column_record IN 
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = table_record.table_schema 
            AND table_name = table_record.table_name
            AND column_name = 'id'
            AND data_type = 'uuid'
        LOOP
            -- Criar sequência para esta tabela
            create_sequence_sql := format('CREATE SEQUENCE IF NOT EXISTS %I.%I_id_seq', 
                                         table_record.table_schema, table_record.table_name);
            EXECUTE create_sequence_sql;
            
            -- Fazer backup da tabela
            EXECUTE format('CREATE TABLE %I.%I_old AS SELECT * FROM %I.%I', 
                          table_record.table_schema, table_record.table_name,
                          table_record.table_schema, table_record.table_name);
                          
            -- Remover chaves primárias e estrangeiras
            EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I_pkey CASCADE', 
                          table_record.table_schema, table_record.table_name,
                          table_record.table_name);
            
            -- Alterar coluna id para integer
            alter_table_sql := format('ALTER TABLE %I.%I 
                                      ALTER COLUMN id DROP DEFAULT,
                                      ALTER COLUMN id TYPE integer USING nextval(''%I.%I_id_seq''),
                                      ALTER COLUMN id SET DEFAULT nextval(''%I.%I_id_seq''),
                                      ADD PRIMARY KEY (id)', 
                                     table_record.table_schema, table_record.table_name,
                                     table_record.table_schema, table_record.table_name,
                                     table_record.table_schema, table_record.table_name);
            EXECUTE alter_table_sql;
            
            -- Atualizar a sequência para o próximo valor disponível
            update_sequence_sql := format('SELECT setval(''%I.%I_id_seq'', COALESCE((SELECT MAX(id) FROM %I.%I), 1))', 
                                        table_record.table_schema, table_record.table_name,
                                        table_record.table_schema, table_record.table_name);
            EXECUTE update_sequence_sql;
            
            RAISE NOTICE 'Tabela % convertida para ID integer', table_record.table_schema || '.' || table_record.table_name;
        END LOOP;
    END LOOP;
    
    -- Agora, vamos identificar e converter todas as colunas de chave estrangeira que referenciam ids
    FOR fk_record IN 
        SELECT 
            tc.table_schema, 
            tc.table_name, 
            kcu.column_name,
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema IN ('sigata', 'usuarios', 'public')
        AND ccu.column_name = 'id'
    LOOP
        -- Verificar se a coluna é do tipo uuid
        FOR column_record IN 
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = fk_record.table_schema 
            AND table_name = fk_record.table_name
            AND column_name = fk_record.column_name
            AND data_type = 'uuid'
        LOOP
            -- Alterar coluna de chave estrangeira para integer
            EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I TYPE integer USING %I::text::integer', 
                          fk_record.table_schema, fk_record.table_name,
                          fk_record.column_name, fk_record.column_name);
            
            -- Adicionar restrição de chave estrangeira
            EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT fk_%I_%I FOREIGN KEY (%I) REFERENCES %I.%I(id)', 
                          fk_record.table_schema, fk_record.table_name,
                          fk_record.table_name, fk_record.column_name,
                          fk_record.column_name,
                          fk_record.foreign_table_schema, fk_record.foreign_table_name);
            
            RAISE NOTICE 'Chave estrangeira %.% convertida para integer', fk_record.table_schema, fk_record.column_name;
        END LOOP;
    END LOOP;
END$$;

-- Reabilitar restrições de chave estrangeira
SET session_replication_role = 'origin';
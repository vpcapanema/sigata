import { database } from '../config/database';
import bcrypt from 'bcrypt';

export interface UsuarioSistema {
  id: string;
  username: string;
  email: string;
  senha_hash: string;
  salt?: string;
  duplo_fator_habilitado: boolean;
  duplo_fator_chave_secreta?: string;
  pessoa_fisica_id?: string;
  pessoa_juridica_id?: string;
  tipo_usuario: 'ADMIN' | 'GESTOR' | 'ANALISTA' | 'OPERADOR' | 'VISUALIZADOR';
  nivel_acesso: number;
  departamento?: string;
  cargo?: string;
  ativo: boolean;
  email_verificado: boolean;
  primeiro_acesso: boolean;
  data_ultimo_login?: Date;
  tentativas_login: number;
  bloqueado_ate?: Date;
  fuso_horario: string;
  idioma: string;
  tema_interface: string;
  data_criacao: Date;
  data_atualizacao: Date;
  criado_por_id?: string;
  atualizado_por_id?: string;
  data_exclusao?: Date;
}

export interface PessoaFisica {
  id: string;
  cpf: string;
  nome_completo: string;
  nome_social?: string;
  data_nascimento?: Date;
  sexo?: 'M' | 'F' | 'O';
  email?: string;
  telefone_principal?: string;
  telefone_secundario?: string;
  data_criacao: Date;
  data_atualizacao: Date;
}

class UsuarioService {
  /**
   * Busca todos os usuários com informações de pessoa física
   */
  async listarUsuarios(): Promise<UsuarioSistema[]> {
    try {
      const query = `
        SELECT 
          u.id,
          u.username,
          u.email,
          u.tipo_usuario,
          u.nivel_acesso,
          u.departamento,
          u.cargo,
          u.ativo,
          u.email_verificado,
          u.primeiro_acesso,
          u.data_ultimo_login,
          u.tentativas_login,
          u.data_criacao,
          u.data_atualizacao,
          pf.nome_completo,
          pf.cpf,
          pf.telefone_principal
        FROM usuarios.usuario_sistema u
        LEFT JOIN cadastro.pessoa_fisica pf ON u.pessoa_fisica_id = pf.id
        WHERE u.data_exclusao IS NULL
        ORDER BY u.data_criacao DESC
      `;

      const result = await database.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      throw new Error('Erro ao buscar usuários');
    }
  }

  /**
   * Busca usuário por ID
   */
  async buscarPorId(id: string): Promise<UsuarioSistema | null> {
    try {
      const query = `
        SELECT 
          u.*,
          pf.nome_completo,
          pf.cpf,
          pf.telefone_principal
        FROM usuarios.usuario_sistema u
        LEFT JOIN cadastro.pessoa_fisica pf ON u.pessoa_fisica_id = pf.id
        WHERE u.id = $1 AND u.data_exclusao IS NULL
      `;

      const result = await database.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error);
      throw new Error('Erro ao buscar usuário');
    }
  }

  /**
   * Busca usuário por username
   */
  async buscarPorUsername(username: string): Promise<UsuarioSistema | null> {
    try {
      const query = `
        SELECT 
          u.*,
          pf.nome_completo,
          pf.cpf
        FROM usuarios.usuario_sistema u
        LEFT JOIN cadastro.pessoa_fisica pf ON u.pessoa_fisica_id = pf.id
        WHERE u.username = $1 AND u.data_exclusao IS NULL
      `;

      const result = await database.query(query, [username]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar usuário por username:', error);
      throw new Error('Erro ao buscar usuário');
    }
  }

  /**
   * Busca usuário por email
   */
  async buscarPorEmail(email: string): Promise<UsuarioSistema | null> {
    try {
      const query = `
        SELECT 
          u.*,
          pf.nome_completo,
          pf.cpf
        FROM usuarios.usuario_sistema u
        LEFT JOIN cadastro.pessoa_fisica pf ON u.pessoa_fisica_id = pf.id
        WHERE u.email = $1 AND u.data_exclusao IS NULL
      `;

      const result = await database.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      throw new Error('Erro ao buscar usuário');
    }
  }

  /**
   * Autentica usuário
   */
  async autenticar(login: string, senha: string): Promise<UsuarioSistema | null> {
    try {
      // Busca por username ou email
      const query = `
        SELECT 
          u.*,
          pf.nome_completo
        FROM usuarios.usuario_sistema u
        LEFT JOIN cadastro.pessoa_fisica pf ON u.pessoa_fisica_id = pf.id
        WHERE (u.username = $1 OR u.email = $1) 
        AND u.data_exclusao IS NULL 
        AND u.ativo = true
      `;

      const result = await database.query(query, [login]);
      const usuario = result.rows[0];

      if (!usuario) {
        return null;
      }

      // Verifica se está bloqueado
      if (usuario.bloqueado_ate && new Date() < new Date(usuario.bloqueado_ate)) {
        throw new Error('Usuário temporariamente bloqueado');
      }

      // Verifica a senha
      const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
      
      if (!senhaCorreta) {
        // Incrementa tentativas de login
        await this.incrementarTentativasLogin(usuario.id);
        return null;
      }

      // Atualiza último login e zera tentativas
      await this.atualizarUltimoLogin(usuario.id);

      return usuario;
    } catch (error) {
      console.error('Erro na autenticação:', error);
      throw error;
    }
  }

  /**
   * Atualiza último login
   */
  private async atualizarUltimoLogin(userId: string): Promise<void> {
    const query = `
      UPDATE usuarios.usuario_sistema 
      SET data_ultimo_login = CURRENT_TIMESTAMP,
          tentativas_login = 0,
          data_atualizacao = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    await database.query(query, [userId]);
  }

  /**
   * Incrementa tentativas de login
   */
  private async incrementarTentativasLogin(userId: string): Promise<void> {
    const query = `
      UPDATE usuarios.usuario_sistema 
      SET tentativas_login = tentativas_login + 1,
          bloqueado_ate = CASE 
            WHEN tentativas_login >= 4 THEN CURRENT_TIMESTAMP + INTERVAL '15 minutes'
            ELSE bloqueado_ate
          END,
          data_atualizacao = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    await database.query(query, [userId]);
  }

  /**
   * Cria hash da senha
   */
  async criarHashSenha(senha: string): Promise<{ hash: string; salt: string }> {
    const saltRounds = 12;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(senha, salt);
    
    return { hash, salt };
  }

  /**
   * Estatísticas do usuário
   */
  async obterEstatisticas(userId: string): Promise<any> {
    try {
      const query = `
        SELECT 
          (SELECT COUNT(*) FROM sigata.documento_base WHERE usuario_upload_id = $1) as documentos_carregados,
          (SELECT COUNT(*) FROM sigata.documento_base WHERE usuario_upload_id = $1 AND status_processamento = 'CONCLUIDO') as documentos_processados,
          (SELECT COUNT(*) FROM sigata.relatorio_base WHERE gerado_por_id = $1) as relatorios_gerados,
          (SELECT COUNT(*) FROM sigata.documento_base WHERE usuario_upload_id = $1 AND data_upload >= CURRENT_DATE - INTERVAL '30 days') as documentos_mes_atual
      `;

      const result = await database.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao obter estatísticas do usuário:', error);
      throw new Error('Erro ao buscar estatísticas');
    }
  }
}

export const usuarioService = new UsuarioService();

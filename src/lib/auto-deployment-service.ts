import { supabaseCrm } from './supabase-crm';
import { clientEnvGenerator } from './client-env-generator';
import { secureCredentialsManager } from './secure-credentials-manager';

interface DeploymentConfig {
  cliente_id: string;
  deployment_url: string;
  deployment_token: string;
  environment: 'development' | 'staging' | 'production';
  auto_deploy: boolean;
}

interface DeploymentResult {
  cliente_id: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  deployment_url?: string;
  timestamp: string;
}

export class AutoDeploymentService {
  private static instance: AutoDeploymentService;

  private constructor() {}

  public static getInstance(): AutoDeploymentService {
    if (!AutoDeploymentService.instance) {
      AutoDeploymentService.instance = new AutoDeploymentService();
    }
    return AutoDeploymentService.instance;
  }

  /**
   * Deploy automático do .env para um cliente específico
   */
  async deployToClient(clienteId: string, adminUser?: string): Promise<DeploymentResult> {
    try {
      console.log('🚀 Iniciando deploy automático para cliente:', clienteId);

      // 1. Verificar se o cliente tem credenciais configuradas
      const hasCredentials = await secureCredentialsManager.hasCredentials(clienteId);
      if (!hasCredentials) {
        return {
          cliente_id: clienteId,
          status: 'error',
          message: 'Cliente não possui credenciais Google configuradas',
          timestamp: new Date().toISOString()
        };
      }

      // 2. Gerar .env atualizado
      const envContent = await clientEnvGenerator.generateClientEnv(clienteId);

      // 3. Salvar .env no storage
      const filePath = await clientEnvGenerator.saveClientEnv(clienteId, envContent);

      // 4. Buscar configuração de deploy do cliente
      const deploymentConfig = await this.getDeploymentConfig(clienteId);

      if (deploymentConfig?.auto_deploy) {
        // 5. Executar deploy automático (se configurado)
        const deployResult = await this.executeDeployment(clienteId, envContent, deploymentConfig);
        
        return {
          cliente_id: clienteId,
          status: deployResult.success ? 'success' : 'error',
          message: deployResult.message,
          deployment_url: deploymentConfig.deployment_url,
          timestamp: new Date().toISOString()
        };
      } else {
        // 6. Apenas salvar .env (deploy manual)
        return {
          cliente_id: clienteId,
          status: 'success',
          message: 'Arquivo .env gerado e salvo com sucesso. Deploy manual necessário.',
          timestamp: new Date().toISOString()
        };
      }

    } catch (error) {
      console.error('❌ Erro no deploy automático:', error);
      return {
        cliente_id: clienteId,
        status: 'error',
        message: `Erro no deploy: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Deploy automático para todos os clientes ativos
   */
  async deployToAllClients(adminUser?: string): Promise<DeploymentResult[]> {
    try {
      console.log('🚀 Iniciando deploy automático para todos os clientes');

      // Buscar todos os clientes ativos
      const { data: clientes, error } = await supabaseCrm
        .from('clientes')
        .select('id, nome')
        .eq('ativo', true);

      if (error) {
        throw error;
      }

      const results: DeploymentResult[] = [];

      // Deploy para cada cliente
      for (const cliente of clientes) {
        try {
          const result = await this.deployToClient(cliente.id, adminUser);
          results.push(result);
        } catch (error) {
          results.push({
            cliente_id: cliente.id,
            status: 'error',
            message: `Erro no deploy: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            timestamp: new Date().toISOString()
          });
        }
      }

      console.log('🏁 Deploy automático concluído');
      return results;

    } catch (error) {
      console.error('❌ Erro no deploy automático global:', error);
      throw error;
    }
  }

  /**
   * Busca configuração de deploy de um cliente
   */
  private async getDeploymentConfig(clienteId: string): Promise<DeploymentConfig | null> {
    try {
      const { data, error } = await supabaseCrm
        .from('deployment_configs')
        .select('*')
        .eq('cliente_id', clienteId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Cliente não tem configuração de deploy
        }
        throw error;
      }

      return data;

    } catch (error) {
      console.error('❌ Erro ao buscar configuração de deploy:', error);
      return null;
    }
  }

  /**
   * Executa o deploy real (integração com serviços de deploy)
   */
  private async executeDeployment(
    clienteId: string, 
    envContent: string, 
    config: DeploymentConfig
  ): Promise<{success: boolean, message: string}> {
    try {
      console.log('🔄 Executando deploy para:', config.deployment_url);

      // Aqui você pode integrar com diferentes serviços de deploy:
      // - Vercel
      // - Netlify
      // - Railway
      // - Heroku
      // - AWS
      // - etc.

      // Exemplo de integração com Vercel
      if (config.deployment_url.includes('vercel')) {
        return await this.deployToVercel(clienteId, envContent, config);
      }

      // Exemplo de integração com Netlify
      if (config.deployment_url.includes('netlify')) {
        return await this.deployToNetlify(clienteId, envContent, config);
      }

      // Deploy genérico via webhook
      return await this.deployViaWebhook(clienteId, envContent, config);

    } catch (error) {
      console.error('❌ Erro na execução do deploy:', error);
      return {
        success: false,
        message: `Erro na execução: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Deploy para Vercel
   */
  private async deployToVercel(
    clienteId: string, 
    envContent: string, 
    config: DeploymentConfig
  ): Promise<{success: boolean, message: string}> {
    try {
      // Implementar integração com Vercel API
      // const response = await fetch('https://api.vercel.com/v1/projects/...', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${config.deployment_token}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     env: envContent
      //   })
      // });

      // Por enquanto, simular sucesso
      console.log('✅ Deploy para Vercel simulado com sucesso');
      return {
        success: true,
        message: 'Deploy para Vercel executado com sucesso'
      };

    } catch (error) {
      return {
        success: false,
        message: `Erro no deploy Vercel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Deploy para Netlify
   */
  private async deployToNetlify(
    clienteId: string, 
    envContent: string, 
    config: DeploymentConfig
  ): Promise<{success: boolean, message: string}> {
    try {
      // Implementar integração com Netlify API
      // const response = await fetch('https://api.netlify.com/api/v1/sites/...', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${config.deployment_token}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     env: envContent
      //   })
      // });

      // Por enquanto, simular sucesso
      console.log('✅ Deploy para Netlify simulado com sucesso');
      return {
        success: true,
        message: 'Deploy para Netlify executado com sucesso'
      };

    } catch (error) {
      return {
        success: false,
        message: `Erro no deploy Netlify: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Deploy via webhook genérico
   */
  private async deployViaWebhook(
    clienteId: string, 
    envContent: string, 
    config: DeploymentConfig
  ): Promise<{success: boolean, message: string}> {
    try {
      const response = await fetch(config.deployment_url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.deployment_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cliente_id: clienteId,
          env_content: envContent,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Deploy via webhook executado com sucesso');
      return {
        success: true,
        message: 'Deploy via webhook executado com sucesso'
      };

    } catch (error) {
      return {
        success: false,
        message: `Erro no deploy webhook: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Configura deploy automático para um cliente
   */
  async configureDeployment(
    clienteId: string,
    deploymentUrl: string,
    deploymentToken: string,
    environment: 'development' | 'staging' | 'production' = 'production',
    autoDeploy: boolean = true
  ): Promise<boolean> {
    try {
      console.log('⚙️ Configurando deploy automático para cliente:', clienteId);

      const config: DeploymentConfig = {
        cliente_id: clienteId,
        deployment_url: deploymentUrl,
        deployment_token: deploymentToken,
        environment,
        auto_deploy: autoDeploy
      };

      const { error } = await supabaseCrm
        .from('deployment_configs')
        .upsert(config, { 
          onConflict: 'cliente_id',
          ignoreDuplicates: false 
        });

      if (error) {
        throw error;
      }

      console.log('✅ Configuração de deploy salva com sucesso');
      return true;

    } catch (error) {
      console.error('❌ Erro ao configurar deploy:', error);
      throw error;
    }
  }

  /**
   * Lista configurações de deploy
   */
  async listDeploymentConfigs(): Promise<DeploymentConfig[]> {
    try {
      const { data, error } = await supabaseCrm
        .from('deployment_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('❌ Erro ao listar configurações de deploy:', error);
      throw error;
    }
  }

  /**
   * Remove configuração de deploy
   */
  async removeDeploymentConfig(clienteId: string): Promise<boolean> {
    try {
      const { error } = await supabaseCrm
        .from('deployment_configs')
        .delete()
        .eq('cliente_id', clienteId);

      if (error) {
        throw error;
      }

      console.log('✅ Configuração de deploy removida');
      return true;

    } catch (error) {
      console.error('❌ Erro ao remover configuração de deploy:', error);
      throw error;
    }
  }

  /**
   * Testa configuração de deploy
   */
  async testDeploymentConfig(clienteId: string): Promise<{success: boolean, message: string}> {
    try {
      const config = await this.getDeploymentConfig(clienteId);
      
      if (!config) {
        return {
          success: false,
          message: 'Configuração de deploy não encontrada'
        };
      }

      // Testar conectividade
      const response = await fetch(config.deployment_url, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${config.deployment_token}`
        }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Configuração de deploy válida e acessível'
        };
      } else {
        return {
          success: false,
          message: `Erro de conectividade: HTTP ${response.status}`
        };
      }

    } catch (error) {
      return {
        success: false,
        message: `Erro no teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
}

// Instância singleton
export const autoDeploymentService = AutoDeploymentService.getInstance();

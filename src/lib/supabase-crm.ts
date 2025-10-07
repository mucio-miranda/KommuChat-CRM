import { createClient } from '@supabase/supabase-js'

// Configuração para o projeto CRM-KommuChat (para salvar usuários/clientes)
const crmSupabaseUrl = import.meta.env.VITE_CRM_SUPABASE_URL
const crmSupabaseAnonKey = import.meta.env.VITE_CRM_SUPABASE_ANON_KEY

console.log('🔍 CRM Supabase Config - URL:', crmSupabaseUrl);
console.log('🔍 CRM Supabase Config - Key presente:', !!crmSupabaseAnonKey);

// Criar cliente Supabase CRM apenas se as credenciais estiverem configuradas
const isValidCrmConfig = crmSupabaseUrl && crmSupabaseAnonKey && 
  crmSupabaseUrl !== 'your_crm_supabase_project_url' && 
  crmSupabaseAnonKey !== 'your_crm_supabase_anon_key';

console.log('🔍 CRM Supabase Config - isValid:', isValidCrmConfig);

export const supabaseCrm = isValidCrmConfig 
  ? createClient(crmSupabaseUrl, crmSupabaseAnonKey)
  : null;

console.log('🔍 CRM Supabase Config - Client:', supabaseCrm);

// Tipos para o CRM KOMMUchat
export interface Cliente {
  id: string
  nome: string
  email: string
  telefone: string
  tipo: 'clinica' | 'profissional'
  cnpj_cpf?: string
  endereco?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Usuario {
  id: string
  auth_user_id?: string
  email?: string | null
  nome: string
  role: 'admin' | 'funcionario'
  cliente_id: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface ConfiguracaoCliente {
  id: string
  cliente_id: string
  chave: string
  valor: string
  tipo: 'string' | 'boolean' | 'number'
  created_at: string
  updated_at: string
}

export interface WhatsAppQRCode {
  id: string
  cliente_id: string
  qr_code_data: string
  qr_code_image?: string
  status: 'pending' | 'scanned' | 'connected' | 'expired'
  phone_number?: string
  user_name?: string
  created_at: string
  updated_at: string
  expires_at: string
}

// Funções para gerenciar QR Code do WhatsApp
export const saveWhatsAppQRCode = async (
  clienteId: string, 
  qrCodeData: string, 
  qrCodeImage?: string
): Promise<WhatsAppQRCode | null> => {
  if (!supabaseCrm) {
    console.warn('Supabase CRM não configurado');
    return null;
  }

  try {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // QR code expira em 5 minutos

    const { data, error } = await supabaseCrm
      .from('whatsapp_qr_codes')
      .insert({
        cliente_id: clienteId,
        qr_code_data: qrCodeData,
        qr_code_image: qrCodeImage,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ QR Code salvo no banco:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao salvar QR Code:', error);
    return null;
  }
};

export const updateWhatsAppQRCodeStatus = async (
  qrCodeId: string, 
  status: WhatsAppQRCode['status'],
  phoneNumber?: string,
  userName?: string
): Promise<boolean> => {
  if (!supabaseCrm) {
    console.warn('Supabase CRM não configurado');
    return false;
  }

  try {
    const updateData: any = { status };
    if (phoneNumber) updateData.phone_number = phoneNumber;
    if (userName) updateData.user_name = userName;

    const { error } = await supabaseCrm
      .from('whatsapp_qr_codes')
      .update(updateData)
      .eq('id', qrCodeId);

    if (error) throw error;

    console.log('✅ Status do QR Code atualizado:', status);
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar status do QR Code:', error);
    return false;
  }
};

export const getActiveWhatsAppQRCode = async (
  clienteId: string
): Promise<WhatsAppQRCode | null> => {
  if (!supabaseCrm) {
    console.warn('Supabase CRM não configurado');
    return null;
  }

  try {
    const { data, error } = await supabaseCrm
      .from('whatsapp_qr_codes')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar QR Code ativo:', error);
    return null;
  }
};

// Função para buscar QR code salvo do cliente (upload manual)
export const getClienteSavedQRCode = async (
  clienteId: string
): Promise<string | null> => {
  if (!supabaseCrm) {
    console.warn('Supabase CRM não configurado');
    return null;
  }

  try {
    // Buscar URL do QR code nas configurações do cliente
    const { data, error } = await supabaseCrm
      .from('configuracoes_cliente')
      .select('valor')
      .eq('cliente_id', clienteId)
      .eq('chave', 'whatsapp_qr_code_url')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data?.valor || null;
  } catch (error) {
    console.error('❌ Erro ao buscar QR Code salvo do cliente:', error);
    return null;
  }
};

// Função para verificar se cliente tem QR code salvo
export const hasClienteSavedQRCode = async (
  clienteId: string
): Promise<boolean> => {
  const qrCodeUrl = await getClienteSavedQRCode(clienteId);
  return qrCodeUrl !== null && qrCodeUrl !== '';
};

// Função para fazer upload de QR code para o storage
export const uploadQRCodeToStorage = async (
  clienteId: string,
  file: File
): Promise<{ url: string; fileName: string } | null> => {
  if (!supabaseCrm) {
    console.warn('Supabase CRM não configurado');
    return null;
  }

  try {
    // Criar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `qr_code_${clienteId}_${Date.now()}.${fileExt}`;
    const filePath = `cliente-${clienteId}/${fileName}`;

    console.log('📤 Fazendo upload do QR Code:', filePath);

    // Upload para o storage
    const { data: uploadData, error: uploadError } = await supabaseCrm.storage
      .from('qr-codes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError);
      throw uploadError;
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabaseCrm.storage
      .from('qr-codes')
      .getPublicUrl(filePath);

    console.log('✅ Upload realizado com sucesso:', publicUrl);

    return {
      url: publicUrl,
      fileName: fileName
    };
  } catch (error) {
    console.error('❌ Erro ao fazer upload do QR Code:', error);
    return null;
  }
};

// Função para salvar QR code na tabela whatsapp_qr_codes
export const saveQRCodeToDatabase = async (
  clienteId: string,
  qrCodeUrl: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  qrCodeData?: string
): Promise<string | null> => {
  if (!supabaseCrm) {
    console.warn('Supabase CRM não configurado');
    return null;
  }

  try {
    const { data, error } = await supabaseCrm
      .from('whatsapp_qr_codes')
      .insert({
        cliente_id: clienteId,
        qr_code_data: qrCodeData,
        qr_code_image_url: qrCodeUrl,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
        status: 'pending',
        expires_at: null // Sem expiração
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ QR Code salvo no banco:', data);
    return data.id;
  } catch (error) {
    console.error('❌ Erro ao salvar QR Code no banco:', error);
    return null;
  }
};

// Função para obter QR codes de um cliente
export const getClienteQRCodes = async (
  clienteId: string
): Promise<WhatsAppQRCode[]> => {
  if (!supabaseCrm) {
    console.warn('Supabase CRM não configurado');
    return [];
  }

  try {
    const { data, error } = await supabaseCrm
      .from('whatsapp_qr_codes')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('❌ Erro ao buscar QR codes do cliente:', error);
    return [];
  }
};

// Função para deletar QR code
export const deleteQRCode = async (
  qrCodeId: string
): Promise<boolean> => {
  if (!supabaseCrm) {
    console.warn('Supabase CRM não configurado');
    return false;
  }

  try {
    // Primeiro, obter informações do QR code para deletar do storage
    const { data: qrCodeData, error: fetchError } = await supabaseCrm
      .from('whatsapp_qr_codes')
      .select('file_name, cliente_id')
      .eq('id', qrCodeId)
      .single();

    if (fetchError) throw fetchError;

    // Deletar do storage se existir
    if (qrCodeData?.file_name && qrCodeData?.cliente_id) {
      const filePath = `cliente-${qrCodeData.cliente_id}/${qrCodeData.file_name}`;
      const { error: storageError } = await supabaseCrm.storage
        .from('qr-codes')
        .remove([filePath]);

      if (storageError) {
        console.warn('⚠️ Erro ao deletar arquivo do storage:', storageError);
      }
    }

    // Deletar registro do banco
    const { error: deleteError } = await supabaseCrm
      .from('whatsapp_qr_codes')
      .delete()
      .eq('id', qrCodeId);

    if (deleteError) throw deleteError;

    console.log('✅ QR Code deletado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar QR Code:', error);
    return false;
  }
};


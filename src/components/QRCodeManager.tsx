import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  QrCode, 
  Upload, 
  Eye, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { 
  uploadQRCodeToStorage, 
  saveQRCodeToDatabase, 
  getClienteQRCodes, 
  deleteQRCode,
  WhatsAppQRCode 
} from '@/lib/supabase-crm';

interface QRCodeManagerProps {
  clienteId: string;
  clienteNome: string;
  onQRCodeUpdated?: () => void;
}

export function QRCodeManager({ clienteId, clienteNome, onQRCodeUpdated }: QRCodeManagerProps) {
  const [qrCodes, setQrCodes] = useState<WhatsAppQRCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Carregar QR codes do cliente
  const loadQRCodes = async () => {
    setLoading(true);
    try {
      const codes = await getClienteQRCodes(clienteId);
      setQrCodes(codes);
    } catch (error) {
      console.error('Erro ao carregar QR codes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os QR codes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQRCodes();
  }, [clienteId]);

  // Upload de novo QR code
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo para upload.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Mostrar toast de início
      toast({
        title: "Upload iniciado",
        description: "Enviando QR code para o storage...",
      });

      // 1. Upload para o storage
      const uploadResult = await uploadQRCodeToStorage(clienteId, selectedFile);
      
      if (!uploadResult) {
        throw new Error('Falha no upload para o storage');
      }

      // Mostrar progresso
      toast({
        title: "Upload concluído",
        description: "Salvando metadados no banco de dados...",
      });

      // 2. Salvar metadados no banco
      const qrCodeId = await saveQRCodeToDatabase(
        clienteId,
        uploadResult.url,
        uploadResult.fileName,
        selectedFile.size,
        selectedFile.type
      );

      if (!qrCodeId) {
        throw new Error('Falha ao salvar metadados no banco');
      }

      toast({
        title: "Sucesso",
        description: "QR Code atualizado com sucesso!",
      });

      // Limpar formulário e fechar dialog
      setSelectedFile(null);
      setShowUploadDialog(false);
      
      // Recarregar lista
      await loadQRCodes();
      
      // Notificar componente pai
      onQRCodeUpdated?.();

    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o QR code. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Deletar QR code
  const handleDelete = async (qrCodeId: string) => {
    if (!confirm('Tem certeza que deseja deletar este QR code?')) {
      return;
    }

    try {
      const success = await deleteQRCode(qrCodeId);
      
      if (success) {
        toast({
          title: "Sucesso",
          description: "QR Code deletado com sucesso!",
        });
        await loadQRCodes();
        onQRCodeUpdated?.();
      } else {
        throw new Error('Falha ao deletar QR code');
      }
    } catch (error) {
      console.error('Erro ao deletar QR code:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar o QR code.",
        variant: "destructive"
      });
    }
  };

  // Obter badge de status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'scanned':
        return <Badge variant="outline" className="text-blue-600"><Eye className="w-3 h-3 mr-1" />Escaneado</Badge>;
      case 'connected':
        return <Badge variant="default" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Conectado</Badge>;
      case 'expired':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Verificar se QR code está expirado
  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              QR Codes WhatsApp
            </CardTitle>
            <CardDescription>
              Gerencie os QR codes do WhatsApp para {clienteNome}
            </CardDescription>
          </div>
          
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Atualizar QR Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Atualizar QR Code WhatsApp</DialogTitle>
                <DialogDescription>
                  Faça upload de um novo QR code do WhatsApp para {clienteNome}. 
                  O sistema manterá apenas o QR code mais recente.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qr-file">Arquivo do QR Code</Label>
                  <Input
                    id="qr-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setSelectedFile(file || null);
                    }}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                  />
                  {selectedFile && (
                    <div className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    O novo QR code substituirá completamente o anterior. 
                    Formatos aceitos: PNG, JPEG, JPG, GIF, WebP (máx. 5MB).
                    Apenas o QR code mais recente será mantido.
                  </AlertDescription>
                </Alert>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Atualizar QR Code
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="ml-2">Carregando QR codes...</span>
          </div>
        ) : qrCodes.length === 0 ? (
          <div className="text-center py-8">
            <QrCode className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum QR code encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Faça upload do primeiro QR code do WhatsApp para este cliente.
            </p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload QR Code
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {qrCodes.map((qrCode) => (
              <div key={qrCode.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {/* Preview da imagem */}
                  <div className="w-16 h-16 border rounded-lg overflow-hidden bg-gray-50">
                    {qrCode.qr_code_image_url ? (
                      <img 
                        src={qrCode.qr_code_image_url} 
                        alt="QR Code"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <QrCode className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Informações */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{qrCode.file_name}</span>
                      {getStatusBadge(qrCode.status)}
                      {isExpired(qrCode.expires_at) && (
                        <Badge variant="destructive" className="text-xs">Expirado</Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <div>Criado: {new Date(qrCode.created_at).toLocaleString()}</div>
                      <div>Expira: {new Date(qrCode.expires_at).toLocaleString()}</div>
                      {qrCode.file_size && (
                        <div>Tamanho: {(qrCode.file_size / 1024).toFixed(1)} KB</div>
                      )}
                      {qrCode.phone_number && (
                        <div className="flex items-center gap-1">
                          <Smartphone className="w-3 h-3" />
                          {qrCode.phone_number}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Ações */}
                <div className="flex items-center gap-2">
                  {qrCode.qr_code_image_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(qrCode.qr_code_image_url, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(qrCode.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}







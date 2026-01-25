import React, { useRef, useEffect } from 'react';
import { WhatsAppChatMessage } from '@/lib/whatsapp-types';
import { cn } from '@/lib/utils';

interface WhatsAppChatProps {
  messages: WhatsAppChatMessage[];
  patientName: string;
}

/**
 * Componente de Chat do WhatsApp
 * Renderiza mensagens com diferenciação visual para inbound (cliente) e outbound (agente)
 */
export function WhatsAppChat({ messages, patientName }: WhatsAppChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automático para a última mensagem
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <div className="text-center text-muted-foreground">
          <div className="text-4xl mb-3">💬</div>
          <p>Nenhuma mensagem nesta conversa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3 p-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} patientName={patientName} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

interface MessageBubbleProps {
  message: WhatsAppChatMessage;
  patientName: string;
}

/**
 * Balão de mensagem individual
 */
function MessageBubble({ message, patientName }: MessageBubbleProps) {
  const isOutbound = message.type === 'outbound';

  return (
    <div
      className={cn(
        'flex w-full',
        isOutbound ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm',
          isOutbound
            ? 'bg-emerald-500 text-white rounded-tr-sm'
            : 'bg-white dark:bg-zinc-800 text-foreground rounded-tl-sm border border-border'
        )}
      >
        {/* Nome do remetente */}
        <div
          className={cn(
            'text-xs font-medium mb-1',
            isOutbound ? 'text-emerald-100' : 'text-muted-foreground'
          )}
        >
          {isOutbound ? message.from : (message.from || patientName)}
        </div>

        {/* Conteúdo da mensagem */}
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </p>

        {/* Timestamp */}
        <div
          className={cn(
            'text-[10px] mt-1.5 text-right',
            isOutbound ? 'text-emerald-200' : 'text-muted-foreground'
          )}
        >
          {message.formattedTime}
        </div>
      </div>
    </div>
  );
}

interface WhatsAppChatContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Container para o chat com fundo estilo WhatsApp
 */
export function WhatsAppChatContainer({ children, className }: WhatsAppChatContainerProps) {
  return (
    <div
      className={cn(
        // min-h-0 é essencial para overflow funcionar com flex
        'flex-1 min-h-0 overflow-y-auto',
        // Fundo estilo WhatsApp com padrão sutil
        'bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950',
        // Padrão de fundo decorativo
        'bg-[url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")]',
        // Scrollbar em escala de cinza
        'scrollbar-gray',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Skeleton loader para mensagens
 */
export function WhatsAppChatSkeleton() {
  return (
    <div className="flex flex-col space-y-3 p-4 animate-pulse">
      {/* Mensagem inbound */}
      <div className="flex justify-start">
        <div className="max-w-[60%] rounded-2xl rounded-tl-sm bg-zinc-200 dark:bg-zinc-700 h-16 w-48" />
      </div>
      {/* Mensagem outbound */}
      <div className="flex justify-end">
        <div className="max-w-[60%] rounded-2xl rounded-tr-sm bg-emerald-200 dark:bg-emerald-800 h-20 w-56" />
      </div>
      {/* Mensagem inbound */}
      <div className="flex justify-start">
        <div className="max-w-[60%] rounded-2xl rounded-tl-sm bg-zinc-200 dark:bg-zinc-700 h-12 w-40" />
      </div>
      {/* Mensagem outbound */}
      <div className="flex justify-end">
        <div className="max-w-[60%] rounded-2xl rounded-tr-sm bg-emerald-200 dark:bg-emerald-800 h-24 w-64" />
      </div>
    </div>
  );
}

export default WhatsAppChat;


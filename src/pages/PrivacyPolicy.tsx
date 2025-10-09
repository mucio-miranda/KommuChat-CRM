import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
          >
            ← Voltar para o Sistema
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Política de Privacidade
          </h1>
          <p className="text-gray-600">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              1. Introdução
            </h2>
            <p className="text-gray-700 leading-relaxed">
              O CRM KommuChat ("nós", "nosso" ou "aplicativo") respeita sua privacidade 
              e está comprometido em proteger seus dados pessoais. Esta política de 
              privacidade explica como coletamos, usamos e protegemos suas informações 
              quando você usa nosso sistema de gerenciamento de relacionamento com clientes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              2. Dados Coletados
            </h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              Coletamos as seguintes informações:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Informações de autenticação (e-mail e senha criptografada)</li>
              <li>Dados de pacientes/clientes inseridos no sistema</li>
              <li>Informações de agendamentos e consultas</li>
              <li>Dados de acesso ao Google Calendar (quando autorizado)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              3. Uso do Google Calendar
            </h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              Nosso aplicativo integra-se com o Google Calendar para:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Visualizar seus eventos e compromissos</li>
              <li>Criar e gerenciar agendamentos de consultas</li>
              <li>Sincronizar automaticamente compromissos do CRM com sua agenda</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              <strong>Importante:</strong> Só acessamos seu Google Calendar quando você 
              explicitamente autoriza. Você pode revogar essa autorização a qualquer momento 
              através das configurações da sua conta Google.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              4. Como Usamos Seus Dados
            </h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Fornecer e manter o serviço do CRM</li>
              <li>Gerenciar agendamentos e compromissos</li>
              <li>Sincronizar dados entre o sistema e o Google Calendar</li>
              <li>Melhorar a experiência do usuário</li>
              <li>Garantir a segurança e integridade do sistema</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              5. Compartilhamento de Dados
            </h2>
            <p className="text-gray-700 leading-relaxed">
              <strong>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros</strong>, 
              exceto quando necessário para:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-2">
              <li>Cumprir obrigações legais</li>
              <li>Integrar com serviços autorizados por você (Google Calendar)</li>
              <li>Proteger nossos direitos e segurança</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              6. Segurança dos Dados
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Implementamos medidas de segurança técnicas e organizacionais para proteger 
              seus dados contra acesso não autorizado, alteração, divulgação ou destruição. 
              Isso inclui:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-2">
              <li>Criptografia de senhas e dados sensíveis</li>
              <li>Conexões seguras (HTTPS/SSL)</li>
              <li>Controle de acesso baseado em funções</li>
              <li>Backups regulares</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              7. Seus Direitos
            </h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              Você tem direito a:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incorretos</li>
              <li>Solicitar a exclusão de seus dados</li>
              <li>Revogar autorizações de acesso ao Google Calendar</li>
              <li>Exportar seus dados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              8. Retenção de Dados
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Mantemos seus dados pelo tempo necessário para fornecer nossos serviços 
              ou conforme exigido por lei. Quando você solicitar a exclusão da sua conta, 
              seus dados serão removidos permanentemente dentro de 30 dias.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              9. Conformidade com a LGPD
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Este aplicativo está em conformidade com a Lei Geral de Proteção de Dados 
              (LGPD - Lei nº 13.709/2018) do Brasil. Tratamos seus dados pessoais de forma 
              transparente e segura, respeitando todos os seus direitos como titular de dados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              10. Alterações nesta Política
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Podemos atualizar esta política de privacidade periodicamente. Notificaremos 
              você sobre mudanças significativas através do sistema ou por e-mail.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              11. Contato
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como 
              tratamos seus dados, entre em contato conosco através do sistema ou pelo 
              e-mail de suporte.
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              © {new Date().getFullYear()} CRM KommuChat. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


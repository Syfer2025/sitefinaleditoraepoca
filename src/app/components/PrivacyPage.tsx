import { useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { Shield, ArrowLeft } from "lucide-react";
import { useSEO } from "../hooks/useSEO";

const F = "Inter, sans-serif";
const PF = "'Playfair Display', serif";

export function PrivacyPage() {
  const navigate = useNavigate();
  useSEO({
    title: "Política de Privacidade",
    description: "Saiba como a Época Editora de Livros coleta, usa e protege seus dados pessoais, em conformidade com a LGPD (Lei n. 13.709/2018).",
    canonical: "https://editoraepoca.com.br/privacidade",
  });
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4 md:px-6" style={{ backgroundColor: "#FFFDF8" }}>
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-[#856C42] hover:text-[#165B36] transition-colors mb-6"
            style={{ fontFamily: F }}
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #165B36, #052413)" }}>
              <Shield className="w-5 h-5 text-[#EBBF74]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#052413]" style={{ fontFamily: PF }}>
                Política de Privacidade
              </h1>
              <p className="text-xs text-[#856C42]" style={{ fontFamily: F }}>Última atualização: 21 de março de 2026</p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-[#052413]/80 leading-relaxed space-y-6" style={{ fontFamily: F }}>
            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>1. Identificação do Controlador</h2>
              <p>
                <strong>Época Editora de Livros</strong>, pessoa jurídica de direito privado, com sede na cidade de Maringá,
                Estado do Paraná, Brasil, é a controladora dos dados pessoais coletados por meio deste site,
                nos termos da Lei Geral de Proteção de Dados Pessoais (Lei n. 13.709/2018 — LGPD).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>2. Dados Pessoais Coletados</h2>
              <p>Coletamos os seguintes dados pessoais:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Dados cadastrais:</strong> nome completo, e-mail, CPF ou CNPJ, razão social (para PJ);</li>
                <li><strong>Dados de contato:</strong> telefone (quando fornecido), endereço de e-mail;</li>
                <li><strong>Dados de navegação:</strong> endereço IP (coletado automaticamente pelo servidor para segurança e prevenção a fraudes), tipo de navegador, resolução de tela, páginas visitadas;</li>
                <li><strong>Dados contratuais:</strong> informações do projeto editorial, valores, histórico de pagamentos;</li>
                <li><strong>Dados de geolocalização:</strong> coordenadas GPS (somente com consentimento explícito no aceite do contrato);</li>
                <li><strong>Dados de pagamento:</strong> processados diretamente pelo Mercado Pago — não armazenamos dados de cartão de crédito.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>3. Finalidades do Tratamento</h2>
              <p>Os dados pessoais são tratados para as seguintes finalidades:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Prestação de serviços editoriais contratados (base legal: execução de contrato — art. 7, V, LGPD);</li>
                <li>Emissão de documentos fiscais e cumprimento de obrigações tributárias (base legal: obrigação legal — art. 7, II, LGPD);</li>
                <li>Comunicação sobre o andamento de projetos e novidades da editora;</li>
                <li>Melhoria da experiência de navegação e segurança do site (base legal: interesse legítimo — art. 7, IX, LGPD);</li>
                <li>Registro de aceite eletrônico de contratos (base legal: exercício regular de direitos — art. 7, VI, LGPD).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>4. Compartilhamento de Dados</h2>
              <p>Seus dados pessoais podem ser compartilhados com:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Mercado Pago:</strong> para processamento de pagamentos;</li>
                <li><strong>Supabase:</strong> infraestrutura de hospedagem e armazenamento de dados. Os servidores da Supabase podem estar localizados fora do Brasil (EUA/UE). A transferência internacional é realizada com base em cláusulas contratuais adequadas, conforme art. 33 da LGPD;</li>
                <li><strong>ViaCEP (viacep.com.br):</strong> serviço público de consulta de CEP utilizado no preenchimento automático de endereço no cadastro — somente o CEP informado é enviado, sem outros dados pessoais;</li>
                <li><strong>ReceitaWS (receitaws.com.br):</strong> API pública de consulta de CNPJ utilizada, mediante ação explícita do usuário, para validação de pessoa jurídica — somente o CNPJ informado é enviado;</li>
                <li><strong>Autoridades fiscais:</strong> para cumprimento de obrigações legais e tributárias;</li>
                <li><strong>Autoridades judiciais:</strong> quando houver determinação legal.</li>
              </ul>
              <p className="mt-2">Não vendemos, alugamos ou comercializamos dados pessoais com terceiros para fins de marketing.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>5. Retenção de Dados</h2>
              <p>
                Os dados pessoais serão retidos pelo período de <strong>5 (cinco) anos</strong> após a conclusão do contrato,
                para fins de cumprimento de obrigações legais e fiscais. Após esse período, os dados serão anonimizados ou eliminados.
              </p>
              <p className="mt-2">
                Dados de navegação e cookies são retidos por até <strong>12 meses</strong> a partir da coleta.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>6. Direitos do Titular</h2>
              <p>Conforme o art. 18 da LGPD, você tem direito a:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Confirmar a existência de tratamento de dados;</li>
                <li>Acessar seus dados pessoais;</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
                <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
                <li>Solicitar a portabilidade dos dados a outro fornecedor;</li>
                <li>Revogar o consentimento a qualquer momento;</li>
                <li>Obter informações sobre entidades públicas e privadas com as quais compartilhamos dados.</li>
              </ul>
              <p className="mt-2">
                Para exercer esses direitos, acesse nossa{" "}
                <Link to="/meus-dados" className="text-[#165B36] hover:underline">
                  página de solicitação de dados
                </Link>{" "}
                ou entre em contato pelo e-mail{" "}
                <a href="mailto:privacidade@epocaeditora.com.br" className="text-[#165B36] hover:underline">
                  privacidade@epocaeditora.com.br
                </a>
                . Responderemos em até <strong>15 dias úteis</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>7. Cookies</h2>
              <p>Utilizamos os seguintes tipos de cookies:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Cookies essenciais:</strong> necessários para o funcionamento básico do site (autenticação, preferências de sessão);</li>
                <li><strong>Cookies analíticos:</strong> utilizados para entender como os visitantes interagem com o site (podem ser recusados sem prejuízo da navegação).</li>
              </ul>
              <p className="mt-2">
                Você pode gerenciar suas preferências de cookies a qualquer momento através do banner de consentimento exibido ao acessar o site.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>8. Segurança</h2>
              <p>
                Adotamos medidas técnicas e administrativas adequadas para proteger seus dados pessoais, incluindo:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Criptografia SSL/TLS em todas as comunicações;</li>
                <li>Hash SHA-256 para integridade de contratos eletrônicos;</li>
                <li>Armazenamento em infraestrutura segura (Supabase) com backups automáticos;</li>
                <li>Controle de acesso baseado em funções (RBAC) para dados administrativos;</li>
                <li>Snapshot imutável de contratos no momento do aceite eletrônico.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>9. Encarregado de Dados (DPO)</h2>
              <p>
                Nosso Encarregado de Dados (DPO), designado conforme art. 37 da LGPD, pode ser contactado para
                questões relacionadas à proteção de dados pessoais:
              </p>
              <p className="mt-2">
                <strong>E-mail:</strong>{" "}
                <a href="mailto:privacidade@epocaeditora.com.br" className="text-[#165B36] hover:underline">
                  privacidade@epocaeditora.com.br
                </a>
              </p>
              <p className="mt-1 text-sm text-[#052413]/60">
                Responderemos a solicitações relacionadas a dados pessoais em até 15 dias úteis, conforme art. 18, § 5 da LGPD.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>9a. Incidentes de Segurança (Art. 48 LGPD)</h2>
              <p>
                Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares,
                a Época Editora notificará a Autoridade Nacional de Proteção de Dados (ANPD) e os titulares
                afetados em prazo razoável, conforme art. 48 da LGPD, informando:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>A natureza dos dados afetados;</li>
                <li>As informações sobre os titulares envolvidos;</li>
                <li>As medidas técnicas e de segurança adotadas;</li>
                <li>Os riscos relacionados ao incidente;</li>
                <li>As medidas que foram ou que serão adotadas para reverter ou mitigar os efeitos do incidente.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>10. Alterações nesta Política</h2>
              <p>
                Esta política pode ser atualizada periodicamente. Notificaremos sobre alterações significativas
                por meio de aviso no site ou por e-mail. Recomendamos a revisão periódica deste documento.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>11. Foro Competente</h2>
              <p>
                Fica eleito o foro da Comarca de Maringá, Estado do Paraná, para dirimir quaisquer questões
                relacionadas a esta Política de Privacidade, com exclusão de qualquer outro.
              </p>
            </section>

            <div className="mt-10 pt-6 border-t" style={{ borderColor: "rgba(133,108,66,0.15)" }}>
              <p className="text-xs text-[#856C42]/60 text-center">
                Época Editora de Livros — Maringá, PR, Brasil
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

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
                Politica de Privacidade
              </h1>
              <p className="text-xs text-[#856C42]" style={{ fontFamily: F }}>Ultima atualizacao: 21 de marco de 2026</p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-[#052413]/80 leading-relaxed space-y-6" style={{ fontFamily: F }}>
            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>1. Identificacao do Controlador</h2>
              <p>
                <strong>Epoca Editora de Livros</strong>, pessoa juridica de direito privado, com sede na cidade de Maringa,
                Estado do Parana, Brasil, e a controladora dos dados pessoais coletados por meio deste site,
                nos termos da Lei Geral de Protecao de Dados Pessoais (Lei n. 13.709/2018 — LGPD).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>2. Dados Pessoais Coletados</h2>
              <p>Coletamos os seguintes dados pessoais:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Dados cadastrais:</strong> nome completo, e-mail, CPF ou CNPJ, razao social (para PJ);</li>
                <li><strong>Dados de contato:</strong> telefone (quando fornecido), endereco de e-mail;</li>
                <li><strong>Dados de navegacao:</strong> endereco IP (coletado automaticamente pelo servidor para seguranca e prevencao a fraudes), tipo de navegador, resolucao de tela, paginas visitadas;</li>
                <li><strong>Dados contratuais:</strong> informacoes do projeto editorial, valores, historico de pagamentos;</li>
                <li><strong>Dados de geolocalizacao:</strong> coordenadas GPS (somente com consentimento explicito no aceite do contrato);</li>
                <li><strong>Dados de pagamento:</strong> processados diretamente pelo Mercado Pago — nao armazenamos dados de cartao de credito.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>3. Finalidades do Tratamento</h2>
              <p>Os dados pessoais sao tratados para as seguintes finalidades:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Prestacao de servicos editoriais contratados (base legal: execucao de contrato — art. 7, V, LGPD);</li>
                <li>Emissao de documentos fiscais e cumprimento de obrigacoes tributarias (base legal: obrigacao legal — art. 7, II, LGPD);</li>
                <li>Comunicacao sobre o andamento de projetos e novidades da editora;</li>
                <li>Melhoria da experiencia de navegacao e seguranca do site (base legal: interesse legitimo — art. 7, IX, LGPD);</li>
                <li>Registro de aceite eletronico de contratos (base legal: exercicio regular de direitos — art. 7, VI, LGPD).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>4. Compartilhamento de Dados</h2>
              <p>Seus dados pessoais podem ser compartilhados com:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Mercado Pago:</strong> para processamento de pagamentos;</li>
                <li><strong>Supabase:</strong> infraestrutura de hospedagem e armazenamento de dados. Os servidores da Supabase podem estar localizados fora do Brasil (EUA/UE). A transferencia internacional e realizada com base em clausulas contratuais adequadas, conforme art. 33 da LGPD;</li>
                <li><strong>ViaCEP (viacep.com.br):</strong> servico publico de consulta de CEP utilizado no preenchimento automatico de endereco no cadastro — somente o CEP informado e enviado, sem outros dados pessoais;</li>
                <li><strong>ReceitaWS (receitaws.com.br):</strong> API publica de consulta de CNPJ utilizada, mediante acao explicita do usuario, para validacao de pessoa juridica — somente o CNPJ informado e enviado;</li>
                <li><strong>Autoridades fiscais:</strong> para cumprimento de obrigacoes legais e tributarias;</li>
                <li><strong>Autoridades judiciais:</strong> quando houver determinacao legal.</li>
              </ul>
              <p className="mt-2">Nao vendemos, alugamos ou comercializamos dados pessoais com terceiros para fins de marketing.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>5. Retencao de Dados</h2>
              <p>
                Os dados pessoais serao retidos pelo periodo de <strong>5 (cinco) anos</strong> apos a conclusao do contrato,
                para fins de cumprimento de obrigacoes legais e fiscais. Apos esse periodo, os dados serao anonimizados ou eliminados.
              </p>
              <p className="mt-2">
                Dados de navegacao e cookies sao retidos por ate <strong>12 meses</strong> a partir da coleta.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>6. Direitos do Titular</h2>
              <p>Conforme o art. 18 da LGPD, voce tem direito a:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Confirmar a existencia de tratamento de dados;</li>
                <li>Acessar seus dados pessoais;</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
                <li>Solicitar a anonimizacao, bloqueio ou eliminacao de dados desnecessarios ou excessivos;</li>
                <li>Solicitar a portabilidade dos dados a outro fornecedor;</li>
                <li>Revogar o consentimento a qualquer momento;</li>
                <li>Obter informacoes sobre entidades publicas e privadas com as quais compartilhamos dados.</li>
              </ul>
              <p className="mt-2">
                Para exercer esses direitos, acesse nossa{" "}
                <Link to="/meus-dados" className="text-[#165B36] hover:underline">
                  pagina de solicitacao de dados
                </Link>{" "}
                ou entre em contato pelo e-mail{" "}
                <a href="mailto:privacidade@epocaeditora.com.br" className="text-[#165B36] hover:underline">
                  privacidade@epocaeditora.com.br
                </a>
                . Responderemos em ate <strong>15 dias uteis</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>7. Cookies</h2>
              <p>Utilizamos os seguintes tipos de cookies:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Cookies essenciais:</strong> necessarios para o funcionamento basico do site (autenticacao, preferencias de sessao);</li>
                <li><strong>Cookies analiticos:</strong> utilizados para entender como os visitantes interagem com o site (podem ser recusados sem prejuizo da navegacao).</li>
              </ul>
              <p className="mt-2">
                Voce pode gerenciar suas preferencias de cookies a qualquer momento atraves do banner de consentimento exibido ao acessar o site.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>8. Seguranca</h2>
              <p>
                Adotamos medidas tecnicas e administrativas adequadas para proteger seus dados pessoais, incluindo:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Criptografia SSL/TLS em todas as comunicacoes;</li>
                <li>Hash SHA-256 para integridade de contratos eletronicos;</li>
                <li>Armazenamento em infraestrutura segura (Supabase) com backups automaticos;</li>
                <li>Controle de acesso baseado em funcoes (RBAC) para dados administrativos;</li>
                <li>Snapshot imutavel de contratos no momento do aceite eletronico.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>9. Encarregado de Dados (DPO)</h2>
              <p>
                Nosso Encarregado de Dados (DPO), designado conforme art. 37 da LGPD, pode ser contactado para
                questoes relacionadas a protecao de dados pessoais:
              </p>
              <p className="mt-2">
                <strong>E-mail:</strong>{" "}
                <a href="mailto:privacidade@epocaeditora.com.br" className="text-[#165B36] hover:underline">
                  privacidade@epocaeditora.com.br
                </a>
              </p>
              <p className="mt-1 text-sm text-[#052413]/60">
                Responderemos a solicitacoes relacionadas a dados pessoais em ate 15 dias uteis, conforme art. 18, § 5 da LGPD.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>9a. Incidentes de Seguranca (Art. 48 LGPD)</h2>
              <p>
                Em caso de incidente de seguranca que possa acarretar risco ou dano relevante aos titulares,
                a Epoca Editora notificara a Autoridade Nacional de Protecao de Dados (ANPD) e os titulares
                afetados em prazo razoavel, conforme art. 48 da LGPD, informando:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>A natureza dos dados afetados;</li>
                <li>As informacoes sobre os titulares envolvidos;</li>
                <li>As medidas tecnicas e de seguranca adotadas;</li>
                <li>Os riscos relacionados ao incidente;</li>
                <li>As medidas que foram ou que serao adotadas para reverter ou mitigar os efeitos do incidente.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>10. Alteracoes nesta Politica</h2>
              <p>
                Esta politica pode ser atualizada periodicamente. Notificaremos sobre alteracoes significativas
                por meio de aviso no site ou por e-mail. Recomendamos a revisao periodica deste documento.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>11. Foro Competente</h2>
              <p>
                Fica eleito o foro da Comarca de Maringa, Estado do Parana, para dirimir quaisquer questoes
                relacionadas a esta Politica de Privacidade, com exclusao de qualquer outro.
              </p>
            </section>

            <div className="mt-10 pt-6 border-t" style={{ borderColor: "rgba(133,108,66,0.15)" }}>
              <p className="text-xs text-[#856C42]/60 text-center">
                Epoca Editora de Livros — Maringa, PR, Brasil
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

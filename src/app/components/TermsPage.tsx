import { useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ScrollText, ArrowLeft } from "lucide-react";
import { useSEO } from "../hooks/useSEO";


export function TermsPage() {
  const navigate = useNavigate();
  useSEO({
    title: "Termos de Uso",
    description: "Leia os Termos de Uso da Época Editora de Livros. Condições para contratação de serviços editoriais, responsabilidades e direitos dos usuários.",
    canonical: "https://editoraepoca.com.br/termos",
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
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #165B36, #052413)" }}>
              <ScrollText className="w-5 h-5 text-[#EBBF74]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#052413] font-serif">
                Termos de Uso
              </h1>
              <p className="text-xs text-[#856C42]">Última atualização: 03 de março de 2026</p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-[#052413]/80 leading-relaxed space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3 font-serif">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e utilizar o site da <strong>Época Editora de Livros</strong>, você concorda com estes Termos de Uso.
                Caso não concorde com algum dos termos aqui descritos, solicitamos que não utilize nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3 font-serif">2. Descrição dos Serviços</h2>
              <p>A Época Editora de Livros oferece serviços editoriais que incluem:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Diagramação e projeto gráfico de livros;</li>
                <li>Revisão textual e gramatical;</li>
                <li>Criação de capas e material visual;</li>
                <li>Consultoria editorial;</li>
                <li>Registro de ISBN e ficha catalográfica;</li>
                <li>Publicação e distribuição digital.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3 font-serif">3. Cadastro e Conta do Usuário</h2>
              <p>
                Para solicitar serviços editoriais, é necessário criar uma conta informando dados verídicos e atualizados.
                O usuário é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as
                atividades realizadas em sua conta.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3 font-serif">4. Contratação e Pagamento</h2>
              <p>
                A contratação de serviços é formalizada por meio de contrato eletrônico disponível na plataforma.
                O aceite eletrônico tem validade jurídica nos termos da MP n. 2.200-2/2001.
              </p>
              <p className="mt-2">
                Os pagamentos são processados por meio do Mercado Pago, podendo ser realizados via Pix, cartão de crédito
                ou boleto bancário. A Época Editora não armazena dados de cartão de crédito.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3 font-serif">5. Propriedade Intelectual</h2>
              <p>
                O conteúdo do site (layout, textos, imagens, logotipos, ícones) é de propriedade exclusiva da Época Editora
                de Livros, protegido pelas leis brasileiras de propriedade intelectual. A reprodução não autorizada é proibida.
              </p>
              <p className="mt-2">
                Os direitos autorais sobre o conteúdo das obras dos clientes permanecem integralmente com os respectivos autores,
                conforme estipulado no contrato de prestação de serviços.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3 font-serif">6. Responsabilidades do Usuário</h2>
              <p>O usuário se compromete a:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Fornecer informações verdadeiras e atualizadas;</li>
                <li>Não utilizar o site para atividades ilícitas ou que violem direitos de terceiros;</li>
                <li>Garantir que possui todos os direitos autorais sobre o conteúdo submetido para publicação;</li>
                <li>Respeitar os prazos de resposta e aprovação previstos no contrato.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3 font-serif">7. Limitação de Responsabilidade</h2>
              <p>
                A Época Editora não se responsabiliza por danos indiretos, incidentais ou consequenciais decorrentes
                do uso ou impossibilidade de uso do site. O site é fornecido "no estado em que se encontra", sem
                garantias de disponibilidade ininterrupta.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3 font-serif">8. Proteção de Dados</h2>
              <p>
                O tratamento de dados pessoais é regido pela nossa{" "}
                <Link to="/privacidade" className="text-[#165B36] hover:underline font-medium">
                  Política de Privacidade
                </Link>
                , em conformidade com a LGPD (Lei n. 13.709/2018).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3 font-serif">9. Modificações nos Termos</h2>
              <p>
                A Época Editora reserva-se o direito de modificar estes Termos de Uso a qualquer momento.
                As alterações entram em vigor na data de sua publicação no site. O uso continuado dos serviços
                após a publicação implica na aceitação dos termos revisados.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3 font-serif">10. Foro Competente</h2>
              <p>
                Fica eleito o foro da Comarca de Maringá, Estado do Paraná, para dirimir quaisquer controvérsias
                decorrentes destes Termos de Uso, com exclusão de qualquer outro, por mais privilegiado que seja.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3 font-serif">11. Legislação Aplicável</h2>
              <p>
                Estes Termos de Uso são regidos pela legislação da República Federativa do Brasil, em especial
                o Código Civil (Lei n. 10.406/2002), o Código de Defesa do Consumidor (Lei n. 8.078/1990),
                o Marco Civil da Internet (Lei n. 12.965/2014) e a LGPD (Lei n. 13.709/2018).
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

import { useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ScrollText, ArrowLeft } from "lucide-react";
import { useSEO } from "../hooks/useSEO";

const F = "Inter, sans-serif";
const PF = "'Playfair Display', serif";

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
            style={{ fontFamily: F }}
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #165B36, #052413)" }}>
              <ScrollText className="w-5 h-5 text-[#EBBF74]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#052413]" style={{ fontFamily: PF }}>
                Termos de Uso
              </h1>
              <p className="text-xs text-[#856C42]" style={{ fontFamily: F }}>Ultima atualizacao: 03 de marco de 2026</p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-[#052413]/80 leading-relaxed space-y-6" style={{ fontFamily: F }}>
            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>1. Aceitacao dos Termos</h2>
              <p>
                Ao acessar e utilizar o site da <strong>Epoca Editora de Livros</strong>, voce concorda com estes Termos de Uso.
                Caso nao concorde com algum dos termos aqui descritos, solicitamos que nao utilize nossos servicos.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>2. Descricao dos Servicos</h2>
              <p>A Epoca Editora de Livros oferece servicos editoriais que incluem:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Diagramacao e projeto grafico de livros;</li>
                <li>Revisao textual e gramatical;</li>
                <li>Criacao de capas e material visual;</li>
                <li>Consultoria editorial;</li>
                <li>Registro de ISBN e ficha catalografica;</li>
                <li>Publicacao e distribuicao digital.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>3. Cadastro e Conta do Usuario</h2>
              <p>
                Para solicitar servicos editoriais, e necessario criar uma conta informando dados veridicos e atualizados.
                O usuario e responsavel por manter a confidencialidade de suas credenciais de acesso e por todas as
                atividades realizadas em sua conta.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>4. Contratacao e Pagamento</h2>
              <p>
                A contratacao de servicos e formalizada por meio de contrato eletronico disponivel na plataforma.
                O aceite eletronico tem validade juridica nos termos da MP n. 2.200-2/2001.
              </p>
              <p className="mt-2">
                Os pagamentos sao processados por meio do Mercado Pago, podendo ser realizados via Pix, cartao de credito
                ou boleto bancario. A Epoca Editora nao armazena dados de cartao de credito.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>5. Propriedade Intelectual</h2>
              <p>
                O conteudo do site (layout, textos, imagens, logotipos, icones) e de propriedade exclusiva da Epoca Editora
                de Livros, protegido pelas leis brasileiras de propriedade intelectual. A reproducao nao autorizada e proibida.
              </p>
              <p className="mt-2">
                Os direitos autorais sobre o conteudo das obras dos clientes permanecem integralmente com os respectivos autores,
                conforme estipulado no contrato de prestacao de servicos.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>6. Responsabilidades do Usuario</h2>
              <p>O usuario se compromete a:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Fornecer informacoes verdadeiras e atualizadas;</li>
                <li>Nao utilizar o site para atividades ilicitas ou que violem direitos de terceiros;</li>
                <li>Garantir que possui todos os direitos autorais sobre o conteudo submetido para publicacao;</li>
                <li>Respeitar os prazos de resposta e aprovacao previstos no contrato.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>7. Limitacao de Responsabilidade</h2>
              <p>
                A Epoca Editora nao se responsabiliza por danos indiretos, incidentais ou consequenciais decorrentes
                do uso ou impossibilidade de uso do site. O site e fornecido "no estado em que se encontra", sem
                garantias de disponibilidade ininterrupta.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>8. Protecao de Dados</h2>
              <p>
                O tratamento de dados pessoais e regido pela nossa{" "}
                <Link to="/privacidade" className="text-[#165B36] hover:underline font-medium">
                  Politica de Privacidade
                </Link>
                , em conformidade com a LGPD (Lei n. 13.709/2018).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>9. Modificacoes nos Termos</h2>
              <p>
                A Epoca Editora reserva-se o direito de modificar estes Termos de Uso a qualquer momento.
                As alteracoes entram em vigor na data de sua publicacao no site. O uso continuado dos servicos
                apos a publicacao implica na aceitacao dos termos revisados.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>10. Foro Competente</h2>
              <p>
                Fica eleito o foro da Comarca de Maringa, Estado do Parana, para dirimir quaisquer controversias
                decorrentes destes Termos de Uso, com exclusao de qualquer outro, por mais privilegiado que seja.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#052413] mt-8 mb-3" style={{ fontFamily: PF }}>11. Legislacao Aplicavel</h2>
              <p>
                Estes Termos de Uso sao regidos pela legislacao da Republica Federativa do Brasil, em especial
                o Codigo Civil (Lei n. 10.406/2002), o Codigo de Defesa do Consumidor (Lei n. 8.078/1990),
                o Marco Civil da Internet (Lei n. 12.965/2014) e a LGPD (Lei n. 13.709/2018).
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

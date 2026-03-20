import { useState, useEffect, useCallback } from "react";
import {
  Loader2, Save, Eye, Edit3, AlertCircle, CheckCircle,
  RotateCcw, ChevronDown, ChevronUp, Zap, Info, ScrollText, Clock,
  FileText, X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { getContractTemplate, saveContractTemplate, getContractTemplateHistory } from "../../data/api";

const F = "Inter, sans-serif";
const PF = "'Playfair Display', serif";

// ============================================
// Default contract template
// ============================================
interface ClauseData {
  number: number;
  title: string;
  content: string;
  type: "static" | "dynamic";
  dynamicNote?: string;
}

interface ContractTemplate {
  version: string;
  companyName: string;
  companyDescription: string;
  preamble: string;
  clauses: ClauseData[];
  updatedAt?: string;
  updatedBy?: string;
}

const DEFAULT_TEMPLATE: ContractTemplate = {
  version: "1.0",
  companyName: "Epoca Editora de Livros",
  companyDescription: "pessoa juridica de direito privado, com sede em territorio brasileiro",
  preamble: "Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente Contrato de Prestacao de Servicos Editoriais, que se regera pelas seguintes clausulas e condicoes:",
  clauses: [
    {
      number: 1,
      title: "DAS PARTES",
      content: "CONTRATADA: {{nome_editora}}, {{descricao_editora}}, doravante denominada simplesmente \"EDITORA\".\n\nCONTRATANTE: {{nome_contratante}}, inscrito(a) no CPF sob o n. {{cpf_contratante}}, e-mail {{email_contratante}}, doravante denominado(a) simplesmente \"CONTRATANTE\".",
      type: "dynamic",
      dynamicNote: "Nome do contratante, CPF e e-mail sao preenchidos pelo cliente no checkout.",
    },
    {
      number: 2,
      title: "DO OBJETO",
      content: "O presente contrato tem por objeto a prestacao dos seguintes servicos editoriais pela EDITORA ao CONTRATANTE:\n\n{{servicos_lista}}\n\nA obra objeto deste contrato e: \"{{titulo_obra}}\", de autoria de {{autor}}.\n\nEspecificacoes tecnicas: formato {{formato}}, com aproximadamente {{paginas}} paginas.\n\n{{descricao_orcamento}}",
      type: "dynamic",
      dynamicNote: "Servicos, titulo, autor, formato e paginas vem dos dados do projeto.",
    },
    {
      number: 3,
      title: "DAS OBRIGACOES DA EDITORA",
      content: "A EDITORA se obriga a:\na) Executar os servicos contratados com qualidade profissional e dentro dos padroes editoriais vigentes;\nb) Manter sigilo sobre o conteudo da obra e informacoes pessoais do CONTRATANTE;\nc) Fornecer ao CONTRATANTE prova digital da obra para revisao e aprovacao antes da finalizacao;\nd) Realizar os ajustes solicitados pelo CONTRATANTE dentro do escopo contratado, limitados a uma rodada de revisao incluida no preco;\ne) Entregar o material finalizado no prazo acordado, a contar da aprovacao do orcamento e recebimento integral dos arquivos necessarios.",
      type: "static",
    },
    {
      number: 4,
      title: "DAS OBRIGACOES DO CONTRATANTE",
      content: "O CONTRATANTE se obriga a:\na) Fornecer todos os materiais necessarios para a execucao dos servicos em formato digital adequado;\nb) Efetuar o pagamento conforme as condicoes estipuladas neste contrato;\nc) Responder as solicitacoes da EDITORA em ate 10 (dez) dias uteis;\nd) Revisar e aprovar ou solicitar ajustes na prova digital em ate 15 (quinze) dias uteis apos o envio;\ne) Garantir que possui todos os direitos autorais sobre o conteudo fornecido, isentando a EDITORA de qualquer responsabilidade sobre plagio ou violacao de direitos de terceiros.",
      type: "static",
    },
    {
      number: 5,
      title: "DO PRECO E CONDICOES DE PAGAMENTO",
      content: "O valor total dos servicos e de {{preco_total}}, conforme detalhado no orcamento apresentado.\n\n{{detalhes_pagamento}}\n\nO pagamento podera ser realizado por meio das seguintes modalidades:\na) Pix — transferencia instantanea via QR Code ou codigo;\nb) Cartao de credito — pagamento a vista ou parcelado em ate 12x;\nc) Boleto bancario — com vencimento em ate 3 dias uteis.\n\nO nao pagamento nos prazos estipulados podera resultar na suspensao dos servicos sem aviso previo.",
      type: "dynamic",
      dynamicNote: "Valor, percentual de entrada e modalidades sao calculados a partir do orcamento.",
    },
    {
      number: 6,
      title: "DO PRAZO",
      content: "{{prazo_conteudo}}",
      type: "dynamic",
      dynamicNote: "O prazo estimado e definido no orcamento de cada projeto. Se nao definido, exibe texto generico.",
    },
    {
      number: 7,
      title: "DA REVISAO E APROVACAO",
      content: "A EDITORA disponibilizara ao CONTRATANTE uma prova digital para revisao. O CONTRATANTE tera uma rodada de revisao incluida no escopo contratado. Ajustes adicionais alem do escopo original poderao ser cobrados separadamente. A aprovacao da prova pelo CONTRATANTE autoriza a EDITORA a finalizar o trabalho.",
      type: "static",
    },
    {
      number: 8,
      title: "DA PROPRIEDADE INTELECTUAL",
      content: "Os direitos autorais sobre o conteudo da obra permanecem integralmente com o CONTRATANTE. A EDITORA detem os direitos sobre o projeto grafico criado especificamente para a obra, concedendo ao CONTRATANTE licenca de uso irrevogavel e exclusiva. A EDITORA podera utilizar imagens do projeto grafico para fins de divulgacao do seu portfolio, salvo oposicao expressa do CONTRATANTE.",
      type: "static",
    },
    {
      number: 9,
      title: "DA RESCISAO",
      content: "a) Rescisao pelo CONTRATANTE antes do inicio: reembolso de 80% do valor pago;\nb) Rescisao pelo CONTRATANTE durante a execucao: cobranca proporcional aos servicos realizados;\nc) Rescisao pela EDITORA por forca maior: reembolso integral dos servicos nao realizados.",
      type: "static",
    },
    {
      number: 10,
      title: "DA PROTECAO DE DADOS PESSOAIS (LGPD)",
      content: "a) A EDITORA compromete-se a tratar os dados pessoais do CONTRATANTE em conformidade com a Lei Geral de Protecao de Dados Pessoais (Lei n. 13.709/2018);\nb) Os dados pessoais coletados (nome, CPF/CNPJ, e-mail, endereco IP, geolocalizacao e dados de navegacao) tem como base legal a execucao deste contrato (art. 7, V, LGPD) e o cumprimento de obrigacao legal (art. 7, II, LGPD);\nc) A finalidade do tratamento e exclusivamente a prestacao dos servicos editoriais contratados, emissao de documentos fiscais e comunicacao sobre o andamento do projeto;\nd) Os dados serao retidos pelo periodo de 5 (cinco) anos apos a conclusao do contrato, para fins de cumprimento de obrigacoes legais e fiscais, sendo eliminados apos este periodo;\ne) O CONTRATANTE podera, a qualquer momento, exercer seus direitos de titular previstos no art. 18 da LGPD, incluindo: acesso, correcao, eliminacao, portabilidade e revogacao do consentimento, mediante solicitacao por e-mail;\nf) A EDITORA adota medidas tecnicas e administrativas adequadas para proteger os dados pessoais contra acesso nao autorizado, destruicao, perda ou alteracao;\ng) A EDITORA nao compartilha dados pessoais com terceiros, exceto quando necessario para processamento de pagamentos (Mercado Pago), emissao de notas fiscais ou por determinacao legal;\nh) O Encarregado de Dados (DPO) da EDITORA pode ser contactado pelo e-mail informado na secao de contato do site.",
      type: "static",
    },
    {
      number: 11,
      title: "DO FORO E RESOLUCAO DE CONFLITOS",
      content: "a) As partes elegem o foro da Comarca de Maringa, Estado do Parana, para dirimir quaisquer controversias oriundas deste contrato, com exclusao de qualquer outro, por mais privilegiado que seja;\nb) As partes concordam em buscar primeiramente a resolucao amigavel de eventuais conflitos, por meio de negociacao direta, no prazo de 30 (trinta) dias a contar da notificacao da parte interessada;\nc) Persistindo o impasse, as partes poderao recorrer a mediacao ou arbitragem, nos termos da Lei n. 9.307/1996, antes de ingressar com acao judicial.",
      type: "static",
    },
    {
      number: 12,
      title: "DISPOSICOES GERAIS",
      content: "a) Este contrato entra em vigor na data do aceite eletronico e permanece vigente ate a conclusao dos servicos;\nb) O aceite eletronico tem validade juridica nos termos da MP n. 2.200-2/2001 e do Codigo Civil Brasileiro;\nc) O registro do aceite inclui data, hora, endereco IP, identificacao do navegador, hash SHA-256 do conteudo e, quando autorizado, geolocalizacao do signatario;\nd) Uma copia imutavel do contrato e armazenada no momento do aceite para fins de comprovacao de integridade;\ne) Alteracoes neste contrato somente serao validas mediante acordo escrito entre as partes;\nf) Os casos omissos serao resolvidos de acordo com a legislacao brasileira vigente, em especial o Codigo Civil e o Codigo de Defesa do Consumidor, quando aplicavel.",
      type: "static",
    },
  ],
};

// ============================================
// Component
// ============================================
export function AdminContracts() {
  const [template, setTemplate] = useState<ContractTemplate>(DEFAULT_TEMPLATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [expandedClauses, setExpandedClauses] = useState<Set<number>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  const [originalTemplate, setOriginalTemplate] = useState<ContractTemplate>(DEFAULT_TEMPLATE);
  const [showPreview, setShowPreview] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    document.title = "Contratos — Admin Epoca Editora";
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    setLoading(true);
    try {
      const data = await getContractTemplate();
      if (data.template) {
        // Merge with defaults to ensure all clauses exist
        const saved = data.template as ContractTemplate;
        const merged = {
          ...DEFAULT_TEMPLATE,
          ...saved,
          clauses: DEFAULT_TEMPLATE.clauses.map((dc) => {
            const sc = saved.clauses?.find((s: ClauseData) => s.number === dc.number);
            return sc ? { ...dc, ...sc, type: dc.type, dynamicNote: dc.dynamicNote } : dc;
          }),
        };
        setTemplate(merged);
        setOriginalTemplate(JSON.parse(JSON.stringify(merged)));
      } else {
        setTemplate(DEFAULT_TEMPLATE);
        setOriginalTemplate(JSON.parse(JSON.stringify(DEFAULT_TEMPLATE)));
      }
    } catch (err: any) {
      console.error("Error loading contract template:", err);
      // Use defaults on error
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await saveContractTemplate(template);
      setOriginalTemplate(JSON.parse(JSON.stringify(template)));
      setHasChanges(false);
      toast.success("Template do contrato salvo com sucesso!");
    } catch (err: any) {
      setError(err.message || "Erro ao salvar template");
      toast.error("Erro ao salvar template");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm("Tem certeza que deseja restaurar o template padrao? Todas as alteracoes serao perdidas.")) return;
    setTemplate(JSON.parse(JSON.stringify(DEFAULT_TEMPLATE)));
    setHasChanges(true);
  };

  const handleDiscard = () => {
    setTemplate(JSON.parse(JSON.stringify(originalTemplate)));
    setHasChanges(false);
  };

  const updateField = (field: string, value: string) => {
    setTemplate((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const updateClause = (number: number, field: "title" | "content", value: string) => {
    setTemplate((prev) => ({
      ...prev,
      clauses: prev.clauses.map((c) => (c.number === number ? { ...c, [field]: value } : c)),
    }));
    setHasChanges(true);
  };

  const toggleClause = (num: number) => {
    setExpandedClauses((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num); else next.add(num);
      return next;
    });
  };

  const expandAll = () => setExpandedClauses(new Set(template.clauses.map((c) => c.number)));
  const collapseAll = () => setExpandedClauses(new Set());

  const ic = "w-full px-3 py-2 rounded-lg border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 transition-colors";
  const is = { fontFamily: F, backgroundColor: "#FFFDF8", borderColor: "rgba(133,108,66,0.2)" };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#165B36] animate-spin" />
        <span className="ml-2 text-sm text-gray-500" style={{ fontFamily: F }}>Carregando template...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: F }}>Contratos</h1>
          <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: F }}>
            Visualize e edite o template do contrato de prestacao de servicos
          </p>
          {template.updatedAt && (
            <p className="text-[0.65rem] text-gray-400 mt-1 flex items-center gap-1" style={{ fontFamily: F }}>
              <Clock className="w-3 h-3" />
              Ultima atualizacao: {new Date(template.updatedAt).toLocaleString("pt-BR")}
              {template.updatedBy && <> por {template.updatedBy}</>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mode toggle */}
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "rgba(133,108,66,0.2)" }}>
            <button
              onClick={() => setMode("view")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${mode === "view" ? "bg-[#165B36] text-white" : "text-gray-500 hover:text-gray-700 bg-white"}`}
              style={{ fontFamily: F }}
            >
              <Eye className="w-3.5 h-3.5" /> Visualizar
            </button>
            <button
              onClick={() => { setMode("edit"); expandAll(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${mode === "edit" ? "bg-[#165B36] text-white" : "text-gray-500 hover:text-gray-700 bg-white"}`}
              style={{ fontFamily: F }}
            >
              <Edit3 className="w-3.5 h-3.5" /> Editar
            </button>
          </div>
          {mode === "edit" && (
            <>
              <button onClick={handleReset} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer" style={{ fontFamily: F }} title="Restaurar template padrao">
                <RotateCcw className="w-3.5 h-3.5" /> Padrao
              </button>
              {hasChanges && (
                <button onClick={handleDiscard} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer" style={{ fontFamily: F }}>
                  Descartar
                </button>
              )}
              <button onClick={handleSave} disabled={saving || !hasChanges} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed" style={{ fontFamily: F, background: "linear-gradient(135deg, #165B36, #052413)" }}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Salvar
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 p-3 rounded-lg bg-red-50">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span style={{ fontFamily: F }}>{error}</span>
        </div>
      )}

      {/* Preview button */}
      <button
        onClick={() => setShowPreview(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-[#052413] transition-colors hover:opacity-90 cursor-pointer"
        style={{ fontFamily: F, background: "linear-gradient(135deg, rgba(235,191,116,0.15), rgba(235,191,116,0.08))", border: "1px solid rgba(133,108,66,0.15)" }}
      >
        <FileText className="w-4 h-4 text-[#856C42]" />
        Pre-visualizar contrato completo (com dados de exemplo)
      </button>

      {/* Preview modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <div className="absolute inset-0 bg-black/60" />
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              style={{ backgroundColor: "#FFFDF8", boxShadow: "0 25px 50px rgba(5,36,19,0.25)" }}
            >
              <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: "rgba(133,108,66,0.1)" }}>
                <div>
                  <h3 className="text-lg text-[#052413]" style={{ fontFamily: PF }}>Pre-visualizacao do <span className="italic text-[#165B36]">contrato</span></h3>
                  <p className="text-[0.65rem] text-[#856C42]" style={{ fontFamily: F }}>Como o cliente vera na pagina de pagamento (com dados ficticios)</p>
                </div>
                <button onClick={() => setShowPreview(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <ContractPreview template={template} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: "rgba(22,91,54,0.04)", border: "1px solid rgba(22,91,54,0.1)" }}>
        <Info className="w-5 h-5 text-[#165B36] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-gray-600 space-y-1" style={{ fontFamily: F }}>
          <p><strong className="text-[#165B36]">Clausulas estaticas</strong> — texto fixo que voce pode editar livremente.</p>
          <p><strong className="text-[#856C42]">Clausulas dinamicas</strong> — contem campos automaticos (nome do cliente, preco, servicos, etc.) preenchidos por projeto.</p>
          <p>As clausulas 13+ sao personalizadas por projeto e editadas na aba Contrato de cada projeto.</p>
        </div>
      </div>

      {/* Meta fields */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(133,108,66,0.15)", backgroundColor: "#FFFDF8" }}>
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "rgba(133,108,66,0.1)", backgroundColor: "rgba(133,108,66,0.03)" }}>
          <ScrollText className="w-4 h-4 text-[#856C42]" />
          <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: F }}>Informacoes gerais</span>
        </div>
        <div className="p-5 space-y-4">
          {mode === "edit" ? (
            <>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5" style={{ fontFamily: F }}>Versao do contrato</label>
                  <input type="text" value={template.version} onChange={(e) => updateField("version", e.target.value)} className={ic} style={is} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5" style={{ fontFamily: F }}>Nome da editora</label>
                  <input type="text" value={template.companyName} onChange={(e) => updateField("companyName", e.target.value)} className={ic} style={is} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5" style={{ fontFamily: F }}>Descricao da editora <span className="text-gray-400 font-normal">(aparece na Clausula 1)</span></label>
                <input type="text" value={template.companyDescription} onChange={(e) => updateField("companyDescription", e.target.value)} className={ic} style={is} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5" style={{ fontFamily: F }}>Preambulo</label>
                <textarea value={template.preamble} onChange={(e) => updateField("preamble", e.target.value)} rows={3} className={ic + " resize-none"} style={is} />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm" style={{ fontFamily: F }}>
                <span className="text-gray-500">Versao:</span>
                <span className="font-medium text-gray-900">{template.version}</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">Editora:</span>
                <span className="font-medium text-gray-900">{template.companyName}</span>
              </div>
              <p className="text-xs text-gray-500" style={{ fontFamily: F }}>{template.companyDescription}</p>
              <p className="text-xs text-gray-600 italic leading-relaxed pt-2 border-t" style={{ fontFamily: F, borderColor: "rgba(133,108,66,0.08)" }}>
                "{template.preamble}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Expand/collapse controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700" style={{ fontFamily: F }}>
          Clausulas ({template.clauses.length})
        </h2>
        <div className="flex gap-2">
          <button onClick={expandAll} className="text-[0.65rem] text-[#165B36] hover:underline cursor-pointer" style={{ fontFamily: F }}>Expandir todas</button>
          <span className="text-gray-300">|</span>
          <button onClick={collapseAll} className="text-[0.65rem] text-[#165B36] hover:underline cursor-pointer" style={{ fontFamily: F }}>Recolher todas</button>
        </div>
      </div>

      {/* Clauses */}
      <div className="space-y-2">
        {template.clauses.map((clause) => {
          const isExpanded = expandedClauses.has(clause.number);
          const isDynamic = clause.type === "dynamic";
          return (
            <div key={clause.number} className="rounded-xl border overflow-hidden transition-shadow" style={{ borderColor: isDynamic ? "rgba(133,108,66,0.2)" : "rgba(133,108,66,0.12)", backgroundColor: "#FFFDF8" }}>
              {/* Header */}
              <button
                onClick={() => toggleClause(clause.number)}
                className="w-full flex items-center gap-3 px-5 py-3 text-left cursor-pointer hover:bg-gray-50/50 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: isDynamic ? "linear-gradient(135deg, #856C42, #EBBF74)" : "linear-gradient(135deg, #165B36, #052413)" }}>
                  {clause.number}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800 truncate" style={{ fontFamily: F }}>
                      {clause.title}
                    </span>
                    {isDynamic && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[0.55rem] font-medium bg-[#856C42]/10 text-[#856C42] flex-shrink-0">
                        <Zap className="w-2.5 h-2.5" /> Dinamica
                      </span>
                    )}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </button>

              {/* Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 border-t" style={{ borderColor: "rgba(133,108,66,0.08)" }}>
                      {isDynamic && clause.dynamicNote && (
                        <div className="flex items-start gap-2 mt-3 p-2.5 rounded-lg" style={{ backgroundColor: "rgba(133,108,66,0.05)" }}>
                          <Info className="w-3.5 h-3.5 text-[#856C42] flex-shrink-0 mt-0.5" />
                          <p className="text-[0.65rem] text-[#856C42] leading-relaxed" style={{ fontFamily: F }}>
                            {clause.dynamicNote}
                          </p>
                        </div>
                      )}

                      {mode === "edit" ? (
                        <div className="mt-3 space-y-2">
                          <div>
                            <label className="block text-[0.65rem] font-medium text-gray-500 mb-1" style={{ fontFamily: F }}>Titulo</label>
                            <input type="text" value={clause.title} onChange={(e) => updateClause(clause.number, "title", e.target.value)} className={ic + " text-xs"} style={{ ...is, fontSize: "0.8rem" }} />
                          </div>
                          <div>
                            <label className="block text-[0.65rem] font-medium text-gray-500 mb-1" style={{ fontFamily: F }}>
                              Conteudo {isDynamic && <span className="text-[#856C42]">(campos entre {"{{"}...{"}}"} sao automaticos)</span>}
                            </label>
                            <textarea
                              value={clause.content}
                              onChange={(e) => updateClause(clause.number, "content", e.target.value)}
                              rows={Math.max(4, clause.content.split("\n").length + 1)}
                              className={ic + " resize-y font-mono text-xs leading-relaxed"}
                              style={{ ...is, fontSize: "0.75rem" }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: F }}>
                            {renderPreviewContent(clause.content, isDynamic)}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Version history (auditable) */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(133,108,66,0.12)", backgroundColor: "#FFFDF8" }}>
        <button
          onClick={async () => {
            if (!historyOpen && history.length === 0) {
              setLoadingHistory(true);
              try {
                const data = await getContractTemplateHistory();
                setHistory(data.history || []);
              } catch { /* ignore */ }
              setLoadingHistory(false);
            }
            setHistoryOpen(!historyOpen);
          }}
          className="w-full flex items-center gap-3 px-5 py-3 text-left cursor-pointer hover:bg-gray-50/50 transition-colors"
        >
          <Clock className="w-4 h-4 text-[#856C42]" />
          <span className="text-sm font-semibold text-gray-700 flex-1" style={{ fontFamily: F }}>
            Historico de versoes (auditoria)
          </span>
          {historyOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        <AnimatePresence>
          {historyOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 border-t" style={{ borderColor: "rgba(133,108,66,0.08)" }}>
                {loadingHistory ? (
                  <div className="flex items-center gap-2 py-4 justify-center">
                    <Loader2 className="w-4 h-4 text-[#165B36] animate-spin" />
                    <span className="text-xs text-gray-500" style={{ fontFamily: F }}>Carregando historico...</span>
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center" style={{ fontFamily: F }}>
                    Nenhuma versao anterior registrada. O historico sera criado automaticamente a cada salvamento.
                  </p>
                ) : (
                  <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
                    {history.map((entry: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-lg border"
                        style={{ borderColor: "rgba(133,108,66,0.1)", backgroundColor: "rgba(133,108,66,0.02)" }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #856C42, #EBBF74)" }}>
                          v{entry.version || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate" style={{ fontFamily: F }}>
                            Versao {entry.version || "desconhecida"}
                          </p>
                          <p className="text-[0.6rem] text-gray-400" style={{ fontFamily: F }}>
                            Substituida em {entry.replacedAt ? new Date(entry.replacedAt).toLocaleString("pt-BR") : "?"} por {entry.replacedBy || "desconhecido"}
                          </p>
                        </div>
                        <span className="text-[0.55rem] text-gray-400 font-mono" style={{ fontFamily: F }}>
                          {entry.template?.clauses?.length || 0} clausulas
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom save bar */}
      {mode === "edit" && hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4 flex items-center justify-between p-4 rounded-xl shadow-lg"
          style={{ backgroundColor: "#052413", border: "1px solid rgba(235,191,116,0.2)" }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#EBBF74]" />
            <span className="text-xs text-white/80" style={{ fontFamily: F }}>Voce tem alteracoes nao salvas</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDiscard} className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" style={{ fontFamily: F }}>
              Descartar
            </button>
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-[#052413] transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer" style={{ fontFamily: F, background: "linear-gradient(135deg, #EBBF74, #D4AF5A)" }}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salvar template
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ============================================
// Preview renderer — highlights dynamic placeholders
// ============================================
function renderPreviewContent(content: string, isDynamic: boolean) {
  if (!isDynamic) return content;

  const PLACEHOLDER_LABELS: Record<string, string> = {
    "nome_editora": "Nome da editora",
    "descricao_editora": "Descricao da editora",
    "nome_contratante": "Nome do contratante",
    "cpf_contratante": "CPF",
    "email_contratante": "E-mail",
    "servicos_lista": "Lista de servicos",
    "titulo_obra": "Titulo da obra",
    "autor": "Autor",
    "formato": "Formato",
    "paginas": "Paginas",
    "descricao_orcamento": "Descricao do orcamento",
    "preco_total": "Valor total",
    "detalhes_pagamento": "Detalhes de pagamento",
    "prazo_conteudo": "Conteudo do prazo",
  };

  const parts = content.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, i) => {
    const match = part.match(/^\{\{([^}]+)\}\}$/);
    if (match) {
      const key = match[1];
      const label = PLACEHOLDER_LABELS[key] || key;
      return (
        <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded mx-0.5 text-[0.65rem] font-medium" style={{ backgroundColor: "rgba(133,108,66,0.1)", color: "#856C42" }}>
          <Zap className="w-2.5 h-2.5" />{label}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ============================================
// Contract Preview — renders the full contract with sample data
// ============================================
function ContractPreview({ template }: { template: ContractTemplate }) {
  const getClause = (num: number) => template.clauses.find((c) => c.number === num);

  const renderClauseContent = (content: string) => {
    const lines = content.split("\n").filter((l) => l.trim());
    return lines.map((line, i) => {
      const isSubItem = /^[a-z]\)/.test(line.trim());
      const isLast = i === lines.length - 1;
      return <p key={i} className={`${isSubItem ? "pl-3" : ""} ${isLast ? "mb-3" : "mb-1"}`}>{line}</p>;
    });
  };

  return (
    <div className="text-[0.7rem] leading-relaxed text-[#052413]/80" style={{ fontFamily: F }}>
      <p className="font-bold text-xs text-[#052413] mb-3 text-center">CONTRATO DE PRESTACAO DE SERVICOS EDITORIAIS</p>
      <p className="font-bold text-xs text-[#052413] mb-1 text-center">{template.companyName.toUpperCase()}</p>
      <p className="text-center mb-4 text-[#856C42]/60">Versao {template.version}</p>

      <p className="mb-3">{template.preamble}</p>

      {/* Clause 1 */}
      <p className="font-semibold text-[#052413] mb-1 mt-4">CLAUSULA 1 — {getClause(1)?.title || "DAS PARTES"}</p>
      <p className="mb-3"><strong>CONTRATADA:</strong> {template.companyName}, {template.companyDescription}, doravante denominada simplesmente "EDITORA".</p>
      <p className="mb-3">
        <strong>CONTRATANTE:</strong>{" "}
        <strong className="text-[#165B36] underline decoration-dotted">Maria Silva Santos</strong>
        , inscrito(a) no CPF sob o n. <strong className="text-[#165B36]">123.456.789-00</strong>
        , e-mail <strong className="text-[#165B36]">maria@exemplo.com</strong>
        , doravante denominado(a) simplesmente "CONTRATANTE".
      </p>

      {/* Clause 2 */}
      <p className="font-semibold text-[#052413] mb-1 mt-4">CLAUSULA 2 — {getClause(2)?.title || "DO OBJETO"}</p>
      <p className="mb-2">O presente contrato tem por objeto a prestacao dos seguintes servicos editoriais pela EDITORA ao CONTRATANTE:</p>
      <div className="mb-2 pl-3">
        <p className="mb-0.5">• <strong>Pacote completo</strong> — Todos os servicos inclusos</p>
      </div>
      <p className="mb-1">A obra objeto deste contrato e: <strong>"O Guardiao das Palavras"</strong>, de autoria de <strong>Maria Silva Santos</strong>.</p>
      <p className="mb-3">Especificacoes tecnicas: formato <strong>A5 (14x21 cm)</strong>, com aproximadamente <strong>200 paginas</strong>.</p>

      {/* Clauses 3-4 (static) */}
      {[3, 4].map((num) => {
        const cl = getClause(num);
        if (!cl) return null;
        return <div key={num}><p className="font-semibold text-[#052413] mb-1 mt-4">CLAUSULA {num} — {cl.title}</p>{renderClauseContent(cl.content)}</div>;
      })}

      {/* Clause 5 */}
      <p className="font-semibold text-[#052413] mb-1 mt-4">CLAUSULA 5 — {getClause(5)?.title || "DO PRECO E CONDICOES DE PAGAMENTO"}</p>
      <p className="mb-2">O valor total dos servicos e de <strong>R$ 2.500,00</strong>, conforme detalhado no orcamento apresentado.</p>
      <div className="mb-2 p-2 rounded-lg" style={{ backgroundColor: "rgba(22,91,54,0.04)", borderLeft: "3px solid rgba(22,91,54,0.2)" }}>
        <p className="mb-1"><strong>Forma de pagamento parcelada:</strong></p>
        <p className="mb-0.5 pl-3">a) <strong>Entrada (50%):</strong> R$ 1.250,00, a ser paga no ato da contratacao;</p>
        <p className="mb-0.5 pl-3">b) <strong>Saldo remanescente (50%):</strong> R$ 1.250,00, a ser pago na entrega do material finalizado.</p>
      </div>
      <p className="mb-1">O pagamento podera ser realizado por meio das seguintes modalidades:</p>
      <p className="mb-0.5 pl-3">a) <strong>Pix</strong> — transferencia instantanea via QR Code ou codigo;</p>
      <p className="mb-0.5 pl-3">b) <strong>Cartao de credito</strong> — pagamento a vista ou parcelado em ate 12x;</p>
      <p className="mb-2 pl-3">c) <strong>Boleto bancario</strong> — com vencimento em ate 3 dias uteis.</p>
      <p className="mb-3">O nao pagamento nos prazos estipulados podera resultar na suspensao dos servicos sem aviso previo.</p>

      {/* Clause 6 */}
      <p className="font-semibold text-[#052413] mb-1 mt-4">CLAUSULA 6 — {getClause(6)?.title || "DO PRAZO"}</p>
      <p className="mb-2">O prazo estimado para a execucao dos servicos e de <strong className="text-[#165B36]">15 dias uteis</strong>, contados a partir do recebimento integral dos arquivos necessarios e da confirmacao do pagamento.</p>
      <p className="mb-3">Atrasos no fornecimento de materiais ou na aprovacao de etapas pelo CONTRATANTE prorrogarao o prazo proporcionalmente. O prazo podera ser revisto pela EDITORA mediante comunicacao previa ao CONTRATANTE.</p>

      {/* Clauses 7-12 (static) */}
      {[7, 8, 9, 10, 11, 12].map((num) => {
        const cl = getClause(num);
        if (!cl) return null;
        return <div key={num}><p className="font-semibold text-[#052413] mb-1 mt-4">CLAUSULA {num} — {cl.title}</p>{renderClauseContent(cl.content)}</div>;
      })}

      {/* Sample custom clause */}
      <div className="mt-2 pt-2 border-t border-dashed" style={{ borderColor: "rgba(133,108,66,0.15)" }}>
        <p className="text-[0.6rem] text-[#856C42]/50 italic mb-2" style={{ fontFamily: F }}>Exemplo de clausula personalizada por projeto (13+):</p>
        <p className="font-semibold text-[#052413] mb-1 mt-2">CLAUSULA 13 — DA ENTREGA DIGITAL</p>
        <p className="mb-3">A EDITORA entregara os arquivos finais em formato PDF de alta resolucao para impressao e PDF otimizado para leitura digital.</p>
      </div>
    </div>
  );
}
import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Download, Loader2, Printer, AlertTriangle } from "lucide-react";
import { getPaymentInfo, getPublicContractTemplate, getContractPdfUrl, getLogo } from "../data/api";
import { toast, Toaster } from "sonner";
import logoImg from "/assets/logo.png";

const f = { play: "'Playfair Display', serif", inter: "Inter, sans-serif" };

function formatCurrency(v: number): string {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

export function ContractViewPage() {
  const { projectId } = useParams();
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contractTemplate, setContractTemplate] = useState<any>(null);
  const [logoBase64, setLogoBase64] = useState<string>("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const CONTRACT_VERSION = contractTemplate?.version || "1.0";
  const COMPANY_NAME = contractTemplate?.companyName || "Epoca Editora de Livros";
  const COMPANY_DESC = contractTemplate?.companyDescription || "pessoa juridica de direito privado, com sede em territorio brasileiro";
  const CONTRACT_PREAMBLE = contractTemplate?.preamble || "Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente Contrato de Prestacao de Servicos Editoriais, que se regera pelas seguintes clausulas e condicoes:";

  // Load logo for print (prefer dynamic logo from API, fallback to static asset)
  useEffect(() => {
    getLogo().then((logo) => {
      if (logo) {
        setLogoBase64(logo);
      } else {
        // Fallback: convert static asset to base64 via canvas
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              setLogoBase64(canvas.toDataURL("image/png"));
            }
          } catch { /* leave empty */ }
        };
        img.src = logoImg;
      }
    });
  }, []);

  // Fetch data
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      try {
        const [payInfo, tmpl] = await Promise.all([
          getPaymentInfo(projectId),
          getPublicContractTemplate().catch(() => null),
        ]);
        if (cancelled) return;
        if (!payInfo.contractAccepted) {
          setError("O contrato ainda nao foi aceito para este projeto.");
          setLoading(false);
          return;
        }
        setInfo(payInfo);
        if (tmpl?.template) setContractTemplate(tmpl.template);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Erro ao carregar dados do contrato.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  const getClauseContent = useCallback((num: number): { title: string; content: string } | null => {
    if (!contractTemplate?.clauses) return null;
    return contractTemplate.clauses.find((c: any) => c.number === num) || null;
  }, [contractTemplate]);

  const generateContractHTML = useCallback(() => {
    if (!info) return "";

    const getClauseText = (num: number, defaultTitle: string, defaultContent: string) => {
      const tmpl = getClauseContent(num);
      const title = tmpl?.title || defaultTitle;
      const content = tmpl?.content || defaultContent;
      const lines = content.split("\n").filter((l: string) => l.trim());
      return `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CLÁUSULA ${num} — ${title}</p>${lines.map((l: string) => `<p style="${/^[a-z]\)/.test(l.trim()) ? "padding-left:16px;" : ""}margin-bottom:4px">${l}</p>`).join("")}`;
    };

    const name = info.contractAcceptorName || info.userName || "_______________";
    const cpf = info.contractAcceptorCpf || "";
    const email = info.contractAcceptorEmail || "";

    const printLogo = logoBase64 || logoImg;
    let html = `<div style="text-align:center;margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #EBBF74">`;
    html += `<img src="${printLogo}" alt="${COMPANY_NAME}" style="height:48px;margin:0 auto 8px;display:block" />`;
    html += `<p style="font-weight:700;font-size:13px;margin-bottom:2px;font-family:'Playfair Display',Georgia,serif;color:#052413;letter-spacing:0.5px">CONTRATO DE PRESTA\u00C7\u00C3O DE SERVI\u00C7OS EDITORIAIS</p>`;
    html += `<p style="font-size:9px;color:#856C42;text-transform:uppercase;letter-spacing:2px;margin-top:4px">Vers\u00E3o ${CONTRACT_VERSION}</p>`;
    html += `</div>`;
    html += `<p style="margin-bottom:8px">${CONTRACT_PREAMBLE}</p>`;

    // Clause 1
    html += `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CLÁUSULA 1 — DAS PARTES</p>`;
    html += `<p style="margin-bottom:4px"><strong>EDITORA:</strong> ${COMPANY_NAME}, ${COMPANY_DESC}.</p>`;
    const cleanCpfDoc = cpf.replace(/\D/g, "");
    const docLabel = cleanCpfDoc.length === 14 ? "CNPJ" : "CPF";
    html += `<p style="margin-bottom:8px"><strong>CONTRATANTE:</strong> ${name}${cleanCpfDoc.length === 11 || cleanCpfDoc.length === 14 ? `, inscrito(a) no ${docLabel} sob o n. ${cpf}` : ""}${email.includes("@") ? `, e-mail ${email}` : ""}.</p>`;

    // Clause 2
    html += `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CLÁUSULA 2 — DO OBJETO</p>`;
    html += `<p style="margin-bottom:4px">O presente contrato tem por objeto a presta\u00E7\u00E3o dos seguintes servi\u00E7os editoriais pela EDITORA ao CONTRATANTE:</p>`;
    if (info.services?.length > 0) {
      const svcMap: Record<string, string> = { completo: "Servi\u00E7o editorial completo", diagramacao: "Diagrama\u00E7\u00E3o", capa: "Design de capa", revisao: "Revis\u00E3o textual", isbn: "Registro ISBN", impressao: "Impress\u00E3o" };
      info.services.forEach((s: string) => { html += `<p style="padding-left:16px;margin-bottom:2px">\u2022 ${svcMap[s] || s}</p>`; });
    }
    html += `<p style="margin-bottom:4px;margin-top:8px">A obra objeto deste contrato \u00E9: <strong>\u201C${info.title}\u201D</strong>, de autoria de <strong>${info.author}</strong>.</p>`;
    if (info.format || info.pageCount) {
      html += `<p style="margin-bottom:8px">Especifica\u00E7\u00F5es t\u00E9cnicas: ${info.format ? `formato ${info.format}` : ""}${info.format && info.pageCount ? ", " : ""}${info.pageCount ? `com aproximadamente ${info.pageCount} p\u00E1ginas` : ""}.</p>`;
    }
    if (info.budgetDescription) {
      html += `<p style="margin-bottom:8px;padding:8px;background:#f0f7f0;border-left:3px solid #cde"><strong>Descri\u00E7\u00E3o do or\u00E7amento:</strong> ${info.budgetDescription}</p>`;
    }

    html += getClauseText(3, "DAS OBRIGA\u00C7\u00D5ES DA EDITORA", "A EDITORA se obriga a:\na) Executar os servi\u00E7os contratados com qualidade profissional e dentro dos padr\u00F5es editoriais vigentes;\nb) Manter sigilo sobre o conte\u00FAdo da obra e informa\u00E7\u00F5es pessoais do CONTRATANTE;\nc) Fornecer ao CONTRATANTE prova digital da obra para revis\u00E3o e aprova\u00E7\u00E3o antes da finaliza\u00E7\u00E3o;\nd) Realizar os ajustes solicitados pelo CONTRATANTE dentro do escopo contratado, limitados a uma rodada de revis\u00E3o inclu\u00EDda no pre\u00E7o;\ne) Entregar o material finalizado no prazo acordado, a contar da aprova\u00E7\u00E3o do or\u00E7amento e recebimento integral dos arquivos necess\u00E1rios.");
    html += getClauseText(4, "DAS OBRIGA\u00C7\u00D5ES DO CONTRATANTE", "O CONTRATANTE se obriga a:\na) Fornecer todos os materiais necess\u00E1rios para a execu\u00E7\u00E3o dos servi\u00E7os em formato digital adequado;\nb) Efetuar o pagamento conforme as condi\u00E7\u00F5es estipuladas neste contrato;\nc) Responder \u00E0s solicita\u00E7\u00F5es da EDITORA em at\u00E9 10 (dez) dias \u00FAteis;\nd) Revisar e aprovar ou solicitar ajustes na prova digital em at\u00E9 15 (quinze) dias \u00FAteis ap\u00F3s o envio;\ne) Garantir que possui todos os direitos autorais sobre o conte\u00FAdo fornecido, isentando a EDITORA de qualquer responsabilidade sobre pl\u00E1gio ou viola\u00E7\u00E3o de direitos de terceiros.");

    // Clause 5
    html += `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CL\u00C1USULA 5 \u2014 DO PRE\u00C7O E CONDI\u00C7\u00D5ES DE PAGAMENTO</p>`;
    html += `<p style="margin-bottom:4px">O valor total dos servi\u00E7os \u00E9 de <strong>${formatCurrency(info.price)}</strong>, conforme detalhado no or\u00E7amento apresentado.</p>`;
    if (info.depositPercent > 0 && info.depositPercent < 100) {
      html += `<p style="padding-left:16px;margin-bottom:2px">a) Entrada (${info.depositPercent}%): ${formatCurrency(info.chargeAmount)}, a ser paga no ato da contrata\u00E7\u00E3o;</p>`;
      html += `<p style="padding-left:16px;margin-bottom:8px">b) Saldo remanescente (${100 - info.depositPercent}%): ${formatCurrency(info.remainderAmount)}, a ser pago na entrega do material finalizado.</p>`;
    } else {
      html += `<p style="margin-bottom:8px">O pagamento integral no valor de <strong>${formatCurrency(info.price)}</strong> dever\u00E1 ser realizado no ato da contrata\u00E7\u00E3o.</p>`;
    }
    // Installment plan clause
    if (info.installmentPlan?.enabled && info.installmentPlan?.installments?.length > 0) {
      const ip = info.installmentPlan;
      html += `<p style="margin-top:8px;margin-bottom:4px;font-weight:600">Modalidade de pagamento parcelado via PIX:</p>`;
      html += `<p style="margin-bottom:4px">O CONTRATANTE opta pelo pagamento parcelado em <strong>${ip.totalInstallments} parcela(s)</strong> via PIX, conforme cronograma abaixo:</p>`;
      ip.installments.forEach((inst: any) => {
        const dueFormatted = new Date(inst.dueDate + "T12:00:00").toLocaleDateString("pt-BR");
        html += `<p style="padding-left:16px;margin-bottom:2px">${inst.number}\u00AA parcela: ${formatCurrency(inst.amount)} \u2014 vencimento em ${dueFormatted}${inst.status === "paid" ? " (pago)" : ""};</p>`;
      });
      html += `<p style="margin-top:4px;margin-bottom:8px">O CONTRATANTE compromete-se a efetuar o pagamento de cada parcela at\u00E9 a data de vencimento estipulada. O atraso no pagamento de qualquer parcela poder\u00E1 acarretar a suspens\u00E3o dos servi\u00E7os at\u00E9 a regulariza\u00E7\u00E3o.</p>`;
    }

    // Clause 6
    html += `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CL\u00C1USULA 6 \u2014 DO PRAZO</p>`;
    if (info.estimatedDeadline) {
      html += `<p style="margin-bottom:8px">O prazo estimado para a execu\u00E7\u00E3o dos servi\u00E7os \u00E9 de <strong>${info.estimatedDeadline}</strong>, contados a partir do recebimento integral dos arquivos necess\u00E1rios e da confirma\u00E7\u00E3o do pagamento.</p>`;
    } else {
      html += `<p style="margin-bottom:8px">O prazo estimado para a execucao dos servicos sera informado pela EDITORA apos a analise do material recebido.</p>`;
    }

    html += getClauseText(7, "DA REVISAO E APROVACAO", "A EDITORA disponibilizara ao CONTRATANTE uma prova digital para revisao. O CONTRATANTE tera uma rodada de revisao incluida no escopo contratado. Ajustes adicionais alem do escopo original poderao ser cobrados separadamente. A aprovacao da prova pelo CONTRATANTE autoriza a EDITORA a finalizar o trabalho.");
    html += getClauseText(8, "DA PROPRIEDADE INTELECTUAL", "Os direitos autorais sobre o conteudo da obra permanecem integralmente com o CONTRATANTE. A EDITORA detem os direitos sobre o projeto grafico criado especificamente para a obra, concedendo ao CONTRATANTE licenca de uso irrevogavel e exclusiva.");
    html += getClauseText(9, "DA RESCISAO", "a) Rescisao pelo CONTRATANTE antes do inicio: reembolso de 80% do valor pago;\nb) Rescisao pelo CONTRATANTE durante a execucao: cobranca proporcional aos servicos realizados;\nc) Rescisao pela EDITORA por forca maior: reembolso integral dos servicos nao realizados.");
    html += getClauseText(10, "DA PROTECAO DE DADOS PESSOAIS (LGPD)", "a) A EDITORA compromete-se a tratar os dados pessoais do CONTRATANTE em conformidade com a LGPD (Lei n. 13.709/2018);\nb) Os dados coletados tem como base legal a execucao deste contrato (art. 7, V) e obrigacao legal (art. 7, II);\nc) A finalidade e exclusivamente a prestacao dos servicos contratados, emissao de documentos fiscais e comunicacao;\nd) Os dados serao retidos por 5 anos apos a conclusao do contrato;\ne) O CONTRATANTE podera exercer seus direitos de titular (art. 18 da LGPD) mediante solicitacao por e-mail;\nf) A EDITORA nao compartilha dados com terceiros, exceto para pagamentos ou por determinacao legal.");
    html += getClauseText(11, "DO FORO E RESOLUCAO DE CONFLITOS", "a) As partes elegem o foro da Comarca de Maringa, Estado do Parana, com exclusao de qualquer outro;\nb) As partes buscarao resolucao amigavel no prazo de 30 dias antes de acao judicial;\nc) Persistindo o impasse, poderao recorrer a mediacao ou arbitragem (Lei n. 9.307/1996).");
    html += getClauseText(12, "DISPOSICOES GERAIS", "a) Este contrato entra em vigor na data do aceite eletronico e permanece vigente ate a conclusao dos servicos;\nb) O aceite eletronico tem validade juridica nos termos da MP n. 2.200-2/2001 e do Codigo Civil Brasileiro;\nc) O registro do aceite inclui data, hora, endereco IP, navegador, hash SHA-256 e, quando autorizado, geolocalizacao;\nd) Uma copia imutavel do contrato e armazenada no momento do aceite;\ne) Alteracoes somente serao validas mediante acordo escrito entre as partes;\nf) Casos omissos serao resolvidos pela legislacao brasileira vigente.");

    // Custom clauses
    if (info.customClauses) {
      try {
        const parsed = JSON.parse(info.customClauses);
        if (Array.isArray(parsed)) {
          parsed.forEach((clause: any, idx: number) => {
            html += `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CLÁUSULA ${13 + idx} — ${clause.title ? clause.title.toUpperCase() : `DISPOSICOES ESPECIFICAS ${idx + 1}`}</p>`;
            html += `<p style="margin-bottom:8px;white-space:pre-wrap">${clause.content}</p>`;
          });
        } else {
          html += `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CLÁUSULA 13 — DISPOSICOES ESPECIFICAS DESTE PROJETO</p>`;
          html += `<p style="margin-bottom:8px;white-space:pre-wrap">${info.customClauses}</p>`;
        }
      } catch {
        html += `<p style="font-weight:700;margin-top:16px;margin-bottom:4px;color:#052413">CLÁUSULA 13 — DISPOSICOES ESPECIFICAS DESTE PROJETO</p>`;
        html += `<p style="margin-bottom:8px;white-space:pre-wrap">${info.customClauses}</p>`;
      }
    }

    return html;
  }, [info, COMPANY_NAME, COMPANY_DESC, CONTRACT_VERSION, CONTRACT_PREAMBLE, getClauseContent, logoBase64]);

  const handlePrint = useCallback(() => {
    const html = generateContractHTML();
    if (!html) { toast.error("Dados do contrato indisponiveis."); return; }
    const w = window.open("", "_blank");
    if (!w) { toast.error("Popup bloqueado. Permita popups para imprimir."); return; }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Contrato — ${COMPANY_NAME}</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;font-size:11px;line-height:1.6;color:#333;padding:40px 60px;max-width:800px;margin:auto}p{margin-bottom:6px}.footer{margin-top:30px;padding-top:15px;border-top:2px solid #EBBF74;font-size:9px;color:#856C42;text-align:center}.stamp{margin-top:24px;padding:16px;border:2px solid #0a7c3e;border-radius:8px;background:rgba(10,124,62,0.04)}@media print{body{padding:20px 40px}}</style></head><body>`);
    w.document.write(html);

    // Acceptance stamp
    if (info?.contractAccepted) {
      let stamp = `<div class="stamp">`;
      stamp += `<p style="font-weight:700;color:#0a7c3e;font-size:12px;margin-bottom:8px">ACEITE ELETRONICO REGISTRADO</p>`;
      stamp += `<p><strong>Nome:</strong> ${info.contractAcceptorName || "—"}</p>`;
      stamp += `<p><strong>E-mail:</strong> ${info.contractAcceptorEmail || "—"}</p>`;
      if (info.contractAcceptorCpf) {
        const cleanDoc = info.contractAcceptorCpf.replace(/\D/g, "");
        stamp += `<p><strong>${cleanDoc.length === 14 ? "CNPJ" : "CPF"}:</strong> ${info.contractAcceptorCpf}</p>`;
      }
      stamp += `<p><strong>Data/hora:</strong> ${info.contractAcceptedAt ? new Date(info.contractAcceptedAt).toLocaleString("pt-BR") : "—"}</p>`;
      if (info.contractHash) {
        stamp += `<p style="font-family:monospace;font-size:9px;margin-top:6px"><strong>SHA-256:</strong> ${info.contractHash}</p>`;
      }
      stamp += `</div>`;
      w.document.write(stamp);
    }

    let footerHtml = `Contrato aceito eletronicamente em ${info?.contractAcceptedAt ? new Date(info.contractAcceptedAt).toLocaleString("pt-BR") : "data registrada"}. Documento gerado para arquivo.`;
    if (info?.contractHash) {
      footerHtml += `<br/>Integridade SHA-256: ${info.contractHash}`;
    }
    w.document.write(`<div class="footer">${footerHtml}</div>`);
    w.document.write(`</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  }, [generateContractHTML, COMPANY_NAME, info]);

  const handleDownloadPdf = async () => {
    if (!projectId) return;
    setDownloadingPdf(true);
    try {
      const data = await getContractPdfUrl(projectId);
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        toast.error("Contrato PDF indisponivel");
      }
    } catch {
      toast.error("Erro ao obter contrato PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ─── Loading ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FFFDF8" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#856C42]" />
          <p className="text-sm text-[#856C42]" style={{ fontFamily: f.inter }}>Carregando contrato...</p>
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (error || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FFFDF8" }}>
        <div className="max-w-md text-center px-6">
          <AlertTriangle className="w-12 h-12 text-[#EBBF74] mx-auto mb-4" />
          <h2 className="text-lg text-[#052413] mb-2" style={{ fontFamily: f.play }}>{error || "Contrato nao encontrado"}</h2>
          <Link to="/" className="text-sm text-[#165B36] hover:underline" style={{ fontFamily: f.inter }}>
            <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />Voltar
          </Link>
        </div>
      </div>
    );
  }

  // ─── Contract view ───
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFDF8" }}>
      <Toaster position="top-center" richColors />

      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b print:hidden" style={{ backgroundColor: "rgba(255,253,248,0.95)", backdropFilter: "blur(8px)", borderColor: "rgba(133,108,66,0.1)" }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-sm text-[#856C42] hover:text-[#052413] transition-colors cursor-pointer" style={{ fontFamily: f.inter }}>
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="flex items-center gap-2">
            {info.hasContractPdf && (
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#856C42] bg-[#856C42]/5 hover:bg-[#856C42]/10 transition-colors cursor-pointer disabled:opacity-50"
                style={{ fontFamily: f.inter }}
              >
                {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Baixar PDF
              </button>
            )}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
              style={{ fontFamily: f.inter, background: "linear-gradient(135deg, #165B36, #052413)" }}
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* Contract body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 pb-5 border-b-2" style={{ borderColor: "#EBBF74" }}>
          <img src={logoImg} alt={COMPANY_NAME} className="h-12 mx-auto mb-3" />
          <h1 className="text-base font-bold tracking-wide text-[#052413]" style={{ fontFamily: f.play }}>
            CONTRATO DE PRESTACAO DE SERVICOS EDITORIAIS
          </h1>
          <p className="text-[0.6rem] text-[#856C42] uppercase tracking-[3px] mt-1" style={{ fontFamily: f.inter }}>
            Versao {CONTRACT_VERSION}
          </p>
        </div>

        {/* Preamble */}
        <p className="text-sm text-[#333] leading-relaxed mb-6" style={{ fontFamily: f.inter }}>{CONTRACT_PREAMBLE}</p>

        {/* Clauses rendered inline */}
        <ContractClause num={1} title="DAS PARTES">
          <p><strong>EDITORA:</strong> {COMPANY_NAME}, {COMPANY_DESC}.</p>
          <p>
            <strong>CONTRATANTE:</strong> {info.contractAcceptorName || info.userName || "—"}
            {(() => {
              const cpf = info.contractAcceptorCpf || "";
              const clean = cpf.replace(/\D/g, "");
              if (clean.length === 11 || clean.length === 14) return `, inscrito(a) no ${clean.length === 14 ? "CNPJ" : "CPF"} sob o n. ${cpf}`;
              return "";
            })()}
            {(info.contractAcceptorEmail || "").includes("@") ? `, e-mail ${info.contractAcceptorEmail}` : ""}.
          </p>
        </ContractClause>

        <ContractClause num={2} title="DO OBJETO">
          <p>O presente contrato tem por objeto a prestacao dos seguintes servicos editoriais pela EDITORA ao CONTRATANTE:</p>
          {info.services?.length > 0 && (
            <ul className="pl-4 space-y-0.5 my-1">
              {info.services.map((s: string) => {
                const svcMap: Record<string, string> = { completo: "Servico editorial completo", diagramacao: "Diagramacao", capa: "Design de capa", revisao: "Revisao textual", isbn: "Registro ISBN", impressao: "Impressao" };
                return <li key={s}>• {svcMap[s] || s}</li>;
              })}
            </ul>
          )}
          <p>A obra objeto deste contrato e: <strong>"{info.title}"</strong>, de autoria de <strong>{info.author}</strong>.</p>
          {(info.format || info.pageCount) && (
            <p>Especificacoes tecnicas: {info.format ? `formato ${info.format}` : ""}{info.format && info.pageCount ? ", " : ""}{info.pageCount ? `com aproximadamente ${info.pageCount} paginas` : ""}.</p>
          )}
          {info.budgetDescription && (
            <p className="p-2 mt-1 rounded bg-[#f0f7f0] border-l-3 border-[#165B36]/20">
              <strong>Descricao do orcamento:</strong> {info.budgetDescription}
            </p>
          )}
        </ContractClause>

        <TemplateClause num={3} title="DAS OBRIGACOES DA EDITORA" getClause={getClauseContent} fallback="A EDITORA se obriga a:
a) Executar os servicos contratados com qualidade profissional e dentro dos padroes editoriais vigentes;
b) Manter sigilo sobre o conteudo da obra e informacoes pessoais do CONTRATANTE;
c) Fornecer ao CONTRATANTE prova digital da obra para revisao e aprovacao antes da finalizacao;
d) Realizar os ajustes solicitados pelo CONTRATANTE dentro do escopo contratado, limitados a uma rodada de revisao incluida no preco;
e) Entregar o material finalizado no prazo acordado, a contar da aprovacao do orcamento e recebimento integral dos arquivos necessarios." />

        <TemplateClause num={4} title="DAS OBRIGACOES DO CONTRATANTE" getClause={getClauseContent} fallback="O CONTRATANTE se obriga a:
a) Fornecer todos os materiais necessarios para a execucao dos servicos em formato digital adequado;
b) Efetuar o pagamento conforme as condicoes estipuladas neste contrato;
c) Responder as solicitacoes da EDITORA em ate 10 (dez) dias uteis;
d) Revisar e aprovar ou solicitar ajustes na prova digital em ate 15 (quinze) dias uteis apos o envio;
e) Garantir que possui todos os direitos autorais sobre o conteudo fornecido, isentando a EDITORA de qualquer responsabilidade sobre plagio ou violacao de direitos de terceiros." />

        <ContractClause num={5} title="DO PRECO E CONDICOES DE PAGAMENTO">
          <p>O valor total dos servicos e de <strong>{formatCurrency(info.price)}</strong>, conforme detalhado no orcamento apresentado.</p>
          {info.depositPercent > 0 && info.depositPercent < 100 ? (
            <>
              <p className="pl-4">a) Entrada ({info.depositPercent}%): {formatCurrency(info.chargeAmount)}, a ser paga no ato da contratacao;</p>
              <p className="pl-4">b) Saldo remanescente ({100 - info.depositPercent}%): {formatCurrency(info.remainderAmount)}, a ser pago na entrega do material finalizado.</p>
            </>
          ) : (
            <p>O pagamento integral no valor de <strong>{formatCurrency(info.price)}</strong> devera ser realizado no ato da contratacao.</p>
          )}
          {/* Installment plan clause */}
          {info.installmentPlan?.enabled && info.installmentPlan?.installments?.length > 0 && (
            <div className="mt-2 p-2 rounded-lg" style={{ backgroundColor: "rgba(235,191,116,0.06)", borderLeft: "3px solid rgba(235,191,116,0.4)" }}>
              <p className="font-semibold mb-1">Modalidade de pagamento parcelado via PIX:</p>
              <p className="mb-1">O CONTRATANTE opta pelo pagamento parcelado em <strong>{info.installmentPlan.totalInstallments} parcela(s)</strong> via PIX, conforme cronograma abaixo:</p>
              {info.installmentPlan.installments.map((inst: any) => {
                const dueFormatted = new Date(inst.dueDate + "T12:00:00").toLocaleDateString("pt-BR");
                return <p key={inst.number} className="pl-4 mb-0.5">{inst.number}ª parcela: <strong>{formatCurrency(inst.amount)}</strong> — vencimento em {dueFormatted}{inst.status === "paid" ? " (pago)" : ""};</p>;
              })}
              <p className="mt-1">O CONTRATANTE compromete-se a efetuar o pagamento de cada parcela até a data de vencimento estipulada. O atraso no pagamento de qualquer parcela poderá acarretar a suspensão dos serviços até a regularização.</p>
            </div>
          )}
        </ContractClause>

        <ContractClause num={6} title="DO PRAZO">
          {info.estimatedDeadline ? (
            <p>O prazo estimado para a execucao dos servicos e de <strong>{info.estimatedDeadline}</strong>, contados a partir do recebimento integral dos arquivos necessarios e da confirmacao do pagamento.</p>
          ) : (
            <p>O prazo estimado para a execucao dos servicos sera informado pela EDITORA apos a analise do material recebido.</p>
          )}
        </ContractClause>

        <TemplateClause num={7} title="DA REVISAO E APROVACAO" getClause={getClauseContent} fallback="A EDITORA disponibilizara ao CONTRATANTE uma prova digital para revisao. O CONTRATANTE tera uma rodada de revisao incluida no escopo contratado. Ajustes adicionais alem do escopo original poderao ser cobrados separadamente. A aprovacao da prova pelo CONTRATANTE autoriza a EDITORA a finalizar o trabalho." />
        <TemplateClause num={8} title="DA PROPRIEDADE INTELECTUAL" getClause={getClauseContent} fallback="Os direitos autorais sobre o conteudo da obra permanecem integralmente com o CONTRATANTE. A EDITORA detem os direitos sobre o projeto grafico criado especificamente para a obra, concedendo ao CONTRATANTE licenca de uso irrevogavel e exclusiva." />
        <TemplateClause num={9} title="DA RESCISAO" getClause={getClauseContent} fallback="a) Rescisao pelo CONTRATANTE antes do inicio: reembolso de 80% do valor pago;
b) Rescisao pelo CONTRATANTE durante a execucao: cobranca proporcional aos servicos realizados;
c) Rescisao pela EDITORA por forca maior: reembolso integral dos servicos nao realizados." />
        <TemplateClause num={10} title="DA PROTECAO DE DADOS PESSOAIS (LGPD)" getClause={getClauseContent} fallback="a) A EDITORA compromete-se a tratar os dados pessoais do CONTRATANTE em conformidade com a LGPD (Lei n. 13.709/2018);
b) Os dados coletados tem como base legal a execucao deste contrato (art. 7, V) e obrigacao legal (art. 7, II);
c) A finalidade e exclusivamente a prestacao dos servicos contratados, emissao de documentos fiscais e comunicacao;
d) Os dados serao retidos por 5 anos apos a conclusao do contrato;
e) O CONTRATANTE podera exercer seus direitos de titular (art. 18 da LGPD) mediante solicitacao por e-mail;
f) A EDITORA nao compartilha dados com terceiros, exceto para pagamentos ou por determinacao legal." />
        <TemplateClause num={11} title="DO FORO E RESOLUCAO DE CONFLITOS" getClause={getClauseContent} fallback="a) As partes elegem o foro da Comarca de Maringa, Estado do Parana, com exclusao de qualquer outro;
b) As partes buscarao resolucao amigavel no prazo de 30 dias antes de acao judicial;
c) Persistindo o impasse, poderao recorrer a mediacao ou arbitragem (Lei n. 9.307/1996)." />
        <TemplateClause num={12} title="DISPOSICOES GERAIS" getClause={getClauseContent} fallback="a) Este contrato entra em vigor na data do aceite eletronico e permanece vigente ate a conclusao dos servicos;
b) O aceite eletronico tem validade juridica nos termos da MP n. 2.200-2/2001 e do Codigo Civil Brasileiro;
c) O registro do aceite inclui data, hora, endereco IP, navegador, hash SHA-256 e, quando autorizado, geolocalizacao;
d) Uma copia imutavel do contrato e armazenada no momento do aceite;
e) Alteracoes somente serao validas mediante acordo escrito entre as partes;
f) Casos omissos serao resolvidos pela legislacao brasileira vigente." />

        {/* Custom clauses */}
        {info.customClauses && (() => {
          try {
            const parsed = JSON.parse(info.customClauses);
            if (Array.isArray(parsed)) {
              return parsed.map((clause: any, idx: number) => (
                <ContractClause key={idx} num={13 + idx} title={clause.title ? clause.title.toUpperCase() : `DISPOSICOES ESPECIFICAS ${idx + 1}`}>
                  <p className="whitespace-pre-wrap">{clause.content}</p>
                </ContractClause>
              ));
            }
            return (
              <ContractClause num={13} title="DISPOSICOES ESPECIFICAS DESTE PROJETO">
                <p className="whitespace-pre-wrap">{info.customClauses}</p>
              </ContractClause>
            );
          } catch {
            return (
              <ContractClause num={13} title="DISPOSICOES ESPECIFICAS DESTE PROJETO">
                <p className="whitespace-pre-wrap">{info.customClauses}</p>
              </ContractClause>
            );
          }
        })()}

        {/* Acceptance stamp */}
        <div className="mt-10 p-5 rounded-xl border-2" style={{ borderColor: "#0a7c3e", backgroundColor: "rgba(10,124,62,0.03)" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#0a7c3e]" />
            <h3 className="text-sm font-bold text-[#0a7c3e]" style={{ fontFamily: f.play }}>Aceite Eletronico Registrado</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm" style={{ fontFamily: f.inter }}>
            <div>
              <span className="text-[0.6rem] text-[#856C42]/60 uppercase tracking-wider">Nome</span>
              <p className="text-[#052413] font-medium">{info.contractAcceptorName || "—"}</p>
            </div>
            <div>
              <span className="text-[0.6rem] text-[#856C42]/60 uppercase tracking-wider">E-mail</span>
              <p className="text-[#052413]">{info.contractAcceptorEmail || "—"}</p>
            </div>
            {info.contractAcceptorCpf && (
              <div>
                <span className="text-[0.6rem] text-[#856C42]/60 uppercase tracking-wider">
                  {info.contractAcceptorCpf.replace(/\D/g, "").length === 14 ? "CNPJ" : "CPF"}
                </span>
                <p className="text-[#052413] font-mono">{info.contractAcceptorCpf}</p>
              </div>
            )}
            <div>
              <span className="text-[0.6rem] text-[#856C42]/60 uppercase tracking-wider">Data/hora do aceite</span>
              <p className="text-[#052413]">{info.contractAcceptedAt ? new Date(info.contractAcceptedAt).toLocaleString("pt-BR") : "—"}</p>
            </div>
          </div>
          {info.contractHash && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(10,124,62,0.15)" }}>
              <span className="text-[0.5rem] text-[#856C42]/50 uppercase tracking-wider" style={{ fontFamily: f.inter }}>Integridade SHA-256</span>
              <p className="text-[0.6rem] text-[#052413] font-mono break-all mt-0.5">{info.contractHash}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t-2 text-center" style={{ borderColor: "#EBBF74" }}>
          <p className="text-[0.6rem] text-[#856C42]" style={{ fontFamily: f.inter }}>
            Contrato aceito eletronicamente em {info.contractAcceptedAt ? new Date(info.contractAcceptedAt).toLocaleString("pt-BR") : "data registrada"}.
            Documento juridicamente vinculante nos termos da MP n. 2.200-2/2001.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Helper components ───

function ContractClause({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-bold text-[#052413] mt-5 mb-1.5" style={{ fontFamily: "'Playfair Display', serif" }}>
        CLÁUSULA {num} — {title}
      </h3>
      <div className="text-sm text-[#333] leading-relaxed space-y-1" style={{ fontFamily: "Inter, sans-serif" }}>
        {children}
      </div>
    </div>
  );
}

function TemplateClause({
  num,
  title,
  getClause,
  fallback,
}: {
  num: number;
  title: string;
  getClause: (num: number) => { title: string; content: string } | null;
  fallback: string;
}) {
  const tmpl = getClause(num);
  const clauseTitle = tmpl?.title || title;
  const content = tmpl?.content || fallback;
  const lines = content.split("\n").filter((l) => l.trim());

  return (
    <ContractClause num={num} title={clauseTitle}>
      {lines.map((line, i) => (
        <p key={i} className={/^[a-z]\)/.test(line.trim()) ? "pl-4" : ""}>
          {line}
        </p>
      ))}
    </ContractClause>
  );
}
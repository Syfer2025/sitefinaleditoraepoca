import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FileText, Download, ExternalLink, X, ZoomIn, ZoomOut, RotateCw, Loader2 } from "lucide-react";

function getFileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "";
}

export function isViewableFile(name: string): boolean {
  const ext = getFileExtension(name);
  return ["pdf", "jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext);
}

function isPdfFile(name: string): boolean {
  return getFileExtension(name) === "pdf";
}

function isImageFile(name: string): boolean {
  const ext = getFileExtension(name);
  return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext);
}

function isOfficeFile(name: string): boolean {
  const ext = getFileExtension(name);
  return ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext);
}

function getOfficeViewerUrl(fileUrl: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
}

function getFileTypeLabel(name: string): string {
  const ext = getFileExtension(name);
  if (ext === "pdf") return "Documento PDF";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) return "Imagem";
  if (["doc", "docx"].includes(ext)) return "Documento Word";
  if (["xls", "xlsx"].includes(ext)) return "Planilha Excel";
  if (["ppt", "pptx"].includes(ext)) return "Apresentacao PowerPoint";
  return "Arquivo";
}

const isMobile = () => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export function FileViewer({ file, onClose }: { file: { name: string; url: string }; onClose: () => void }) {
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);
  const pdf = isPdfFile(file.name);
  const image = isImageFile(file.name);
  const office = isOfficeFile(file.name);
  const mobile = isMobile();

  useEffect(() => {
    if (!pdf && !image && !office) {
      setLoading(false);
      return;
    }
    // On mobile, PDFs open externally — no iframe to wait for
    if (pdf && mobile) {
      setLoading(false);
      return;
    }
    const timeout = setTimeout(() => setLoading(false), office ? 10000 : 6000);
    return () => clearTimeout(timeout);
  }, [pdf, image, office, mobile]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 25, 300));
      if (e.key === "-") setZoom((z) => Math.max(z - 25, 25));
      if (e.key === "0") setZoom(100);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ backgroundColor: "rgba(5,36,19,0.95)" }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`Visualizador: ${file.name}`}
    >
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b flex-shrink-0 gap-2"
        style={{ backgroundColor: "rgba(5,36,19,0.98)", borderColor: "rgba(235,191,116,0.15)" }}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <FileText className="w-4 h-4 text-[#EBBF74] flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-white truncate">{file.name}</p>
            <p className="text-[0.55rem] text-white/40 hidden sm:block">
              {getFileTypeLabel(file.name)} — {image ? "Use +/- para zoom, " : ""}Esc para fechar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {image && (
            <>
              <button onClick={() => setZoom((z) => Math.max(z - 25, 25))} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" aria-label="Diminuir zoom"><ZoomOut className="w-4 h-4" /></button>
              <span className="text-xs text-white/50 min-w-[2.5rem] text-center hidden sm:inline">{zoom}%</span>
              <button onClick={() => setZoom((z) => Math.min(z + 25, 300))} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" aria-label="Aumentar zoom"><ZoomIn className="w-4 h-4" /></button>
              <button onClick={() => setZoom(100)} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer hidden sm:flex" aria-label="Redefinir zoom"><RotateCw className="w-4 h-4" /></button>
              <div className="w-px h-5 bg-white/10 mx-0.5" />
            </>
          )}
          <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors" aria-label="Baixar"><Download className="w-4 h-4" /></a>
          <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors hidden sm:flex" aria-label="Nova aba"><ExternalLink className="w-4 h-4" /></a>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-0.5" aria-label="Fechar"><X className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto relative flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#EBBF74]" />
              <p className="text-sm text-white/50">Carregando...</p>
            </div>
          </div>
        )}
        {pdf && !mobile && (
          <iframe
            src={`${file.url}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border-0"
            style={{ opacity: loading ? 0 : 1, transition: "opacity 0.3s" }}
            onLoad={() => setLoading(false)}
            title={file.name}
          />
        )}
        {pdf && mobile && (
          <div className="flex flex-col items-center gap-5 p-8 text-center">
            <FileText className="w-16 h-16 text-[#EBBF74]/60" />
            <p className="text-sm text-white/70">
              Visualize ou baixe o PDF no seu dispositivo.
            </p>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-[#052413] transition-all hover:shadow-md"
              style={{ background: "linear-gradient(135deg, #EBBF74, #d4a84a)" }}
            >
              <ExternalLink className="w-4 h-4" />
              Abrir PDF
            </a>
            <a
              href={file.url}
              download
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm text-white/60 border border-white/15 hover:text-white hover:border-white/30 transition-colors"
            >
              <Download className="w-4 h-4" />
              Baixar
            </a>
          </div>
        )}
        {image && (
          <div className="w-full h-full overflow-auto flex items-center justify-center p-8" style={{ opacity: loading ? 0 : 1, transition: "opacity 0.3s" }}>
            <img
              src={file.url}
              alt={file.name}
              className="max-w-none rounded-lg shadow-2xl transition-transform duration-200"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center" }}
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          </div>
        )}
        {office && (
          <iframe
            src={getOfficeViewerUrl(file.url)}
            className="w-full h-full border-0"
            style={{ opacity: loading ? 0 : 1, transition: "opacity 0.3s", backgroundColor: "#fff" }}
            onLoad={() => setLoading(false)}
            title={file.name}
          />
        )}
        {!pdf && !image && !office && (
          <div className="flex flex-col items-center gap-4 p-8">
            <FileText className="w-16 h-16 text-white/20" />
            <p className="text-sm text-white/50 text-center">
              Este tipo de arquivo nao pode ser visualizado no navegador.
            </p>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-[#052413] transition-all hover:shadow-md"
              style={{ background: "linear-gradient(135deg, #EBBF74, #d4a84a)" }}
            >
              <Download className="w-4 h-4" />
              Baixar arquivo
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}

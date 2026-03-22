import { useState, useEffect, useRef } from "react";
import { Upload, Loader2, Save, ImageIcon, Check } from "lucide-react";
import { getLogos, updateAdminLogoKey, uploadFile } from "../../data/api";
import { toast } from "sonner";


type LogoKey = "navbar" | "footer" | "favicon";

interface LogoState {
  current: string | null;
  preview: string | null;
  uploading: boolean;
  saving: boolean;
  dragging: boolean;
}

const LOGO_CONFIGS: { key: LogoKey; label: string; description: string; bg: string; hint: string }[] = [
  {
    key: "navbar",
    label: "Logo — Menu Superior",
    description: "Exibida na barra de navegação no topo do site.",
    bg: "#052413",
    hint: "PNG com fundo transparente. Recomendado: 400×120px.",
  },
  {
    key: "footer",
    label: "Logo — Rodapé",
    description: "Exibida no rodapé do site.",
    bg: "#052413",
    hint: "Pode ser a mesma da navbar ou uma variação mais clara/escura.",
  },
  {
    key: "favicon",
    label: "Logo — Ícone da aba (favicon)",
    description: "Exibida como ícone na aba do navegador.",
    bg: "#ffffff",
    hint: "Use uma imagem quadrada (ex: apenas o símbolo). Recomendado: 256×256px.",
  },
];

function LogoPanel({
  config,
  state,
  onChange,
}: {
  config: typeof LOGO_CONFIGS[number];
  state: LogoState;
  onChange: (patch: Partial<LogoState>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter menos de 5MB.");
      return;
    }
    onChange({ uploading: true });
    try {
      const url = await uploadFile(file, "logos");
      onChange({ preview: url, uploading: false });
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar imagem");
      onChange({ uploading: false });
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSave() {
    if (!state.preview) return;
    onChange({ saving: true });
    try {
      await updateAdminLogoKey(config.key, state.preview);
      onChange({ current: state.preview, preview: null, saving: false });
      toast.success(`Logo "${config.label}" salva!`);
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar logo");
      onChange({ saving: false });
    }
  }

  const displayImg = state.preview || state.current;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{config.label}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{config.description}</p>
      </div>

      {/* Preview */}
      {displayImg && (
        <div className="flex items-center gap-3">
          <div
            className="h-12 rounded-lg px-4 flex items-center"
            style={{ backgroundColor: config.bg, border: config.bg === "#ffffff" ? "1px solid #e5e7eb" : "none" }}
          >
            <img src={displayImg} alt={config.label} className="h-7 object-contain" />
          </div>
          {state.preview && (
            <span className="text-xs text-[#165B36] font-medium">
              Prévia — ainda não salva
            </span>
          )}
        </div>
      )}

      {/* Upload zone */}
      <div
        className={`rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
          state.dragging ? "border-[#165B36] bg-[#165B36]/5" : "border-gray-200 hover:border-[#165B36]/40 hover:bg-gray-50"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); onChange({ dragging: true }); }}
        onDragLeave={() => onChange({ dragging: false })}
        onDrop={(e) => { e.preventDefault(); onChange({ dragging: false }); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <div className="p-6 flex flex-col items-center gap-2 text-center">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            {state.uploading ? (
              <Loader2 className="w-4 h-4 text-[#165B36] animate-spin" />
            ) : state.dragging ? (
              <ImageIcon className="w-4 h-4 text-[#165B36]" />
            ) : (
              <Upload className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <p className="text-sm font-medium text-gray-600">
            {state.uploading ? "Enviando para Supabase..." : state.dragging ? "Solte aqui" : displayImg ? "Trocar imagem" : "Clique ou arraste"}
          </p>
          <p className="text-xs text-gray-400">{config.hint}</p>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!state.preview || state.saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: state.preview ? "linear-gradient(135deg, #EBBF74, #D4AF5A)" : "#d1d5db",
          color: state.preview ? "#052413" : "#9ca3af",
        }}
      >
        {state.saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : state.preview ? (
          <Save className="w-4 h-4" />
        ) : (
          <Check className="w-4 h-4" />
        )}
        {state.saving ? "Salvando..." : state.preview ? "Salvar" : "Salvo"}
      </button>
    </div>
  );
}

export function AdminLogo() {
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState<Record<LogoKey, LogoState>>({
    navbar: { current: null, preview: null, uploading: false, saving: false, dragging: false },
    footer: { current: null, preview: null, uploading: false, saving: false, dragging: false },
    favicon: { current: null, preview: null, uploading: false, saving: false, dragging: false },
  });

  useEffect(() => {
    getLogos()
      .then((logos) => {
        setStates((prev) => ({
          navbar: { ...prev.navbar, current: logos.logo_navbar },
          footer: { ...prev.footer, current: logos.logo_footer },
          favicon: { ...prev.favicon, current: logos.logo_favicon },
        }));
      })
      .finally(() => setLoading(false));
  }, []);

  function patchState(key: LogoKey, patch: Partial<LogoState>) {
    setStates((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#165B36]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Logos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gerencie as logos do site de forma independente. As imagens são enviadas para o Supabase Storage.
        </p>
      </div>

      {LOGO_CONFIGS.map((config) => (
        <LogoPanel
          key={config.key}
          config={config}
          state={states[config.key]}
          onChange={(patch) => patchState(config.key, patch)}
        />
      ))}
    </div>
  );
}

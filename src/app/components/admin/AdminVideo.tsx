import { useState, useEffect } from "react";
import { Loader2, Youtube, Save, ExternalLink } from "lucide-react";
import { getAuthors, updateAdminAuthors, type VideoSection } from "../../data/api";
import { toast } from "sonner";

const DEFAULT_VIDEO: VideoSection = {
  url: "",
  title: "Conheça a Época Editora",
  text: "Há mais de três décadas transformamos manuscritos em obras publicadas com excelência editorial. Assista ao vídeo e descubra como podemos dar vida à sua história.",
};

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
  } catch { /* invalid url */ }
  return null;
}

export function AdminVideo() {
  const [video, setVideo] = useState<VideoSection>(DEFAULT_VIDEO);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authors, setAuthors] = useState<{ id: number; name: string; specialty: string; books: number; image: string; quote: string }[]>([]);

  useEffect(() => {
    getAuthors()
      .then((data) => {
        if (data?.videoSection) setVideo(data.videoSection);
        if (Array.isArray(data?.authors)) setAuthors(data.authors);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateAdminAuthors(authors, video);
      toast.success("Vídeo atualizado com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar vídeo");
    } finally {
      setSaving(false);
    }
  }

  const embedUrl = getEmbedUrl(video.url);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#165B36]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Vídeo da Home</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure o vídeo do YouTube exibido na seção "Nossos Autores" da página inicial.
        </p>
      </div>

      {/* Video config card */}
      <div
        className="rounded-2xl border border-gray-200 overflow-hidden"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <Youtube className="w-4 h-4 text-red-500" />
          <span className="text-sm font-semibold text-gray-700">Configuração do Vídeo</span>
        </div>

        <div className="p-5 space-y-5">
          {/* URL input */}
          <div>
            <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
              URL do YouTube
            </label>
            <input
              value={video.url}
              onChange={(e) => setVideo((v) => ({ ...v, url: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40"
            />
            <p className="text-[0.65rem] text-gray-400 mt-1">
              Aceita links do youtube.com e youtu.be
            </p>
          </div>

          {/* Preview */}
          {embedUrl && (
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-2 block">
                Pré-visualização
              </label>
              <div className="rounded-xl overflow-hidden border border-gray-200 aspect-video bg-black">
                <iframe
                  src={embedUrl}
                  title="Preview do vídeo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {video.url && !embedUrl && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              URL inválida. Use um link do YouTube (ex: https://www.youtube.com/watch?v=abc123)
            </div>
          )}

          {/* Title and text */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                Título da seção
              </label>
              <input
                value={video.title}
                onChange={(e) => setVideo((v) => ({ ...v, title: e.target.value }))}
                placeholder="Conheça a Época Editora"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 font-serif"
              />
            </div>
            <div>
              <label className="text-[0.7rem] font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                Texto lateral
              </label>
              <textarea
                value={video.text}
                onChange={(e) => setVideo((v) => ({ ...v, text: e.target.value }))}
                rows={3}
                placeholder="Descrição que aparece ao lado do vídeo..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165B36]/20 focus:border-[#165B36]/40 resize-none"
              />
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #EBBF74, #D4AF5A)", color: "#052413" }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Salvando..." : "Salvar vídeo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

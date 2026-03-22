import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="min-h-screen flex items-center justify-center px-4"
          style={{ backgroundColor: "#FFFDF8" }}
        >
          <div className="max-w-md w-full text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "linear-gradient(135deg, #165B36, #052413)" }}
            >
              <AlertTriangle className="w-7 h-7 text-[#EBBF74]" />
            </div>
            <h1
              className="text-2xl font-semibold text-[#052413] mb-2 font-serif"
            >
              Algo deu errado
            </h1>
            <p className="text-sm text-[#856C42] mb-6 leading-relaxed">
              Ocorreu um erro inesperado nesta pagina. Tente recarregar ou volte para o inicio.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: "#165B36" }}
              >
                Recarregar pagina
              </button>
              <a
                href="/"
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#165B36] border transition-colors hover:bg-[#165B36]/5"
                style={{ borderColor: "rgba(22,91,54,0.25)" }}
              >
                Ir ao inicio
              </a>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-[#856C42]/60 cursor-pointer hover:text-[#856C42]">
                  Detalhes do erro (dev)
                </summary>
                <pre className="mt-2 p-3 rounded-lg bg-[#052413]/5 text-[0.65rem] text-[#052413]/70 overflow-auto whitespace-pre-wrap">
                  {this.state.error.message}
                  {"\n\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

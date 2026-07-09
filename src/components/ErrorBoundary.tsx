import React, { ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-neutral-50 dark:bg-[#191b1d] transition-colors duration-300">
          <div className="max-w-md w-full bg-white dark:bg-[#2a2d30] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-wider">
                Error de Renderizado
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Ocurrió un fallo en la interfaz de usuario. No te preocupes, tus datos simulados están seguros.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-left space-y-2">
                <div>
                  <div className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 mb-1">
                    Detalles del Error
                  </div>
                  <pre className="text-[11px] font-mono text-rose-500 dark:text-rose-400 overflow-x-auto max-h-24 whitespace-pre-wrap break-all">
                    {this.state.error.name}: {this.state.error.message}
                  </pre>
                </div>
                {this.state.error.stack && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 mb-1">
                      Pila de llamadas (Stack Trace)
                    </div>
                    <pre className="text-[9px] font-mono text-neutral-600 dark:text-neutral-400 overflow-auto max-h-40 whitespace-pre-wrap break-all bg-neutral-100 dark:bg-neutral-950 p-1.5 rounded">
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-2.5 bg-roblox-blue hover:bg-roblox-blue-hover text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-98"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

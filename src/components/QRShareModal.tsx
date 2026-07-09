import React, { useEffect, useRef, useState } from "react";
import { X, Copy, Check, QrCode } from "lucide-react";
import QRCode from "qrcode";

interface QRShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QRShareModal({ isOpen, onClose }: QRShareModalProps) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && canvasRef.current && currentUrl) {
      QRCode.toCanvas(
        canvasRef.current,
        currentUrl,
        {
          width: 200,
          margin: 2,
          color: {
            dark: "#191b1d", // roblox-bg-dark
            light: "#ffffff", // white
          },
        },
        (error) => {
          if (error) {
            console.error("Error generating QR code:", error);
          }
        }
      );
    }
  }, [isOpen, currentUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* Backdrop click to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Modal body */}
      <div className="relative w-full max-w-sm bg-white dark:bg-roblox-panel-dark border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-2xl p-6 z-10 overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-roblox-blue" />
            <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-base">
              Compartir Aplicación
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex flex-col items-center text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">
            Escanea este código QR con la cámara de tu móvil para acceder al instante.
          </p>

          {/* QR Code Canvas container with nice border */}
          <div className="p-2.5 bg-white border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-inner mb-5 flex justify-center items-center">
            <canvas ref={canvasRef} className="rounded-sm" style={{ width: "160px", height: "160px" }} />
          </div>

          {/* Link Copy Input Group */}
          <div className="w-full text-left">
            <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5">
              Enlace de la aplicación
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 bg-neutral-50 dark:bg-roblox-input-dark border border-neutral-200 dark:border-neutral-800 rounded px-2.5 py-1.5 text-xs font-mono text-neutral-600 dark:text-neutral-300 outline-none select-all overflow-ellipsis min-w-0"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 bg-roblox-blue hover:bg-roblox-blue-hover text-white font-semibold text-xs px-3 py-1.5 rounded transition-colors shadow-sm cursor-pointer whitespace-nowrap active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer of modal */}
        <div className="mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded font-semibold text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export default function QrPass({ value, label }: { value: string; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    void QRCode.toCanvas(canvasRef.current, value, {
      width: 164,
      margin: 1,
      color: { dark: "#1c1917", light: "#ffffff" },
      errorCorrectionLevel: "M",
    });
  }, [value]);

  return <canvas ref={canvasRef} width={164} height={164} className="h-[164px] w-[164px] rounded-2xl" aria-label={label} role="img" />;
}

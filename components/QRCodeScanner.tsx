"use client";
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Result, Exception } from "@zxing/library";

interface QRCodeScannerProps {
  onScan?: (data: any) => void;
}

export default function QRCodeScanner({ onScan }: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isScanned = useRef(false);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const [manualInput, setManualInput] = useState("");

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    if (videoRef.current) {
      codeReader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        async (result: Result | undefined, error: Exception | undefined) => {
          if (result && !isScanned.current) {
            const text = result.getText();
            console.log("✅ Scanned:", text);
            isScanned.current = true;

            try {
              // Try to parse as JSON first
              const data = JSON.parse(text);
              onScan?.(data);
            } catch {
              // If not JSON, pass the raw text
              onScan?.({ rawData: text });
            }

            // Reset after a delay to allow for new scans
            setTimeout(() => {
              isScanned.current = false;
            }, 2000);
          }
        }
      );
    }
  }, [onScan]);

  const handleManualScan = () => {
    try {
      const data = JSON.parse(manualInput);
      onScan?.(data);
      setManualInput(""); // Clear input after successful scan
    } catch {
      alert("Invalid JSON format. Please check your input.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Camera Scanner */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-lg">📱</span>
          </div>
          <h4 className="font-semibold text-blue-800 mb-1">QR Code Scanner</h4>
          <p className="text-sm text-blue-600">Point camera at QR code to scan</p>
        </div>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center">
            <video 
              ref={videoRef} 
              style={{ width: "100%" }}
              className="border border-slate-200 rounded-lg"
            />
          </div>
          
          <div className="text-center text-sm text-slate-600">
            <p>Position QR code within the frame to scan</p>
          </div>
        </div>
      </div>

      {/* Manual JSON Input */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-lg">⌨️</span>
          </div>
          <h4 className="font-semibold text-green-800 mb-1">Manual JSON Input</h4>
          <p className="text-sm text-green-600">Paste QR JSON data manually</p>
        </div>
        
        <div className="space-y-4">
          <textarea
            className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500 bg-white transition-all duration-200"
            placeholder="Paste QR JSON here... Example: {&quot;childId&quot;: &quot;123&quot;, &quot;pickupWallet&quot;: &quot;0x...&quot;, &quot;type&quot;: &quot;self-pickup&quot;}"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            rows={4}
          />
          
          <button
            className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            onClick={handleManualScan}
            disabled={!manualInput.trim()}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>🔍</span>
              <span>Process JSON</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
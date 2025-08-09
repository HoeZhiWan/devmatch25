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
  const [cameraStatus, setCameraStatus] = useState<'loading' | 'granted' | 'denied' | 'error'>('loading');

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    if (videoRef.current) {
      // Request camera permission explicitly
      navigator.mediaDevices?.getUserMedia({ video: true })
        .then(() => {
          console.log("✅ Camera permission granted");
          setCameraStatus('granted');
          codeReader.decodeFromVideoDevice(
            undefined,
            videoRef.current!,
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
              
              // Log camera errors but don't spam console
              if (error && error.name !== 'NotFoundException') {
                console.warn("QR Scanner:", error.message);
              }
            }
          );
        })
        .catch((error) => {
          console.error("❌ Camera access denied:", error);
          setCameraStatus(error.name === 'NotAllowedError' ? 'denied' : 'error');
        });
    }

    // Cleanup function
    return () => {
      // The camera stream will be automatically cleaned up when the component unmounts
      // ZXing browser handles this internally
      console.log('QR Scanner component unmounting');
    };
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

  const fillTestData = () => {
    const testData = {
      childId: "123",
      childName: "Alice Johnson", 
      pickupWallet: "0x1234567890abcdef1234567890abcdef12345678",
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      hash: `pickup-${Date.now()}-abcd1234`,
      type: "self-pickup"
    };
    setManualInput(JSON.stringify(testData, null, 2));
  };

  return (
    <div className="space-y-6">
      {/* Camera Scanner */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <div className="text-center mb-4">
          <div className="w-20 h-20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <img 
              src="/icons/qr-code.png" 
              alt="QR Code Icon" 
              className="w-16 h-16" />
          </div>
          <h4 className="font-semibold mb-1" style={{ color: 'var(--color-dark)' }}>QR Code Scanner</h4>
          <p className="text-sm" style={{ color: 'var(--color-dark)' }}>Point camera at QR code to scan</p>
        </div>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center">
            <video 
              ref={videoRef} 
              style={{ width: "100%" }}
              className="border border-slate-200 rounded-lg"
            />
          </div>
          
          <div className="text-center text-sm">
            {cameraStatus === 'loading' && (
              <p className="text-blue-700">Requesting camera access...</p>
            )}
            {cameraStatus === 'granted' && (
              <p className="text-green-700">Position QR code within the frame to scan</p>
            )}
            {cameraStatus === 'denied' && (
              <div className="text-red-600">
                <p>❌ Camera access denied</p>
                <p className="text-xs mt-1">Please allow camera access and refresh the page</p>
              </div>
            )}
            {cameraStatus === 'error' && (
              <div className="text-red-600">
                <p>⚠️ Camera error</p>
                <p className="text-xs mt-1">Please check your camera and try again</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
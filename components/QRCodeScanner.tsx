import React, { useState } from "react";

interface QRCodeScannerProps {
  onScan?: (data: any) => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan }) => {
  const [scanned, setScanned] = useState<string | null>(null);
  const [parsed, setParsed] = useState<any>(null);
  const [input, setInput] = useState("");

  const handleScan = () => {
    try {
      const data = JSON.parse(input);
      setScanned(input);
      setParsed(data);
      onScan?.(data); // Call the callback with parsed data
    } catch {
      alert("Invalid QR JSON");
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
          <span className="text-white text-lg">📱</span>
        </div>
        <h4 className="font-semibold text-blue-800 mb-1">QR Code Scanner</h4>
        <p className="text-sm text-blue-600">Paste QR JSON data below</p>
      </div>
      
      <div className="space-y-4">
        <textarea
          className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white transition-all duration-200"
          placeholder="Paste QR JSON here..."
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={3}
        />
        
        <button
          className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          onClick={handleScan}
          disabled={!input}
        >
          <div className="flex items-center justify-center space-x-2">
            <span>🔍</span>
            <span>Scan QR</span>
          </div>
        </button>
      </div>
      
      {parsed && (
        <div className="mt-6 bg-white rounded-xl p-4 shadow-lg border border-slate-200">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <h5 className="font-semibold text-slate-900">QR Data Scanned</h5>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-lg p-3">
                <span className="font-medium text-slate-700">Child ID:</span>
                <div className="text-slate-900 font-mono">{parsed.childId}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <span className="font-medium text-slate-700">Pickup Wallet:</span>
                <div className="text-slate-900 font-mono text-xs">{parsed.pickupWallet}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <span className="font-medium text-slate-700">Valid Until:</span>
                <div className="text-slate-900">{parsed.validUntil}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <span className="font-medium text-slate-700">Hash:</span>
                <div className="text-slate-900 font-mono text-xs">{parsed.hash}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;
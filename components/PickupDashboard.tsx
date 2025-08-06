import React, { useState } from "react";
import QRCodeGenerator from "./QRCodeGenerator";

interface Child {
  id: string;
  name: string;
  parentName: string;
}

const PickupDashboard: React.FC = () => {
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [qrJson, setQrJson] = useState("");
  const [qrValue, setQrValue] = useState<string | null>(null);

  // Mock data - in real app, fetch from database based on pickup person's wallet
  const [authorizedChildren] = useState<Child[]>([
    { id: 'STU001', name: 'Alice Johnson', parentName: 'John Johnson' },
    { id: 'STU002', name: 'Bob Smith', parentName: 'Sarah Smith' },
  ]);

  const handleShowQR = () => {
    try {
      // Validate JSON
      const parsed = JSON.parse(qrJson);
      setQrValue(JSON.stringify(parsed));
    } catch {
      setQrValue(null);
      alert("Invalid QR JSON");
    }
  };

  return (
    <div className="space-y-8">
      {/* Child Selection */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">🎫</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Pickup My Child</h3>
            <p className="text-slate-600">Select a child and display pickup QR code</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-xl p-6">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Select Child to Pickup
            </label>
            <select
              className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 bg-white transition-all duration-200"
              value={selectedChild}
              onChange={e => setSelectedChild(e.target.value)}
            >
              <option value="">Choose a child...</option>
              {authorizedChildren.map(child => (
                <option key={child.id} value={child.id}>
                  {child.name} (Parent: {child.parentName})
                </option>
              ))}
            </select>
          </div>

          {selectedChild && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">👤</span>
                </div>
                <div>
                  <h4 className="font-bold text-purple-800">Selected Child:</h4>
                  <div className="text-sm text-purple-700">
                    {authorizedChildren.find(c => c.id === selectedChild)?.name} 
                    ({selectedChild})
                  </div>
                </div>
              </div>
              <p className="text-xs text-purple-600">
                Show the QR code below to staff for pickup authorization
              </p>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Display */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">📱</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Show Pickup QR Code</h3>
            <p className="text-slate-600">Display your authorized pickup QR code</p>
          </div>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-50 rounded-xl p-6 mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Paste QR JSON from parent here
            </label>
            <textarea
              className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white transition-all duration-200"
              placeholder="Paste the QR JSON sent by the parent..."
              value={qrJson}
              onChange={e => setQrJson(e.target.value)}
              rows={4}
            />
            <button
              className="w-full mt-4 py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              onClick={handleShowQR}
              disabled={!qrJson}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>🔍</span>
                <span>Show QR Code</span>
              </div>
            </button>
          </div>

          {qrValue && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-8">
              <div className="text-center">
                <h4 className="text-xl font-bold text-blue-700 mb-4">Your Pickup QR Code</h4>
                <div className="bg-white rounded-xl p-6 inline-block shadow-lg">
                  <QRCodeGenerator value={qrValue} />
                </div>
                <p className="mt-4 text-sm text-blue-600">
                  Show this QR code to staff for pickup authorization
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">📋</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Instructions</h3>
            <p className="text-slate-600">Follow these steps to complete pickup</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Select Child</h4>
                <p className="text-sm text-slate-600">Choose the child you want to pickup from the dropdown</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Paste QR JSON</h4>
                <p className="text-sm text-slate-600">Paste the QR JSON code sent by the parent</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Show QR Code</h4>
                <p className="text-sm text-slate-600">Click "Show QR Code" to display your authorization</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Present to Staff</h4>
                <p className="text-sm text-slate-600">Show the QR code to school staff for verification</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PickupDashboard;
"use client";

import { useState } from "react";
import QRCode from "qrcode.react";


export default function PickupDashboard() {
    const [qrData, setQrData] = useState<string | null>(null);

    const requestQR = async () => {
        const res = await fetch("/api/pickup/qr", { method: "POST" });
        const data = await res.json();
        if (data.qrData) {
            setQrData(data.qrData);
        }
    };

    return (
        <main className="flex flex-col items-center p-6">
            <h1 className="text-2xl font-bold mb-4">Pickup Dashboard</h1>
            <button
                className="px-4 py-2 bg-green-600 text-white rounded"
                onClick={requestQR}
            >
                Request QR for Pickup
            </button>

            {qrData && (
                <div className="mt-6">
                    <QRCode value={qrData} size={200} />
                    <p className="mt-3 text-sm text-gray-700">Show this QR to staff.</p>
                </div>
            )}
        </main>
    );
}

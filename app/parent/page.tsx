"use client";
import { useEffect, useState } from "react";

function PickupHistory() {
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const fetchHistory = async () => {
            const res = await fetch("/api/pickup/history");
            const data = await res.json();
            setHistory(data.history || []);
        };
        fetchHistory();
    }, []);

    return (
        <div className="mt-8 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2">Pickup History</h2>
            {history.length === 0 ? (
                <p className="text-gray-500">No pickups yet.</p>
            ) : (
                <ul className="space-y-2">
                    {history.map((item, idx) => (
                        <li key={idx} className="p-3 border rounded bg-gray-50">
                            Student: {item.studentId} <br />
                            Verified At: {new Date(item.verifiedAt).toLocaleString()}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default PickupHistory;



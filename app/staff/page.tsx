"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseUtils"; // configure your Firebase
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function StaffDashboard() {
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        const fetchLogs = async () => {
            const querySnapshot = await getDocs(collection(db, "pickupLogs"));
            setLogs(querySnapshot.docs.map(doc => doc.data()));
        };
        fetchLogs();
    }, []);

    const addPickup = async () => {
        await addDoc(collection(db, "pickupLogs"), {
            time: new Date().toISOString(),
            by: "Staff",
        });
        alert("Pickup logged!");
    };

    return (
        <main className="p-6">
            <h1 className="text-xl font-bold mb-4">Staff Dashboard</h1>
            <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                onClick={addPickup}
            >
                Add Pickup Log
            </button>
            <ul className="mt-4">
                {logs.map((log, idx) => (
                    <li key={idx} className="border p-2 mb-2">
                        {log.time} - {log.by}
                    </li>
                ))}
            </ul>
        </main>
    );
}

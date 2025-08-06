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
"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function StaffMenu() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <Image
        src="/logo.jpg"
        alt="Logo"
        width={100}
        height={100}
        className="mx-auto mb-8"
      />
      <div className="py-10"></div>
      <div className="flex flex-col gap-8 w-full max-w-xs">
        <button
          className="flex items-center justify-center gap-4 h-20 w-full bg-gray-900 text-white rounded-xl shadow-lg text-lg font-semibold"
          onClick={() => router.push("/staff/pickup")}
        >
          Pick Up
        </button>
        <button
          className="flex items-center justify-center gap-4 h-20 w-full bg-gray-900 text-white rounded-xl shadow-lg text-lg font-semibold"
          onClick={() => router.push("/staff/history")}
        >
          Show Pick Up History
        </button>
        <button
          className="flex items-center justify-center gap-4 h-20 w-full bg-gray-900 text-white rounded-xl shadow-lg text-lg font-semibold"
          onClick={() => router.push("/staff/add")}
        >
          Add New Student & Parent
        </button>
      </div>
    </div>
  );
}
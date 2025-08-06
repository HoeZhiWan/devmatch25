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
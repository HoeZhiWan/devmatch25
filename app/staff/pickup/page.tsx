"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function StaffPickup() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const availableIds = ["123", "456", "789"]; // Example student IDs
  // In a real application, this would be fetched from a database or API
  const [studentId, setStudentId] = useState("");
  // studentId will be stored in this variable, and can be used later to confirm the pick up
  const [error, setError] = useState("");

  const handleEnter = () => {
    if (availableIds.includes(studentId.trim())) {
      setError("");
      router.push("/staff/pickup/scanQR");
    } else if (studentId.trim() === "") {
      setError("Please enter a student ID.");
    } else {
      setError("Student not found.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 pt-8 relative">
      {/* Hamburger Menu Icon */}
      <button
        className="absolute top-6 left-6 z-20"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menu"
      >
        <Image
          src="/hamburger-menu.svg"
          alt="Hamburger Icon"
          width={24}
          height={24}
        />
      </button>

      {/* Side Menu */}
      {menuOpen && (
        <div className="fixed top-0 left-0 h-full w-64 bg-[#f9f9f9] text-black border-r border-gray-200 border-r-[1px] shadow-lg z-30 flex flex-col pt-20 px-6">
          <button
            className=" text-right text-lg font-bold"
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>
          <button
            className="mb-8 text-left text-lg font-bold"
            onClick={() => router.push("/staff")}
          >
            Home
          </button>
          <button
            className="mb-8 text-left text-lg font-bold"
            onClick={() => router.push("/staff/history")}
          >
            Pick Up History
          </button>
          <button
            className="mb-8 text-left text-lg font-bold"
            onClick={() => router.push("/staff/add")}
          >
            Add Student & Parent
          </button>          
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl font-bold text-center mt-20 mb-8">Pick Up</h1>

      {/* Input Field */}
      <div className="w-full max-w-xs mb-8">
        <label className="block text-lg font-semibold text-gray-900 mb-2">
          Student ID:
        </label>
        <input
          type="text"
          placeholder="Enter student ID"
          className="w-full h-10 px-4 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
          value={studentId}
          onChange={e => setStudentId(e.target.value)}
        />
        {error && (
          <span className="text-red-600 text-sm mt-2 block">{error}</span>
        )}
      </div>

      {/* Action Button */}
      <button
        className="flex items-center justify-center gap-2 h-10 w-32 bg-gray-900 text-white rounded-xl shadow-lg text-lg font-semibold"
        onClick={handleEnter}
      >
        Enter
      </button>
    </div>
  );
}
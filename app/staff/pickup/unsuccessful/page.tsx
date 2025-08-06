"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function PickUpUnSuccessful() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="w-full bg-white flex flex-col px-4 pt-8 relative">
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

      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
        {/* Checkmark inside a circle with drop shadow */}
        <div className="w-20 h-20 rounded-full shadow-md border border-gray-400 flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(218, 187, 168, 0.39)', // RGB from your ellipse fill
            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)'
          }}>
          <span className="text-4xl">x</span>
        </div>

        {/* Success Text */}
        <p className="mt-6 text-center text-xl font-semibold">
          Parent not authorized!
        </p>
        <button className="mt-10 bg-black text-white rounded-xl py-2 px-4 w-40"
          onClick={() => router.push("/staff/pickup")}
          >
          New Pick Up  
        </button>
      </div>

    </div>
  )
}
"use client"
import Image from "next/image"
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PickUpSuccessful() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  //need to change to values from the database
  const studentName = "John Doe"; // Example student name
  const studentId = "123456"; // Example student ID
  const parentName = "Jane Doe"; // Example parent name
  const relationship = "Mother"; // Example relationship
  const address = "0x1234567890abcdef1234567890abcdef12345678"; // Example wallet address
  //then need to do something to store the successful pick up in the database

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

      {/* Title */}
      <h1 className="text-3xl font-bold text-center mt-20 mb-8">Pick Up</h1>
      <p className="text-center">Authorized Successfully!</p>
      <div className="pl-6">
        <p>Student Information</p>
        <p>Name: {studentName}</p>
        <p>Student ID: {studentId}</p>
        <div className="mb-8"></div>
        <p>Parent Information</p>
        <p>Name: {parentName}</p>
        <p>Relationship: {relationship}</p>
        <p>Wallet Address: {address}</p>
      </div>

      <div className="flex flex-col pt-20 items-center bg-white px-4">
        {/* Checkmark inside a circle with drop shadow */}
        <div className="w-20 h-20 rounded-full shadow-md border border-gray-400 flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(218, 187, 168, 0.39)', // RGB from your ellipse fill
            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)'
          }}>
          <span className="text-4xl">✓</span>
        </div>

        {/* Success Text */}
        <p className="mt-6 text-center text-xl font-semibold">
          Pick up history added
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
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function StaffHistory() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(""); // Add state for selected date
  // the date will be stored in variable selectedDate (format: yyyy-mm-dd), and can be used later to filter the records

  const students = ["All students","Jenny", "Tom", "Sara", "Phoebe"];
  // list of students for the dropdown
  // this can be fetched from a database
  const [selectedStudent, setSelectedStudent] = useState(students[0]);
  //selected student will be stored in variable selectedStudent, and can be used later to filter the records

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
        <div className="fixed top-0 left-0 h-full w-64 bg-[#f9f9f9] text-black border-r border-r border-gray-200 border-r-[1px] shadow-lg z-30 flex flex-col pt-20 px-6">
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
            onClick={() => router.push("/staff/pickup")}
          >
            Pick Up
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
      <h1 className="text-2xl font-bold text-center mt-20 mb-8">Pick Up Histories</h1>

      {/* Date Selector (Calendar) */}
      <div className="w-full max-w-xs mx-auto mb-6">
        <input
          type="date"
          className="w-full bg-gray-200 rounded-full px-6 py-2 text-lg font-semibold text-gray-900 focus:outline-none"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />
      </div>

      {/* Student Selector */}
      <div className="w-full max-w-xs mx-auto mb-6">
        <select
          className="w-full bg-gray-200 rounded-full px-6 py-2 text-lg font-semibold text-gray-900 focus:outline-none"
          value={selectedStudent}
          onChange={e => setSelectedStudent(e.target.value)}
        >
          {students.map(student => (
            <option key={student} value={student}>
              {student}
            </option>
          ))}
        </select>
      </div>

      {/* History List Item */}
      <div className="w-full max-w-xs mx-auto mb-4 bg-purple-50 rounded-lg shadow p-4 flex flex-col">
        <span className="text-sm text-gray-700">Student: {selectedStudent}</span>
        <span className="text-lg font-bold text-gray-900 mt-2">Picked up by Parent</span>
        <span className="text-sm text-gray-500 mt-2">5 Aug 2025 17:40</span>
      </div>
    </div>
  );
}
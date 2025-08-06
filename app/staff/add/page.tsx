"use client"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
export default function AddStudentParent() {
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  //will store the student and parent information
  const [formData, setFormData] = useState({
    studentName: '',
    parentName: '',
    walletId: '',
    relationship: '',
    phone: '',
  });

  const isFormValid = Object.values(formData).every((value) => value.trim() !== '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    // Handle submit logic
    console.log('Submitted:', formData);

    //********************************
    //something to do with the database
    //  */

    //reset form
    setFormData({
      studentName: '',
      parentName: '',
      walletId: '',
      relationship: '',
      phone: '',
    });
    router.refresh();
  };

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
            onClick={() => router.push("/staff/pickup")}
          >
            Pick Up
          </button>
          <button
            className="mb-8 text-left text-lg font-bold"
            onClick={() => router.push("/staff/history")}
          >
            Pick Up History
          </button>

        </div>
      )}

      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6 text-center">Add New Data</h1>

          <label className="block mb-2 text-sm font-medium">Student</label>
          <input
            name="studentName"
            value={formData.studentName}
            onChange={handleChange}
            placeholder="Name"
            className="w-full mb-4 px-4 py-2 rounded-full bg-gray-200 text-gray-700 placeholder-gray-500 outline-none"
          />

          <label className="block mb-2 text-sm font-medium">Main Parent</label>
          <input
            name="parentName"
            value={formData.parentName}
            onChange={handleChange}
            placeholder="Name"
            className="w-full mb-3 px-4 py-2 rounded-full bg-gray-200 text-gray-700 placeholder-gray-500 outline-none"
          />
          <input
            name="walletId"
            value={formData.walletId}
            onChange={handleChange}
            placeholder="Wallet address / ID"
            className="w-full mb-3 px-4 py-2 rounded-full bg-gray-200 text-gray-700 placeholder-gray-500 outline-none"
          />
          <input
            name="relationship"
            value={formData.relationship}
            onChange={handleChange}
            placeholder="Relationship to Child"
            className="w-full mb-3 px-4 py-2 rounded-full bg-gray-200 text-gray-700 placeholder-gray-500 outline-none"
          />
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone number"
            className="w-full mb-6 px-4 py-2 rounded-full bg-gray-200 text-gray-700 placeholder-gray-500 outline-none"
          />

          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-2 rounded-md text-white font-semibold ${isFormValid ? 'bg-black' : 'bg-gray-400 cursor-not-allowed'
              }`}
          >
            Finish
          </button>
        </form>
      </div>
    </div>
  );
}
"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function RoleSelect() {
  const router = useRouter();

  const handleSelect = (role: string) => {
    router.push(`/login/verify?role=${role}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-xs p-8">
        <Image
            src="/logo.jpg"
            alt="Logo"
            width={100}
            height={100}
            className="mx-auto mb-8"
        />
        <h2 className="text-xl font-bold mb-6 text-center">
            Choose Your Role
        </h2>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleSelect("parent")}
            className="bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition"
          >
            Parent
          </button>
          <button
            onClick={() => handleSelect("staff")}
            className="bg-green-600 text-white rounded-lg py-3 font-semibold hover:bg-green-700 transition"
          >
            Staff
          </button>
        </div>
      </div>
    </div>
  );
}    
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string }) => Promise<string[]>;
    };
  }
}

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role");
  const [account, setAccount] = useState<string | null>(null);

  const handleMetaMaskLogin = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);
        if (role === "staff") {
          router.push("/staff");
        }
      } catch (error) {
        alert("MetaMask connection failed.");
      }
    } else {
      alert("MetaMask is not installed. Please install MetaMask to continue.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className=" max-w-sm p-8">
        <Image
          src="/logo.jpg"
          alt="Logo"
          width={100}
          height={100}
          className="mx-auto mb-8"
        />
        <h2 className="text-2xl font-bold mb-8 text-center">
          Login
        </h2>
        <form className="flex flex-col gap-4" onSubmit={e => e.preventDefault()}>
          <button
            type="button"
            onClick={handleMetaMaskLogin}
            className="bg-black text-white rounded-2xl px-6 py-4 font-semibold"
          >
            Sign In With MetaMask
          </button>
        </form>
        {account && (
          <div className="mt-6 text-center text-green-600 break-all">
            Connected: {account}
          </div>
        )}
      </div>
    </div>
  );
}
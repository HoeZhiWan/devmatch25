"use client";
import { useEffect, useRef } from "react";
import { useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function QRScanner() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const isScanned = useRef(false);
  //store scanned data
  const [scannedData, setScannedData] = useState("");

  // replace with correct wallet address corresponding to the child
  const tempCorrectQR = "123";

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250, }, true);

    scanner.render(
      async (decodedText, decodedResult) => {
        if (!isScanned.current) {
          console.log("✅ QR Code Scanned:", decodedText);
          setScannedData(decodedText);
          isScanned.current = true;

          try {
            await scanner.clear(); // wait for DOM cleanup
            console.log("🛑 Scanner stopped.");

            if (decodedText === tempCorrectQR) {
              router.push("/staff/pickup/successful");
            } else {
              router.push("/staff/pickup/unsuccessful");
            }
          } catch (error) {
            console.error("❌ Failed to stop scanner:", error);
          }
        }
      },
      (errorMessage) => {
        console.warn("❌ QR Code Scan Error:", errorMessage);
      }
    );

    // Cleanup when unmounting
    return () => {
      scanner.clear().catch((error) => {
        console.error("Failed to clear scanner:", error);
      });
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-4">

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
      <h1 className="text-3xl font-bold text-center mt-20 mb-8">Pick Up</h1>
      <h1 className="text-xl font-bold mb-4">Scan Parent's QR</h1>
      <div id="qr-reader" className="w-full max-w-xs">
      </div>
    </div>
  );
}


import React from "react";
import QRCode from "react-qr-code";

interface QRCodeGeneratorProps {
  value: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ value }) => (
  <div className="flex flex-col items-center">
    <QRCode value={value} size={160} />
    <div className="mt-2 text-xs text-gray-500 break-all">{value}</div>
  </div>
);

export default QRCodeGenerator;
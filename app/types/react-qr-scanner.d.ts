declare module "react-qr-scanner" {
  import * as React from "react";

  export interface QrReaderProps {
    delay?: number | false;
    onError: (error: any) => void;
    onScan: (data: any | null) => void;
    style?: React.CSSProperties;
    facingMode?: "user" | "environment";
  }

  export default class QrReader extends React.Component<QrReaderProps> {}
}

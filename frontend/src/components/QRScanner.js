import React, { useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const QRScanner = ({ onScan, isScanning, setIsScanning }) => {
  const [manualInput, setManualInput] = useState('');
  const [scannerInitialized, setScannerInitialized] = useState(false);

  React.useEffect(() => {
    if (isScanning && !scannerInitialized) {
      const scanner = new Html5QrcodeScanner('qr-reader', {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 5,
      });

      scanner.render(
        (decodedText) => {
          onScan(decodedText);
          scanner.clear();
          setScannerInitialized(false);
          setIsScanning(false);
        },
        (error) => {
          // console.warn(error);
        }
      );

      setScannerInitialized(true);

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [isScanning, onScan, setIsScanning, scannerInitialized]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Quét Mã QR</CardTitle>
        <CardDescription>Sử dụng camera hoặc nhập mã thủ công</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isScanning && (
          <>
            <Button 
              onClick={() => setIsScanning(true)} 
              className="w-full"
              data-testid="start-scan-button"
            >
              📷 Bắt Đầu Quét QR
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Hoặc</span>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <Label htmlFor="manual-input">Nhập Mã Thùng</Label>
                <Input
                  id="manual-input"
                  type="text"
                  placeholder="VD: BOX-8D765870"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  data-testid="manual-box-input"
                />
              </div>
              <Button type="submit" variant="outline" className="w-full" data-testid="submit-manual-button">
                ✓ Xác Nhận
              </Button>
            </form>
          </>
        )}

        {isScanning && (
          <div>
            <div id="qr-reader" className="w-full"></div>
            <Button 
              onClick={() => {
                setIsScanning(false);
                setScannerInitialized(false);
              }} 
              variant="destructive" 
              className="w-full mt-4"
              data-testid="stop-scan-button"
            >
              Dừng Quét
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QRScanner;

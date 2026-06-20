import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const QRScanner = ({ onScan, isScanning, setIsScanning }) => {
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'qr-scanner-container';

  // Stop scanner cleanup
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        // 2 = SCANNING
        if (state === 2) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Cleanup error:', err);
      }
      html5QrCodeRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanning = async () => {
    setError('');
    setIsScanning(true);

    // Wait for DOM to render the scanner container
    setTimeout(async () => {
      try {
        const container = document.getElementById(scannerContainerId);
        if (!container) {
          setError('Không tìm thấy container scanner');
          setIsScanning(false);
          return;
        }

        // Get available cameras
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setError('Không tìm thấy camera trên thiết bị này. Vui lòng nhập mã thủ công.');
          setIsScanning(false);
          return;
        }

        setCameras(devices);

        // Prefer back camera on mobile - look for "back" or "environment" in label
        const backCamera = devices.find(d => 
          /back|rear|environment|sau/i.test(d.label)
        );
        const cameraId = backCamera ? backCamera.id : devices[devices.length - 1].id;
        setSelectedCamera(cameraId);

        const html5QrCode = new Html5Qrcode(scannerContainerId);
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          cameraId,
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdgePercentage = 0.7;
              const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
              return { width: qrboxSize, height: qrboxSize };
            },
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            // Success callback
            await stopScanner();
            setIsScanning(false);
            onScan(decodedText);
          },
          (errorMessage) => {
            // Per-frame errors - ignore (just means no QR in current frame)
          }
        );
      } catch (err) {
        console.error('Camera start error:', err);
        let errorMsg = 'Không thể truy cập camera. ';
        
        if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
          errorMsg += 'Vui lòng cho phép quyền truy cập camera trong cài đặt trình duyệt.';
        } else if (err.name === 'NotFoundError') {
          errorMsg += 'Không tìm thấy camera trên thiết bị.';
        } else if (err.name === 'NotReadableError') {
          errorMsg += 'Camera đang được sử dụng bởi ứng dụng khác.';
        } else if (err.message?.includes('secure')) {
          errorMsg += 'Cần truy cập qua HTTPS để dùng camera.';
        } else {
          errorMsg += err.message || 'Vui lòng thử lại hoặc nhập mã thủ công.';
        }
        
        setError(errorMsg);
        setIsScanning(false);
      }
    }, 100);
  };

  const handleStop = async () => {
    await stopScanner();
    setIsScanning(false);
  };

  const switchCamera = async (cameraId) => {
    await stopScanner();
    setSelectedCamera(cameraId);
    
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode(scannerContainerId);
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          cameraId,
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdgePercentage = 0.7;
              const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
              return { width: qrboxSize, height: qrboxSize };
            },
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            await stopScanner();
            setIsScanning(false);
            onScan(decodedText);
          },
          () => {}
        );
      } catch (err) {
        setError('Không thể chuyển camera: ' + err.message);
      }
    }, 200);
  };

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
        <CardTitle>📷 Quét Mã QR</CardTitle>
        <CardDescription>Sử dụng camera điện thoại hoặc nhập mã thủ công</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-red-500 bg-red-50">
            <AlertDescription className="text-red-800 text-sm">
              ⚠️ {error}
            </AlertDescription>
          </Alert>
        )}

        {!isScanning && (
          <>
            <Button 
              onClick={startScanning} 
              className="w-full h-14 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              data-testid="start-scan-button"
            >
              📷 Bật Camera Quét QR
            </Button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              💡 <strong>Lần đầu sử dụng:</strong> Trình duyệt sẽ hỏi quyền truy cập camera. Vui lòng nhấn <strong>"Cho phép"</strong> để quét QR.
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Hoặc nhập tay</span>
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
                  onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                  className="text-lg uppercase"
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
          <div className="space-y-3">
            <div className="bg-black rounded-lg overflow-hidden relative">
              <div id={scannerContainerId} className="w-full" style={{ minHeight: '300px' }}></div>
              {/* Scanning overlay guide */}
              <div className="absolute top-2 left-0 right-0 text-center text-white text-xs pointer-events-none">
                <p className="bg-black/50 inline-block px-3 py-1 rounded-full">
                  🎯 Đưa mã QR vào khung
                </p>
              </div>
            </div>

            {/* Camera switch (if multiple cameras) */}
            {cameras.length > 1 && (
              <div className="flex gap-2 flex-wrap justify-center">
                {cameras.map((cam, idx) => (
                  <Button
                    key={cam.id}
                    size="sm"
                    variant={selectedCamera === cam.id ? 'default' : 'outline'}
                    onClick={() => switchCamera(cam.id)}
                    data-testid={`switch-camera-${idx}`}
                  >
                    📷 {cam.label.length > 20 ? `Camera ${idx + 1}` : cam.label}
                  </Button>
                ))}
              </div>
            )}

            <Button 
              onClick={handleStop}
              variant="destructive" 
              className="w-full"
              data-testid="stop-scan-button"
            >
              ✕ Dừng Quét
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QRScanner;

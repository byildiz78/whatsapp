import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface QRAuthProps {
  qrCode: string | null;
  setQrCode: (code: string | null) => void;
  authStatus: 'pending' | 'authenticated' | 'error' | 'initializing';
  setAuthStatus: (status: 'pending' | 'authenticated' | 'error' | 'initializing') => void;
  isInitializing: boolean;
  setIsInitializing: (value: boolean) => void;
  attempts: number;
  setAttempts: (value: number) => void;
  onAuthSuccess: (sessionId: string) => void;
}

export default function QRAuth({ 
  qrCode, 
  setQrCode,
  authStatus, 
  setAuthStatus,
  isInitializing,
  setIsInitializing,
  attempts,
  setAttempts,
  onAuthSuccess 
}: QRAuthProps) {
  return (
    <Card className="p-6 max-w-md w-full space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">WhatsApp Bağlantısı</h2>
        
        {authStatus === 'pending' && !qrCode && (
          <p className="text-gray-600">
            QR kod hazırlanıyor, lütfen bekleyin... (Deneme: {attempts})
          </p>
        )}

        {authStatus === 'pending' && qrCode && (
          <div className="space-y-4">
            <p className="text-gray-600">
              WhatsApp Web'i açmak için QR kodu tarayın
            </p>
            <div className="flex justify-center">
              <Image
                src={`data:image/png;base64,${qrCode}`}
                alt="WhatsApp QR Code"
                width={256}
                height={256}
                className="border rounded-lg"
              />
            </div>
          </div>
        )}

        {authStatus === 'authenticated' && (
          <p className="text-green-600">
            WhatsApp bağlantısı başarılı!
          </p>
        )}

        {authStatus === 'error' && (
          <div className="space-y-4">
            <p className="text-red-600">
              Bağlantı başarısız oldu.
            </p>
            <Button onClick={() => {
              setAttempts(attempts + 1);
              setAuthStatus('pending');
              setQrCode(null);
            }}>
              Tekrar Dene
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
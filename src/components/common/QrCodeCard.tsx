import React, { useEffect, useState, useRef } from 'react';
import {
  QrCode,
  Download,
  Printer,
  Copy,
  ExternalLink,
  Sparkles,
  Check,
} from 'lucide-react';
import { generateQrDataUrl, downloadDataUrl } from '../../utils/qrCode';
import { useRestaurant } from '../../context/RestaurantContext';

interface QrCodeCardProps {
  url: string;
  title: string;
  subtitle?: string;
  tableNumber?: string;
  zone?: string;
  showSimulateButton?: boolean;
  onSimulateScan?: () => void;
  badgeLabel?: string;
}

export const QrCodeCard: React.FC<QrCodeCardProps> = ({
  url,
  title,
  subtitle,
  tableNumber,
  zone,
  showSimulateButton = true,
  onSimulateScan,
  badgeLabel,
}) => {
  const { settings, showToast } = useRestaurant();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    generateQrDataUrl(url, {
      width: 400,
      margin: 2,
      darkColor: '#000000',
      lightColor: '#ffffff',
    }).then((dataUrl) => {
      if (isMounted) {
        setQrDataUrl(dataUrl);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [url]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast(`คัดลอกลิงก์สั่งอาหารแล้ว (${url})`, 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadImage = () => {
    if (!qrDataUrl) return;
    const filename = tableNumber
      ? `QR_Table_${tableNumber}_${settings.name.replace(/\s+/g, '_')}.png`
      : `QR_Store_${settings.name.replace(/\s+/g, '_')}.png`;
    downloadDataUrl(qrDataUrl, filename);
    showToast(`ดาวน์โหลดภาพ QR Code (${filename}) เรียบร้อยแล้ว`, 'success');
  };

  const handlePrint = () => {
    if (!printAreaRef.current) return;
    
    // Create an invisible print window/iframe to print only the tent card
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('เบราว์เซอร์บล็อกหน้าต่างพิมพ์ กรุณาอนุญาต Pop-up', 'warning');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>พิมพ์ QR Code - ${title}</title>
          <style>
            @page { size: auto; margin: 15mm; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              padding: 20px;
              color: #111;
              background: #fff;
            }
            .card {
              border: 2px dashed #333;
              border-radius: 20px;
              padding: 30px 40px;
              max-width: 380px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            }
            .brand {
              font-size: 16px;
              font-weight: 900;
              color: #FF5C00;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 6px;
            }
            .table-title {
              font-size: 32px;
              font-weight: 900;
              margin: 4px 0;
              color: #000;
            }
            .zone {
              font-size: 13px;
              color: #666;
              margin-bottom: 15px;
            }
            .qr-img {
              width: 220px;
              height: 220px;
              margin: 10px auto;
              display: block;
              border-radius: 12px;
              border: 1px solid #ddd;
            }
            .instruction {
              font-size: 14px;
              font-weight: 700;
              color: #111;
              margin-top: 15px;
            }
            .sub-instruction {
              font-size: 11px;
              color: #777;
              margin-top: 4px;
            }
            .url-text {
              font-size: 9px;
              font-family: monospace;
              color: #999;
              margin-top: 15px;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">✨ ${settings.name}</div>
            <div class="table-title">${tableNumber ? `โต๊ะ ${tableNumber}` : title}</div>
            ${zone ? `<div class="zone">โซน: ${zone}</div>` : ''}
            <img class="qr-img" src="${qrDataUrl}" alt="QR Code" />
            <div class="instruction">📱 สแกนเพื่อสั่งอาหาร & ชำระเงิน</div>
            <div class="sub-instruction">Scan with phone camera to view menu & order</div>
            <div class="url-text">${url}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col items-center p-5 bg-[#111112] border border-white/10 rounded-3xl space-y-4 shadow-xl">
      {/* Printable Card Container */}
      <div
        ref={printAreaRef}
        className="w-full max-w-[280px] p-5 bg-white text-stone-950 rounded-2xl shadow-lg flex flex-col items-center text-center space-y-2 select-all border border-stone-200"
      >
        <div className="flex items-center gap-1 text-[11px] font-black text-[#FF5C00] uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{settings.name}</span>
        </div>

        {tableNumber ? (
          <div>
            <div className="text-2xl font-black font-mono tracking-tight text-stone-950 leading-tight">
              โต๊ะ {tableNumber}
            </div>
            {zone && <div className="text-[10px] font-bold text-stone-500 uppercase">{zone}</div>}
          </div>
        ) : (
          <div>
            <div className="text-lg font-black tracking-tight text-stone-950 leading-tight">
              {title}
            </div>
            {subtitle && <div className="text-[10px] text-stone-500 font-medium">{subtitle}</div>}
          </div>
        )}

        {/* QR Code graphic */}
        <div className="p-2 bg-white rounded-xl border border-stone-200 flex flex-col items-center justify-center my-1 shadow-sm">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Scan to order QR Code"
              className="w-44 h-44 object-contain rounded-lg"
            />
          ) : (
            <div className="w-44 h-44 flex items-center justify-center text-stone-400">
              <QrCode className="w-16 h-16 animate-pulse" />
            </div>
          )}
          <span className="text-[9px] font-mono text-stone-600 font-bold mt-1 tracking-wider uppercase">
            SCAN TO VIEW MENU & ORDER
          </span>
        </div>

        <div className="space-y-0.5">
          <p className="text-xs font-black text-stone-900 leading-tight">
            สแกนเพื่อเปิดเมนู สั่งอาหาร และจ่ายเงิน
          </p>
          <p className="text-[10px] text-stone-500 font-medium">
            เปิดกล้องมือถือ สแกนเข้าหน้าร้านได้ทันที
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full space-y-2 pt-1">
        {showSimulateButton && onSimulateScan && (
          <button
            type="button"
            onClick={onSimulateScan}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>ทดลองสแกนทันที (เปิดหน้าสั่งอาหาร)</span>
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#161618] hover:bg-[#202024] border border-white/10 text-stone-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            title="คัดลอก URL สั่งอาหาร"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#FF5C00]" />
                <span>คัดลอกลิงก์</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadImage}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#161618] hover:bg-[#202024] border border-white/10 text-stone-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            title="ดาวน์โหลดรูปภาพ PNG สำหรับนำไปพิมพ์หรือแชร์"
          >
            <Download className="w-3.5 h-3.5 text-[#FF5C00]" />
            <span>โหลดภาพ PNG</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#FF5C00] hover:bg-[#FF7729] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-[#FF5C00]/20 transition-all cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>พิมพ์ป้ายตั้งโต๊ะ (Print Standee)</span>
        </button>
      </div>
    </div>
  );
};

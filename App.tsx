import React, { useState, useEffect, useRef } from 'react';
import { Search, AlertCircle, MapPin, CheckCircle, Car } from 'lucide-react';

// ==========================================
// การตั้งค่า (Configuration)
// ==========================================
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwd0Wt66cnmx2L0R6Qh7frLYbR5ujY7Hi5h3gJkS8HzrsKFSpI8GB4Y9eb4aHFGsBE8/exec'; // URL ของ Google Apps Script Web App
const SPHERE_API_KEY = 'EDB31CA9C8A944F59D3021B1F0B565C0'; // API Key สำหรับ Sphere Map (GISTDA)

export default function App() {
  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ found: boolean; lat?: number; lng?: number; message?: string } | null>(null);
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // โหลด Script ของ Sphere Map เมื่อ Component ถูก Mount
  useEffect(() => {
    if (SPHERE_API_KEY === 'ใส่ API Key ที่นี่') {
      console.warn('กรุณาใส่ SPHERE_API_KEY เพื่อใช้งานแผนที่');
      return;
    }

    const scriptId = 'sphere-map-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://api.sphere.gistda.or.th/map/js/sphere.js?key=${SPHERE_API_KEY}`;
      script.async = true;
      script.onload = () => {
        console.log('Sphere Map Script Loaded');
      };
      document.head.appendChild(script);
    }
  }, []);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) {
      setError('กรุณากรอกป้ายทะเบียนรถ');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);
    setShowPopup(false);

    try {
      // จำลองการเรียก API ในกรณีที่ยังไม่ได้ใส่ URL จริง
      if (GAS_URL === 'ใส่ URL ของคุณที่นี่') {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
        
        // จำลองข้อมูลตอบกลับ (สุ่มเจอหรือไม่เจอ)
        const isFound = Math.random() > 0.5;
        if (isFound) {
          const mockData = {
            found: true,
            lat: 13.7563, // พิกัดตัวอย่าง (กรุงเทพฯ)
            lng: 100.5018,
            message: 'เคยผ่านด่าน A'
          };
          setResult(mockData);
          setShowPopup(true); // แสดง Popup แจ้งเตือน
          initMap(mockData.lat, mockData.lng);
        } else {
          setResult({ found: false, message: 'ไม่พบประวัติการผ่านด่าน A' });
        }
      } else {
        // การเรียก API จริง
        const response = await fetch(`${GAS_URL}?plate=${encodeURIComponent(plate)}`);
        if (!response.ok) throw new Error('เกิดข้อผิดพลาดในการเชื่อมต่อ API');
        
        const apiResult = await response.json();
        
        // แปลงข้อมูลจาก GAS ให้ตรงกับรูปแบบที่แอปหน้าเว็บเข้าใจ
        const formattedData = {
          found: apiResult.status === 'success',
          lat: apiResult.data ? parseFloat(apiResult.data.lat) : undefined,
          lng: apiResult.data ? parseFloat(apiResult.data.lon) : undefined, // แปลง lon เป็น lng
          message: apiResult.message
        };
        
        setResult(formattedData);
        
        if (formattedData.found) {
          setShowPopup(true); // แสดง Popup แจ้งเตือนเมื่อเจอข้อมูล
          if (formattedData.lat && formattedData.lng) {
            initMap(formattedData.lat, formattedData.lng);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดบางอย่าง');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับสร้างและแสดงแผนที่
  const initMap = (lat: number, lng: number) => {
    // ตรวจสอบว่ามีไลบรารี sphere โหลดมาหรือยัง
    if (typeof window !== 'undefined' && (window as any).sphere) {
      setTimeout(() => {
        if (mapRef.current) {
          // ล้างแผนที่เก่าถ้ามี
          mapRef.current.innerHTML = '';
          
          // สร้างแผนที่ใหม่
          const map = new (window as any).sphere.Map({
            placeholder: mapRef.current,
            center: { lon: lng, lat: lat },
            zoom: 14
          });

          // สร้าง Marker ปักหมุด
          new (window as any).sphere.Marker({ lon: lng, lat: lat }, {
            title: 'จุดที่พบยานพาหนะ',
            detail: `พิกัด: ${lat}, ${lng}`
          }).addTo(map);

          mapInstanceRef.current = map;
        }
      }, 100); // รอให้ DOM render เสร็จ
    } else {
      console.warn('Sphere map library is not loaded yet.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20">
              <Car className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">ระบบตรวจสอบยานพาหนะ</h1>
            <p className="text-slate-400 text-sm mt-2 font-medium">ตรวจสอบประวัติการผ่านด่านแบบเรียลไทม์</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 md:p-8">
          <form onSubmit={handleCheck} className="space-y-5">
            <div>
              <label htmlFor="plate" className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                ป้ายทะเบียนรถ
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="plate"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  placeholder="เช่น กท 1234"
                  className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all font-medium text-lg"
                />
                <div className="absolute right-3 top-3.5 w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                  <Search className="text-slate-500 w-4 h-4" />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-100">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-xl transition-all disabled:opacity-70 flex justify-center items-center gap-2 shadow-sm hover:shadow-md"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังตรวจสอบ...</span>
                </>
              ) : (
                <span>ตรวจสอบข้อมูล</span>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div className="border-t border-slate-100 bg-slate-50/50 p-6 md:p-8">
            {result.found ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start gap-4 bg-red-50 border border-red-200 p-5 rounded-2xl text-red-800 shadow-sm">
                  <div className="bg-red-100 p-2 rounded-full shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">แจ้งเตือน! พบข้อมูล</h3>
                    <p className="text-sm mt-1 text-red-700/80 font-medium">{result.message || 'เคยผ่านด่าน A'}</p>
                  </div>
                </div>

                {/* Map Container */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>ตำแหน่งที่พบ (Sphere Map)</span>
                  </div>
                  <div 
                    ref={mapRef} 
                    className="w-full h-64 bg-slate-200 rounded-2xl border border-slate-300 overflow-hidden relative shadow-inner"
                  >
                    {/* Placeholder when map is not loaded */}
                    {(!mapInstanceRef.current && SPHERE_API_KEY === 'ใส่ API Key ที่นี่') && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-sm p-6 text-center bg-slate-100">
                        <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-3">
                          <MapPin className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="font-medium text-slate-600">กรุณาใส่ SPHERE_API_KEY ในโค้ด<br/>เพื่อแสดงแผนที่ GISTDA</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4 bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-emerald-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-emerald-100 p-2 rounded-full shrink-0">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">ปลอดภัย</h3>
                  <p className="text-sm mt-1 text-emerald-700/80 font-medium">{result.message || 'ไม่พบประวัติการผ่านด่าน A'}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Popup Alert Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mx-auto mb-6 border-8 border-red-50/50">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-center text-slate-900 mb-3">แจ้งเตือนยานพาหนะ!</h3>
            <div className="text-center text-slate-600 mb-8 space-y-2">
              <p>ตรวจพบรถทะเบียน</p>
              <div className="inline-block px-4 py-2 bg-slate-100 rounded-lg font-mono font-bold text-lg text-slate-900 border border-slate-200">
                {plate}
              </div>
              <p className="font-medium text-red-600 mt-2">{result?.message || 'เคยผ่านด่าน A'}</p>
            </div>
            <button 
              onClick={() => setShowPopup(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              รับทราบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

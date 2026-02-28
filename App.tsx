import React, { useState, useEffect, useRef } from 'react';
import { Search, AlertCircle, MapPin, CheckCircle, Car, LogOut, Sun, Moon, X } from 'lucide-react';
import Login from './components/Login';

// ==========================================
// การตั้งค่า (Configuration)
// ==========================================
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwd0Wt66cnmx2L0R6Qh7frLYbR5ujY7Hi5h3gJkS8HzrsKFSpI8GB4Y9eb4aHFGsBE8/exec';
const SPHERE_API_KEY = 'EDB31CA9C8A944F59D3021B1F0B565C0';

const PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี", "เบตง"
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [platePrefix, setPlatePrefix] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [plateProvince, setPlateProvince] = useState('กรุงเทพมหานคร');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ 
    found: boolean; 
    lat?: number; 
    lng?: number; 
    locations?: { lat: number; lng: number; name?: string }[];
    message?: string 
  } | null>(null);
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // 0. จัดการ Theme (Light/Dark Mode)
  useEffect(() => {
    // เช็คค่าเริ่มต้นจากระบบของผู้ใช้
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // 1. โหลด Script ของ Sphere Map เมื่อ Component ถูก Mount (และต้อง Login แล้ว)
  useEffect(() => {
    if (!isAuthenticated) return;

    if (SPHERE_API_KEY === 'ใส่ API Key ที่นี่') {
      console.warn('กรุณาใส่ SPHERE_API_KEY เพื่อใช้งานแผนที่');
      return;
    }

    if (typeof window !== 'undefined' && (window as any).sphere) {
      setIsMapLoaded(true);
      return;
    }

    const scriptId = 'sphere-map-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://api.sphere.gistda.or.th/map/?key=${SPHERE_API_KEY}`;
      script.async = true;
      script.onload = () => {
        console.log('Sphere Map Script Loaded');
        setIsMapLoaded(true);
      };
      document.head.appendChild(script);
    }
  }, [isAuthenticated]);

  // 2. useEffect สำหรับสร้างแผนที่ "หลังจาก" ที่หน้าจอวาดกล่องผลลัพธ์เสร็จแล้ว
  useEffect(() => {
    if (isMapLoaded && result && result.found) {
      if (result.locations && result.locations.length > 0) {
        initMap(result.locations);
      } else if (result.lat !== undefined && result.lng !== undefined) {
        initMap([{ lat: result.lat, lng: result.lng, name: 'จุดที่พบยานพาหนะ' }]);
      }
    }
  }, [result, isMapLoaded]);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platePrefix.trim() || !plateNumber.trim() || !plateProvince) {
      setError('กรุณากรอกข้อมูลป้ายทะเบียนให้ครบถ้วน');
      return;
    }

    // ลบช่องว่างและขีดออกทั้งหมด เพื่อให้รูปแบบเป็นมาตรฐานเดียวกัน
    const cleanPrefix = platePrefix.replace(/[\s-]/g, '');
    const cleanNumber = plateNumber.replace(/[\s-]/g, '');
    
    // รวมเป็นข้อความเดียว (เช่น "1กท 1234 กรุงเทพมหานคร")
    // ปรับแก้รูปแบบการเว้นวรรคให้ตรงกับที่บันทึกใน Google Sheet ของคุณ
    const combinedPlate = `${cleanPrefix} ${cleanNumber} ${plateProvince}`;

    setError('');
    setLoading(true);
    setResult(null);
    setShowPopup(false);
    mapInstanceRef.current = null; // รีเซ็ต instance แผนที่เมื่อค้นหาใหม่

    try {
      if (GAS_URL === 'ใส่ URL ของคุณที่นี่') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const isFound = Math.random() > 0.5;
        if (isFound) {
          const mockData = {
            found: true,
            locations: [
              { lat: 13.7563, lng: 100.5018, name: 'ด่าน A (จุดเริ่มต้น)' },
              { lat: 13.7650, lng: 100.5300, name: 'ด่าน B (จุดผ่าน)' },
              { lat: 13.7400, lng: 100.5500, name: 'ด่าน C (จุดล่าสุด)' }
            ],
            message: 'เคยผ่านด่าน A, B, C'
          };
          setResult(mockData);
          setShowPopup(true);
        } else {
          setResult({ found: false, message: 'ไม่พบประวัติการผ่านด่าน A' });
        }
      } else {
        // การเรียก API จริง (ส่งข้อมูลที่จัดรูปแบบแล้วไป)
        const response = await fetch(`${GAS_URL}?plate=${encodeURIComponent(combinedPlate)}`);
        if (!response.ok) throw new Error('เกิดข้อผิดพลาดในการเชื่อมต่อ API');
        
        const apiResult = await response.json();
        
        // แปลงข้อมูลจาก GAS ให้ตรงกับรูปแบบที่แอปหน้าเว็บเข้าใจ
        // รองรับทั้งแบบจุดเดียว (lat, lon) และแบบหลายจุด (locations: [{lat, lon, name}])
        const formattedData = {
          found: apiResult.status === 'success',
          lat: apiResult.data ? parseFloat(apiResult.data.lat) : undefined,
          lng: apiResult.data ? parseFloat(apiResult.data.lon) : undefined, 
          locations: apiResult.data && apiResult.data.locations ? apiResult.data.locations.map((loc: any) => ({
            lat: parseFloat(loc.lat),
            lng: parseFloat(loc.lon || loc.lng),
            name: loc.name
          })) : undefined,
          message: apiResult.message
        };
        
        setResult(formattedData);
        
        if (formattedData.found) {
          setShowPopup(true); 
          // เราลบ initMap() ออกจากตรงนี้ แล้วให้ useEffect ตัวที่ 2 ทำงานแทน เพื่อป้องกันปัญหา DOM ไม่พร้อม
        } else {
          // เคลียร์แผนที่ถ้าไม่พบข้อมูล
          if (mapRef.current) mapRef.current.innerHTML = '';
        }
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดบางอย่าง');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับสร้างและแสดงแผนที่
  const initMap = (locations: { lat: number; lng: number; name?: string }[]) => {
    if (typeof window !== 'undefined' && (window as any).sphere) {
      // ใช้ setTimeout เพื่อหน่วงเวลาให้ HTML Render กล่องแผนที่เสร็จสมบูรณ์ 100%
      setTimeout(() => {
        if (mapRef.current) {
          // ล้างแผนที่เก่าถ้ามี
          mapRef.current.innerHTML = '';
          
          // สร้างแผนที่ใหม่ตาม Document (ต้องส่ง DOM element เข้าไปใน placeholder)
          const map = new (window as any).sphere.Map({
            placeholder: mapRef.current
          });

          // ต้องรอให้แผนที่ Ready ก่อนถึงจะสั่ง location, zoom และปักหมุดได้
          map.Event.bind((window as any).sphere.EventName.Ready, () => {
            
            if (locations.length === 1) {
              // กรณีมีจุดเดียว ให้ปักหมุดปกติ
              const loc = locations[0];
              map.location({ lon: loc.lng, lat: loc.lat });
              map.zoom(14);

              const marker = new (window as any).sphere.Marker(
                { lon: loc.lng, lat: loc.lat }, 
                { title: loc.name || 'จุดที่พบยานพาหนะ', detail: `พิกัด: ${loc.lat}, ${loc.lng}` }
              );
              map.Overlays.add(marker);
            } else if (locations.length > 1) {
              // กรณีมีหลายจุด ให้วาดเส้นทาง (Routing)
              
              // ตั้งศูนย์กลางแผนที่ไปที่จุดแรก
              map.location({ lon: locations[0].lng, lat: locations[0].lat });
              map.zoom(12);

              // เพิ่มจุดทั้งหมดลงในเส้นทาง
              locations.forEach((loc, index) => {
                map.Route.add({ lat: loc.lat, lon: loc.lng });
                
                // ปักหมุดแต่ละจุดด้วย เพื่อให้เห็นชัดเจน
                const marker = new (window as any).sphere.Marker(
                  { lon: loc.lng, lat: loc.lat }, 
                  { title: loc.name || `จุดที่ ${index + 1}`, detail: `พิกัด: ${loc.lat}, ${loc.lng}` }
                );
                map.Overlays.add(marker);
              });

              // สั่งค้นหาและวาดเส้นทาง
              map.Route.search();
            }
          });

          mapInstanceRef.current = map;
        } else {
          console.error("หาพื้นที่แสดงแผนที่ไม่พบ (mapRef is null)");
        }
      }, 100); // ลดเวลาหน่วงลงเพราะเรามี isMapLoaded ช่วยตรวจสอบแล้ว
    } else {
      console.warn('Sphere map library is not loaded yet.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPlatePrefix('');
    setPlateNumber('');
    setPlateProvince('กรุงเทพมหานคร');
    setResult(null);
    setError('');
  };

  // หากยังไม่ได้ Login ให้แสดงหน้า Login
  if (!isAuthenticated) {
    return <Login onLogin={setIsAuthenticated} />;
  }

  // หาก Login แล้ว ให้แสดงหน้าหลัก
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300 flex flex-col">
      
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">ระบบตรวจสอบยานพาหนะ</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Vehicle Tracking System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={isDarkMode ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg transition-colors"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form & Status */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Form Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <Search className="w-5 h-5 text-indigo-500" />
                  ค้นหาข้อมูลรถ
                </h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleCheck} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="platePrefix" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                        หมวดอักษร
                      </label>
                      <input
                        type="text"
                        id="platePrefix"
                        value={platePrefix}
                        onChange={(e) => setPlatePrefix(e.target.value)}
                        placeholder="เช่น 1กท, กข"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all font-medium text-center text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="plateNumber" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                        หมายเลข
                      </label>
                      <input
                        type="text"
                        id="plateNumber"
                        value={plateNumber}
                        onChange={(e) => setPlateNumber(e.target.value)}
                        placeholder="เช่น 1234"
                        maxLength={4}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all font-medium text-center text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="plateProvince" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                      จังหวัด
                    </label>
                    <select
                      id="plateProvince"
                      value={plateProvince}
                      onChange={(e) => setPlateProvince(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all font-medium text-slate-900 dark:text-white"
                    >
                      {PROVINCES.map(province => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                    </select>
                  </div>

                  {error && (
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span className="font-medium">{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-70 flex justify-center items-center gap-2 shadow-md hover:shadow-lg"
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
            </div>

            {/* Result Card */}
            {result && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    {result.found ? <AlertCircle className="w-5 h-5 text-red-500" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
                    ผลการตรวจสอบ
                  </h2>
                </div>
                <div className="p-6">
                  {result.found ? (
                    <div className="flex items-start gap-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 p-5 rounded-2xl text-red-800 dark:text-red-300 shadow-sm">
                      <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-full shrink-0">
                        <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">แจ้งเตือน! พบข้อมูล</h3>
                        <p className="text-sm mt-1 text-red-700/80 dark:text-red-300/80 font-medium">{result.message || 'เคยผ่านด่าน A'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 p-5 rounded-2xl text-emerald-800 dark:text-emerald-300 shadow-sm">
                      <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-full shrink-0">
                        <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">ปลอดภัย</h3>
                        <p className="text-sm mt-1 text-emerald-700/80 dark:text-emerald-300/80 font-medium">{result.message || 'ไม่พบประวัติการผ่านด่าน A'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Map */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-[500px] lg:h-[calc(100vh-10rem)] min-h-[500px] flex flex-col relative">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between z-20">
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <MapPin className="w-5 h-5 text-indigo-500" />
                  แผนที่เส้นทาง (Sphere Map)
                </h2>
                {result?.found && (
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded-full animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Live Tracking
                  </span>
                )}
              </div>
              
              <div className="flex-1 relative bg-slate-100 dark:bg-slate-800/50">
                {/* Placeholder (อยู่ด้านหลังแผนที่เสมอ) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-sm p-6 text-center z-0">
                  <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="font-medium text-slate-600 dark:text-slate-300 text-base">รอการค้นหาข้อมูลเพื่อแสดงแผนที่...</p>
                  <p className="text-slate-400 dark:text-slate-500 mt-2">กรุณากรอกป้ายทะเบียนทางด้านซ้าย</p>
                </div>
                
                {/* พื้นที่สำหรับวาดแผนที่ */}
                <div className="absolute inset-0 z-10">
                  <div id="sphere-map-container" ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Popup Alert Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Background */}
            <div className="h-32 bg-gradient-to-br from-red-500 to-red-600 dark:from-red-900/80 dark:to-red-950 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center p-1.5">
                <div className="w-full h-full rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border-4 border-red-100 dark:border-red-900/50 animate-ping opacity-20"></div>
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-500 relative z-10" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="pt-14 pb-8 px-8">
              <h3 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2 tracking-tight">แจ้งเตือนยานพาหนะ!</h3>
              <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6">ระบบตรวจพบประวัติการเดินทางที่ต้องสงสัย</p>
              
              <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 mb-8">
                <div className="text-center space-y-3">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ทะเบียนรถที่ตรวจพบ</p>
                  <div className="inline-block px-4 py-2 bg-white dark:bg-slate-800 rounded-xl font-mono font-bold text-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm">
                    {`${platePrefix.replace(/[\s-]/g, '')} ${plateNumber.replace(/[\s-]/g, '')} ${plateProvince}`}
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800">
                    <p className="font-medium text-red-600 dark:text-red-400 text-sm">{result?.message || 'เคยผ่านด่าน A'}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowPopup(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold py-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>รับทราบข้อมูล</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

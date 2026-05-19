/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  Cpu,
  ClipboardCheck,
  FileText,
  BookOpen,
  Users,
  Clock,
  ThumbsUp,
  CircleDot,
  ArrowRight,
  Bell,
  Wifi,
  Thermometer,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  ExternalLink,
  Play,
  Save,
  Download,
  FileDown,
  Info,
  Menu,
  X,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// --- Constants & Types ---

type Tab = 'dashboard' | 'simulation' | 'evaluation' | 'report' | 'guide';

interface EvaluationData {
  sus: number[];
  ueq: Record<string, number>;
  heuristics: boolean[];
  comments: string;
  timestamp: string;
}

const SUS_QUESTIONS = [
  "Saya pikir saya ingin sering menggunakan sistem antrian ini.",
  "Saya menemukan sistem ini terlalu kompleks untuk digunakan.",
  "Saya pikir sistem ini mudah untuk digunakan.",
  "Saya pikir saya membutuhkan bantuan teknisi untuk menggunakan sistem ini.",
  "Saya menemukan berbagai fungsi dalam sistem ini terintegrasi dengan baik.",
  "Saya pikir ada terlalu banyak ketidakkonsistenan dalam sistem ini.",
  "Saya bayangkan kebanyakan orang akan belajar menggunakan sistem ini dengan sangat cepat.",
  "Saya menemukan sistem ini sangat rumit untuk digunakan.",
  "Saya merasa sangat percaya diri menggunakan sistem ini.",
  "Saya perlu belajar banyak hal sebelum saya bisa menggunakan sistem ini."
];

const UEQ_DIMENSIONS = [
  { key: 'attractiveness', label: 'Daya Tarik', left: 'Mengganggu', right: 'Menyenangkan' },
  { key: 'perspicuity', label: 'Keterjangkauan', left: 'Sulit dipelajari', right: 'Mudah dipelajari' },
  { key: 'efficiency', label: 'Efisiensi', left: 'Lambat', right: 'Cepat' },
  { key: 'dependability', label: 'Ketepatan', left: 'Tidak terduga', right: 'Terduga' },
  { key: 'stimulation', label: 'Stimulasi', left: 'Membosankan', right: 'Menarik' },
  { key: 'novelty', label: 'Kebaruan', left: 'Konvensional', right: 'Inovatif' }
];

const HEURISTICS = [
  "Visibility of system status",
  "Match between system and the real world",
  "User control and freedom",
  "Consistency and standards",
  "Error prevention",
  "Recognition rather than recall",
  "Flexibility and efficiency of use",
  "Aesthetic and minimalist design",
  "Help users recognize, diagnose, and recover from errors",
  "Help and documentation"
];

const ARDUINO_CODE = `/*
 * SISTEM ANTRIAN CERDAS LAYANAN PUBLIK BERBASIS IoT
 * Evaluasi User Experience - SmartQueue v1.0
 */

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

#define BTN_ANTRI     12
#define BTN_PANGGIL   13
#define LED_LOKET1    14
#define LED_LOKET2    27
#define LED_LOKET3    26
#define LED_STATUS    25
#define BUZZER        33
#define PIR_SENSOR    32

int  nomorAntrian    = 0;
int  nomorDipanggil  = 0;
int  totalPengunjung = 0;
bool pirTerdeteksi   = false;

unsigned long lastPressAntri   = 0;
unsigned long lastPressPanggil = 0;
const unsigned long DEBOUNCE_MS = 400;

byte ikonOrang[8] = {
  0b00100, 0b01110, 0b00100, 0b01110,
  0b10101, 0b00100, 0b01010, 0b10001
};

byte ikonBel[8] = {
  0b00100, 0b01110, 0b01110, 0b01110,
  0b11111, 0b00000, 0b00100, 0b00000
};

void setup() {
  Serial.begin(115200);
  Serial.println("=== SmartQueue IoT v1.0 ===");

  lcd.init();
  lcd.backlight();
  lcd.createChar(0, ikonOrang);
  lcd.createChar(1, ikonBel);

  lcd.setCursor(0, 0); lcd.print(" SmartQueue v1.0");
  lcd.setCursor(0, 1); lcd.print(" Initializing...");
  delay(1500);

  pinMode(BTN_ANTRI,   INPUT_PULLUP);
  pinMode(BTN_PANGGIL, INPUT_PULLUP);
  pinMode(LED_LOKET1,  OUTPUT);
  pinMode(LED_LOKET2,  OUTPUT);
  pinMode(LED_LOKET3,  OUTPUT);
  pinMode(LED_STATUS,  OUTPUT);
  pinMode(BUZZER,      OUTPUT);
  pinMode(PIR_SENSOR,  INPUT);

  testLED();

  digitalWrite(LED_LOKET1, HIGH);
  digitalWrite(LED_LOKET2, HIGH);
  digitalWrite(LED_LOKET3, LOW);
  digitalWrite(LED_STATUS, HIGH);

  tampilkanLayarUtama();
  bunyiStartup();
  Serial.println("Sistem siap. Tekan tombol untuk mulai.");
}

void loop() {
  unsigned long sekarang = millis();

  bool pirBaca = digitalRead(PIR_SENSOR);
  if (pirBaca && !pirTerdeteksi) {
    pirTerdeteksi = true;
    totalPengunjung++;
    Serial.print("[PIR] Pengunjung terdeteksi! Total: ");
    Serial.println(totalPengunjung);
    kedipLED(LED_STATUS, 2, 100);
  } else if (!pirBaca) {
    pirTerdeteksi = false;
  }

  if (digitalRead(BTN_ANTRI) == LOW && (sekarang - lastPressAntri > DEBOUNCE_MS)) {
    lastPressAntri = sekarang;
    nomorAntrian++;
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.write(byte(0));
    lcd.print(" Nomor Antrian:");
    lcd.setCursor(0, 1);
    lcd.print("  >>> A-");
    if (nomorAntrian < 10) lcd.print("0");
    lcd.print(nomorAntrian);
    lcd.print(" <<<");
    bunyiBeep(2, 150, 800);
    delay(2500);
    tampilkanStatusAntrian();
  }

  if (digitalRead(BTN_PANGGIL) == LOW && (sekarang - lastPressPanggil > DEBOUNCE_MS)) {
    lastPressPanggil = sekarang;
    if (nomorDipanggil < nomorAntrian) {
      nomorDipanggil++;
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.write(byte(1));
      lcd.print(" DIPANGGIL:");
      lcd.setCursor(0, 1);
      lcd.print("  >> A-");
      if (nomorDipanggil < 10) lcd.print("0");
      lcd.print(nomorDipanggil);
      lcd.print(" ke Loket ");
      int loketTujuan = (nomorDipanggil % 2) + 1;
      lcd.print(loketTujuan);
      bunyiPanggilan();
      int ledLoket = (loketTujuan == 1) ? LED_LOKET1 : LED_LOKET2;
      kedipLED(ledLoket, 5, 200);
      digitalWrite(ledLoket, HIGH);
      delay(3000);
      tampilkanStatusAntrian();
    } else {
      lcd.clear();
      lcd.setCursor(0, 0); lcd.print("  Antrian Kosong");
      lcd.setCursor(0, 1); lcd.print("  Silakan Tunggu");
      bunyiBeep(1, 100, 400);
      delay(2000);
      tampilkanStatusAntrian();
    }
  }
  delay(50);
}

void tampilkanLayarUtama() {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("Layanan Publik  ");
  lcd.setCursor(0, 1); lcd.print("Tekan utk Antri ");
}

void tampilkanStatusAntrian() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Antri:"); lcd.print(nomorAntrian);
  lcd.print(" Panggil:"); lcd.print(nomorDipanggil);
  lcd.setCursor(0, 1);
  lcd.print("Tunggu:"); lcd.print(nomorAntrian - nomorDipanggil);
  lcd.print(" Tamu:"); lcd.print(totalPengunjung);
}

void bunyiStartup() {
  int nada[]   = {523, 659, 784, 1047};
  int durasi[] = {150, 150, 150, 300};
  for (int i = 0; i < 4; i++) {
    tone(BUZZER, nada[i], durasi[i]);
    delay(durasi[i] + 50);
  }
  noTone(BUZZER);
}

void bunyiBeep(int jumlah, int durasi, int frekuensi) {
  for (int i = 0; i < jumlah; i++) {
    tone(BUZZER, frekuensi, durasi);
    delay(durasi + 80);
  }
  noTone(BUZZER);
}

void bunyiPanggilan() {
  int pola[][2] = {{880,200},{0,100},{880,200},{0,100},{1047,400}};
  for (int i = 0; i < 5; i++) {
    if (pola[i][0] > 0) tone(BUZZER, pola[i][0], pola[i][1]);
    delay(pola[i][1] + 50);
  }
  noTone(BUZZER);
}

void testLED() {
  int leds[] = {LED_LOKET1, LED_LOKET2, LED_LOKET3, LED_STATUS};
  for (int i = 0; i < 4; i++) { digitalWrite(leds[i], HIGH); delay(200); }
  delay(300);
  for (int i = 0; i < 4; i++) { digitalWrite(leds[i], LOW);  delay(100); }
}

void kedipLED(int pin, int kali, int jeda) {
  bool statusAwal = digitalRead(pin);
  for (int i = 0; i < kali; i++) {
    digitalWrite(pin, LOW);  delay(jeda);
    digitalWrite(pin, HIGH); delay(jeda);
  }
  digitalWrite(pin, statusAwal);
}`;

const DIAGRAM_JSON = {
  "version": 1,
  "author": "Evaluasi UX Layanan Publik IoT",
  "editor": "wokwi",
  "parts": [
    {
      "type": "board-esp32-devkit-v1",
      "id": "esp32",
      "top": 160,
      "left": 220,
      "attrs": {}
    },
    {
      "type": "wokwi-lcd1602",
      "id": "lcd1",
      "top": 0,
      "left": 320,
      "attrs": {
        "pins": "i2c",
        "address": "0x27",
        "background": "green",
        "color": "black"
      }
    },
    {
      "type": "wokwi-pushbutton",
      "id": "btn1",
      "top": 380,
      "left": 0,
      "attrs": {
        "color": "green",
        "label": "ANTRI"
      }
    },
    {
      "type": "wokwi-pushbutton",
      "id": "btn2",
      "top": 380,
      "left": 100,
      "attrs": {
        "color": "red",
        "label": "PANGGIL"
      }
    },
    {
      "type": "wokwi-led",
      "id": "led_green1",
      "top": 300,
      "left": 580,
      "attrs": {
        "color": "green",
        "label": "Loket 1"
      }
    },
    {
      "type": "wokwi-led",
      "id": "led_green2",
      "top": 340,
      "left": 580,
      "attrs": {
        "color": "green",
        "label": "Loket 2"
      }
    },
    {
      "type": "wokwi-led",
      "id": "led_red1",
      "top": 380,
      "left": 580,
      "attrs": {
        "color": "red",
        "label": "Loket 3"
      }
    },
    {
      "type": "wokwi-led",
      "id": "led_status",
      "top": 420,
      "left": 580,
      "attrs": {
        "color": "yellow",
        "label": "Status"
      }
    },
    {
      "type": "wokwi-buzzer",
      "id": "buzzer1",
      "top": 460,
      "left": 400,
      "attrs": {
        "volume": "0.5"
      }
    },
    {
      "type": "wokwi-pir-motion-sensor",
      "id": "pir1",
      "top": 460,
      "left": 80,
      "attrs": {}
    },
    {
      "type": "wokwi-resistor",
      "id": "r1",
      "top": 300,
      "left": 530,
      "attrs": { "value": "220" }
    },
    {
      "type": "wokwi-resistor",
      "id": "r2",
      "top": 340,
      "left": 530,
      "attrs": { "value": "220" }
    },
    {
      "type": "wokwi-resistor",
      "id": "r3",
      "top": 380,
      "left": 530,
      "attrs": { "value": "220" }
    },
    {
      "type": "wokwi-resistor",
      "id": "r4",
      "top": 420,
      "left": 530,
      "attrs": { "value": "220" }
    }
  ],
  "connections": [
    ["esp32:3V3", "lcd1:VCC", "red", ["h0"]],
    ["esp32:GND.1", "lcd1:GND", "black", ["h0"]],
    ["esp32:D21", "lcd1:SDA", "green", ["h0"]],
    ["esp32:D22", "lcd1:SCL", "blue", ["h0"]],

    ["esp32:D12", "btn1:1.l", "purple", ["h0"]],
    ["esp32:GND.2", "btn1:2.l", "black", ["h0"]],

    ["esp32:D13", "btn2:1.l", "orange", ["h0"]],
    ["esp32:GND.2", "btn2:2.l", "black", ["h0"]],

    ["esp32:D14", "r1:1", "green", ["h0"]],
    ["r1:2", "led_green1:A", "green", ["h0"]],
    ["esp32:GND.2", "led_green1:C", "black", ["h0"]],

    ["esp32:D27", "r2:1", "green", ["h0"]],
    ["r2:2", "led_green2:A", "green", ["h0"]],
    ["esp32:GND.2", "led_green2:C", "black", ["h0"]],

    ["esp32:D26", "r3:1", "red", ["h0"]],
    ["r3:2", "led_red1:A", "red", ["h0"]],
    ["esp32:GND.2", "led_red1:C", "black", ["h0"]],

    ["esp32:D25", "r4:1", "yellow", ["h0"]],
    ["r4:2", "led_status:A", "yellow", ["h0"]],
    ["esp32:GND.2", "led_status:C", "black", ["h0"]],

    ["esp32:D33", "buzzer1:1", "brown", ["h0"]],
    ["esp32:GND.2", "buzzer1:2", "black", ["h0"]],

    ["esp32:D32", "pir1:OUT", "yellow", ["h0"]],
    ["esp32:3V3", "pir1:VCC", "red", ["h0"]],
    ["esp32:GND.2", "pir1:GND", "black", ["h0"]]
  ],
  "dependencies": {}
};

// --- Components ---

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    className={`fixed bottom-8 right-8 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`}
  >
    {type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="hover:opacity-70"><X size={16} /></button>
  </motion.div>
);

const Card = ({ children, className = '', id }: { children: React.ReactNode, className?: string, id?: string }) => (
  <div id={id} className={`glass-card p-6 ${className}`}>
    {children}
  </div>
);

const NavItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
      active 
        ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`}
  >
    <Icon size={18} />
    <span className="font-medium hidden md:block">{label}</span>
  </button>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState({
    totalVisitors: 124,
    avgWaitTime: 12.5,
    satisfaction: 88,
    activeBooth: 3,
    totalBooths: 4,
    currentQueue: 47,
    eta: 15
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  // Evaluation State
  const [susScores, setSusScores] = useState<number[]>(new Array(10).fill(3));
  const [ueqScores, setUeqScores] = useState<Record<string, number>>(
    UEQ_DIMENSIONS.reduce((acc, dim) => ({ ...acc, [dim.key]: 0 }), {})
  );
  const [heuristicStatus, setHeuristicStatus] = useState<('ok' | 'warn' | 'fail' | 'na')[]>(new Array(10).fill('ok'));
  const [comments, setComments] = useState('');
  const [savedEvaluations, setSavedEvaluations] = useState<EvaluationData[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);

  // Simulation State
  const [isLobbyOpen, setIsLobbyOpen] = useState(true);
  const [pirStatus, setPirStatus] = useState(false);
  const [buzzerActive, setBuzzerActive] = useState(false);
  const [temp, setTemp] = useState(42);

  // Load Data
  useEffect(() => {
    const saved = localStorage.getItem('smartqueue_evals');
    if (saved) {
      setSavedEvaluations(JSON.parse(saved));
    }
    
    // Initial logs
    setLogs(["[SYSTEM] IoT Hub started", "[MQTT] Connected to broker", "[ESP32] Device online: A0:B1:C2..."]);
  }, []);

  // Simulation Interval for Stats
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalVisitors: prev.totalVisitors + (Math.random() > 0.8 ? 1 : 0),
        avgWaitTime: Math.max(5, prev.avgWaitTime + (Math.random() - 0.5)),
        satisfaction: Math.min(100, Math.max(70, prev.satisfaction + (Math.random() - 0.5))),
      }));
      
      const actions = ["Button Press", "PIR Detection", "Buzzer Alert", "Server Sync", "LCD Update"];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      addLog(`[IOT] ${randomAction} - ${new Date().toLocaleTimeString()}`);
      
      setTemp(prev => prev + (Math.random() - 0.5));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev.slice(0, 19)]);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const calculateSUS = (scores: number[]) => {
    let score = 0;
    scores.forEach((s, i) => {
      if (i % 2 === 0) { // Odd questions (1, 3, 5...)
        score += (s - 1);
      } else { // Even questions (2, 4, 6...)
        score += (5 - s);
      }
    });
    return score * 2.5;
  };

  const getSUSBreadcrumb = (score: number) => {
    if (score < 51) return { label: 'Tidak Dapat Diterima', color: 'text-red-500' };
    if (score < 68) return { label: 'Marginal', color: 'text-yellow-500' };
    if (score < 80.3) return { label: 'Dapat Diterima', color: 'text-green-500' };
    return { label: 'Sangat Baik / Grade A', color: 'text-blue-500' };
  };

  const saveEvaluation = () => {
    const totalSUS = calculateSUS(susScores);
    const newEval: EvaluationData = {
      sus: susScores,
      ueq: ueqScores,
      heuristics: heuristicStatus.map(s => s === 'ok'),
      comments,
      timestamp: new Date().toISOString()
    };
    
    const updated = [...savedEvaluations, newEval];
    setSavedEvaluations(updated);
    localStorage.setItem('smartqueue_evals', JSON.stringify(updated));
    showToast('Evaluasi berhasil disimpan!');
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    showToast('Menyiapkan PDF (Sanitasi Warna)...', 'success');
    
    try {
      // Tunggu render selesai
      await new Promise(resolve => setTimeout(resolve, 800));

      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        onclone: (clonedDoc) => {
          // 1. HARD PURGE: Remove all style/link tags and inject a clean hex-only stylesheet
          const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          styles.forEach(s => s.remove());

          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
            * { 
              box-sizing: border-box;
              font-family: 'Poppins', sans-serif !important;
              color-scheme: dark !important; 
              -webkit-print-color-adjust: exact !important;
            }
            body { background-color: #0f172a !important; color: #e2e8f0 !important; margin: 0; padding: 20px; }
            #report-tab { background-color: #0f172a !important; }
            .glass-card { 
               background-color: #1e293b !important; 
               border: 1px solid #334155 !important; 
               border-radius: 12px !important;
               padding: 20px !important;
               margin-bottom: 20px !important;
               display: block !important;
            }
            .grid { display: grid !important; gap: 20px !important; }
            .grid-cols-4 { grid-template-columns: repeat(4, 1fr) !important; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr) !important; }
            .text-blue-400 { color: #60a5fa !important; }
            .text-green-500 { color: #22c55e !important; }
            .text-amber-500 { color: #f59e0b !important; }
            .text-white { color: #ffffff !important; }
            .text-gray-400 { color: #94a3b8 !important; }
            .text-4xl { font-size: 36px !important; font-weight: 800 !important; }
            .font-bold { font-weight: 700 !important; }
            table { width: 100% !important; border-collapse: collapse !important; }
            th { text-align: left !important; color: #64748b !important; border-bottom: 1px solid #334155 !important; padding: 10px 0 !important; }
            td { padding: 10px 0 !important; border-bottom: 1px solid rgba(51, 65, 85, 0.3) !important; }
          `;
          clonedDoc.head.appendChild(style);
        },
        ignoreElements: (element) => {
          return element.classList.contains('no-print');
        }
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 290), undefined, 'FAST');
      pdf.save(`SmartQueue_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('PDF berhasil diunduh');
    } catch (error) {
      console.error('PDF Export Error:', error);
      showToast('Gagal membuat PDF. Menggunakan print browser...', 'error');
      setTimeout(() => window.print(), 1000);
    }
  };

  const exportCSV = () => {
    if (savedEvaluations.length === 0) return showToast('Belum ada data untuk diekspor', 'error');
    
    const headers = ['Timestamp', 'SUS Score', ...UEQ_DIMENSIONS.map(d => d.label), 'Comments'].join(',');
    const rows = savedEvaluations.map(e => {
        const sus = calculateSUS(e.sus);
        const ueq = UEQ_DIMENSIONS.map(d => e.ueq[d.key]).join(',');
        return `${e.timestamp},${sus},${ueq},"${e.comments.replace(/"/g, '""')}"`;
    }).join('\n');
    
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmartQueue_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('File CSV berhasil diunduh');
  };

  // --- Tab Content Renderers ---

  const renderDashboard = () => {
    const lineData = {
      labels: ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
      datasets: [{
        label: 'Waktu Tunggu (menit)',
        data: [5, 12, 18, 25, 22, 15, 20, 28, 15, 8],
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.2)',
        tension: 0.4,
        fill: true,
      }]
    };

    const barData = {
      labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
      datasets: [{
        label: 'Jumlah Feedback',
        data: [2, 5, 12, 45, 60],
        backgroundColor: '#6366f1',
        borderRadius: 4,
      }]
    };

    return (
      <div id="dashboard-content" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        <Card className="flex flex-col items-center justify-center border-l-4 border-blue-500">
          <Users className="text-blue-500 mb-2" size={32} />
          <span className="text-gray-400 text-sm">Total Pengunjung</span>
          <span className="text-3xl font-bold">{stats.totalVisitors}</span>
        </Card>
        <Card className="flex flex-col items-center justify-center border-l-4 border-purple-500">
          <Clock className="text-purple-500 mb-2" size={32} />
          <span className="text-gray-400 text-sm">Rerata Tunggu</span>
          <span className="text-3xl font-bold">{stats.avgWaitTime.toFixed(1)}m</span>
        </Card>
        <Card className="flex flex-col items-center justify-center border-l-4 border-green-500">
          <ThumbsUp className="text-green-500 mb-2" size={32} />
          <span className="text-gray-400 text-sm">Kepuasan</span>
          <span className="text-3xl font-bold">{stats.satisfaction.toFixed(0)}%</span>
        </Card>
        <Card className="flex flex-col items-center justify-center border-l-4 border-amber-500">
          <CircleDot className="text-amber-500 mb-2" size={32} />
          <span className="text-gray-400 text-sm">Antrian Saat Ini</span>
          <span className="text-3xl font-bold">A-{stats.currentQueue.toString().padStart(3, '0')}</span>
        </Card>

        <Card className="md:col-span-2 lg:col-span-3">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <LayoutDashboard size={20} className="text-blue-400" /> Waktu Tunggu per Jam
          </h3>
          <div className="h-64">
            <Line data={lineData} options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }} />
          </div>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1">
          <h3 className="text-lg font-bold mb-4">Distribusi Skor</h3>
          <div className="h-64">
            <Bar data={barData} options={{ maintainAspectRatio: false }} />
          </div>
        </Card>

        <Card className="lg:col-span-4 bg-black/40 border-none">
          <h3 className="text-sm font-mono text-blue-400 mb-2 uppercase tracking-wider">Live IoT Feed</h3>
          <div className="font-mono text-xs h-32 overflow-y-auto space-y-1 custom-scrollbar">
            {logs.map((log, i) => (
              <div key={i} className="text-gray-400 hover:text-blue-300 transition-colors">
                <span className="text-gray-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                {log}
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const renderSimulation = () => {
    return (
      <div id="simulation-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        {/* Wokwi Embed Column */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="glass-card overflow-hidden h-[500px] relative">
            <iframe
              src="https://wokwi.com/projects/464408157801932801"
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              allow="serial"
              title="Wokwi IoT Simulator"
            ></iframe>
          </div>
          <div className="flex flex-wrap gap-4">
            <a 
              href="https://wokwi.com/projects/464408157801932801" 
              target="_blank" 
              rel="noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 font-medium transition-all"
            >
              <ExternalLink size={18} /> Buka di Wokwi
            </a>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(ARDUINO_CODE);
                showToast('Kode Arduino disalin ke clipboard!');
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 font-medium transition-all"
            >
              <Copy size={18} /> Salin Kode Arduino
            </button>
            <button 
              onClick={() => {
                showToast('Menyiapkan simulator Wokwi...','success');
                window.open('https://wokwi.com/projects/464408157801932801', '_blank');
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 font-medium transition-all"
            >
              <Play size={18} /> Jalankan Simulasi
            </button>
          </div>
          
          <Card className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-blue-400">
                <FileText size={20} /> Kode Arduino ESP32
              </h3>
              <span className="text-xs font-mono text-gray-500 uppercase">v1.0 Standard</span>
            </div>
            <div className="bg-black/50 p-4 rounded-lg overflow-x-auto max-h-[400px] custom-scrollbar">
              <pre className="text-xs font-mono text-blue-200">
                <code>{ARDUINO_CODE}</code>
              </pre>
            </div>
          </Card>
        </div>

        {/* Control Panel Column */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="border-t-4 border-blue-500">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Cpu className="text-blue-500" /> Panel Kontrol IoT
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button 
                onClick={() => {
                  setStats(prev => ({ ...prev, currentQueue: prev.currentQueue + 1 }));
                  addLog("[USER] Tombol antrian ditekan - A-" + (stats.currentQueue + 1));
                  setBuzzerActive(true);
                  setTimeout(() => setBuzzerActive(false), 1000);
                }}
                className="p-4 bg-surface2 hover:bg-blue-900/40 border border-border rounded-xl flex flex-col items-center gap-2 transition-all active:scale-95"
              >
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                  <Play size={24} />
                </div>
                <span className="text-sm font-semibold">Tarik Antrian</span>
              </button>
              <button 
                onClick={() => {
                   addLog("[LOKET] Memanggil nomor A-" + stats.currentQueue);
                   setBuzzerActive(true);
                   setTimeout(() => setBuzzerActive(false), 3000);
                }}
                className="p-4 bg-surface2 hover:bg-purple-900/40 border border-border rounded-xl flex flex-col items-center gap-2 transition-all active:scale-95"
              >
                 <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Bell size={24} />
                </div>
                <span className="text-sm font-semibold">Panggil Nomor</span>
              </button>
              <button 
                onClick={() => setPirStatus(!pirStatus)}
                className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all active:scale-95 ${pirStatus ? 'bg-amber-900/40 border-amber-500' : 'bg-surface2 border-border'}`}
              >
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center ${pirStatus ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  <Eye size={24} />
                </div>
                <span className="text-sm font-semibold">Deteksi PIR</span>
              </button>
              <button 
                onClick={() => setIsLobbyOpen(!isLobbyOpen)}
                className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all active:scale-95 ${isLobbyOpen ? 'bg-green-900/40 border-green-500' : 'bg-red-900/40 border-red-500'}`}
              >
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isLobbyOpen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  <CircleDot size={24} />
                </div>
                <span className="text-sm font-semibold">{isLobbyOpen ? 'Buka Loket' : 'Tutup Loket'}</span>
              </button>
            </div>

            <div className="lcd-display mb-6">
              <div className="flex justify-between text-[10px] mb-1 opacity-60">
                <span>SmartQueue v1.0</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="text-sm md:text-base tracking-widest font-mono">
                No. Antrian: A-{stats.currentQueue.toString().padStart(3, '0')}
              </div>
              <div className="text-sm md:text-base tracking-widest font-mono mt-1">
                Loket: {stats.activeBooth} Tunggu: {stats.eta}m
              </div>
            </div>

            <div className="space-y-3">
               <div className="flex items-center justify-between text-sm p-3 bg-black/20 rounded-lg">
                 <div className="flex items-center gap-2">
                   <div className={`w-3 h-3 rounded-full ${isLobbyOpen ? 'bg-green-500 led-active' : 'bg-red-500'}`}></div>
                   <span>LED Status: {isLobbyOpen ? 'OPERASIONAL' : 'KANTOR TUTUP'}</span>
                 </div>
                 <span className="text-xs font-mono text-gray-500">D14/D27</span>
               </div>
               <div className="flex items-center justify-between text-sm p-3 bg-black/20 rounded-lg">
                 <div className="flex items-center gap-2">
                   <Bell size={16} className={buzzerActive ? 'text-amber-500 animate-bounce' : 'text-gray-500'} />
                   <span>Buzzer: <span className={buzzerActive ? 'text-amber-400 font-bold' : 'text-gray-500'}>{buzzerActive ? 'AKTIF' : 'IDLE'}</span></span>
                 </div>
                 <span className="text-xs font-mono text-gray-500">D26</span>
               </div>
               <div className="flex items-center justify-between text-sm p-3 bg-black/20 rounded-lg">
                 <div className="flex items-center gap-2">
                   <Eye size={16} className={pirStatus ? 'text-blue-500' : 'text-gray-500'} />
                   <span>PIR Sensor: <span className={pirStatus ? 'text-blue-400 font-bold' : 'text-gray-500'}>{pirStatus ? 'TERDETEKSI' : 'TIDAK ADA ORANG'}</span></span>
                 </div>
                 <span className="text-xs font-mono text-gray-500">D25</span>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div className="flex items-center justify-between text-xs p-3 bg-black/20 rounded-lg">
                   <div className="flex items-center gap-2">
                     <Wifi size={14} className="text-green-500" />
                     <span>WiFi: -67 dBm</span>
                   </div>
                 </div>
                 <div className="flex items-center justify-between text-xs p-3 bg-black/20 rounded-lg">
                   <div className="flex items-center gap-2">
                     <Thermometer size={14} className="text-amber-500" />
                     <span>ESP32: {temp.toFixed(1)}°C</span>
                   </div>
                 </div>
               </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderEvaluation = () => {
    return (
      <div id="evaluation-tab" className="p-6 space-y-8 max-w-4xl mx-auto">
        <header className="text-center space-y-2">
           <h2 className="text-3xl font-bold">Evaluasi User Experience</h2>
           <p className="text-gray-400">Gunakan form ini untuk memberikan feedback mendalam setelah mencoba simulator.</p>
        </header>

        {/* Section A: SUS */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <span className="font-bold text-lg">A</span>
            </div>
            <div>
              <h3 className="text-xl font-bold">System Usability Scale (SUS)</h3>
              <p className="text-sm text-gray-400">Evaluasi usabilitas sistem (10 Pertanyaan standar)</p>
            </div>
          </div>

          <div className="space-y-6">
            {SUS_QUESTIONS.map((q, idx) => (
              <div key={idx} className="space-y-3 p-4 bg-black/20 rounded-lg">
                <p className="text-sm leading-relaxed"><span className="text-gray-500 mr-2">{idx + 1}.</span> {q}</p>
                <div className="flex items-center justify-between gap-2 max-w-md">
                   <span className="text-[10px] uppercase tracking-wider text-red-500">Sangat Tidak Setuju</span>
                   <div className="flex gap-4">
                     {[1, 2, 3, 4, 5].map(val => (
                       <label key={val} className="flex flex-col items-center gap-1 cursor-pointer">
                         <input 
                           type="radio" 
                           name={`sus-${idx}`} 
                           value={val} 
                           checked={susScores[idx] === val}
                           onChange={() => {
                             const newScores = [...susScores];
                             newScores[idx] = val;
                             setSusScores(newScores);
                           }}
                           className="w-5 h-5 accent-blue-500 cursor-pointer"
                         />
                         <span className="text-xs text-gray-500">{val}</span>
                       </label>
                     ))}
                   </div>
                   <span className="text-[10px] uppercase tracking-wider text-green-500">Sangat Setuju</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="text-center md:text-left">
               <span className="text-sm text-gray-400 uppercase tracking-widest">Estimasi Skor SUS</span>
               <div className="flex items-baseline gap-2">
                 <span className="text-5xl font-black text-blue-400">{calculateSUS(susScores).toFixed(1)}</span>
                 <span className="text-sm text-gray-500">/ 100</span>
               </div>
             </div>
             <div className={`px-4 py-2 rounded-full border border-current font-bold ${getSUSBreadcrumb(calculateSUS(susScores)).color}`}>
                {getSUSBreadcrumb(calculateSUS(susScores)).label}
             </div>
          </div>
        </Card>

        {/* Section B: UEQ */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
              <span className="font-bold text-lg">B</span>
            </div>
            <div>
              <h3 className="text-xl font-bold">User Experience Questionnaire (UEQ)</h3>
              <p className="text-sm text-gray-400">Skala semantik diferensial (6 Dimensi utama)</p>
            </div>
          </div>

          <div className="space-y-8">
            {UEQ_DIMENSIONS.map((dim, idx) => (
              <div key={idx} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-purple-300">{dim.label}</h4>
                  <span className={`text-xs px-2 py-1 rounded bg-black/30 font-mono ${ueqScores[dim.key] > 0 ? 'text-green-400' : ueqScores[dim.key] < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {ueqScores[dim.key] > 0 ? '+' : ''}{ueqScores[dim.key]}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                   <span className="text-xs text-gray-500 w-24 text-right">{dim.left}</span>
                   <input 
                      type="range" 
                      min="-3" 
                      max="3" 
                      step="1" 
                      value={ueqScores[dim.key]}
                      onChange={(e) => setUeqScores({ ...ueqScores, [dim.key]: parseInt(e.target.value) })}
                      className="flex-1 accent-purple-500 cursor-pointer h-1.5 bg-gray-700 rounded-lg appearance-none"
                   />
                   <span className="text-xs text-gray-500 w-24">{dim.right}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Section C: Heuristics */}
        <Card>
           <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
              <span className="font-bold text-lg">C</span>
            </div>
            <div>
              <h3 className="text-xl font-bold">Nielsen Heuristics Evaluation</h3>
              <p className="text-sm text-gray-400">Observasi terhadap 10 prinsip utama usability</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HEURISTICS.map((h, idx) => (
              <div key={idx} className="p-3 bg-black/20 rounded-lg border border-border/50 space-y-2">
                <div className="text-sm font-medium">{idx + 1}. {h}</div>
                <div className="flex gap-2">
                  {[
                    { val: 'ok', icon: CheckCircle2, label: 'OK', color: 'text-green-500' },
                    { val: 'warn', icon: AlertTriangle, label: 'Partial', color: 'text-amber-500' },
                    { val: 'fail', icon: XCircle, label: 'Fail', color: 'text-red-500' },
                    { val: 'na', icon: CircleDot, label: 'N/A', color: 'text-gray-500' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => {
                        const next = [...heuristicStatus];
                        next[idx] = opt.val as any;
                        setHeuristicStatus(next);
                      }}
                      className={`flex-1 flex flex-col items-center gap-1 p-2 rounded transition-all border ${
                        heuristicStatus[idx] === opt.val 
                          ? 'bg-white/10 border-white/20' 
                          : 'border-transparent opacity-40 hover:opacity-100'
                      }`}
                    >
                      <opt.icon size={16} className={opt.color} />
                      <span className="text-[10px]">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold mb-4">Masukan Kualitatif</h3>
          <textarea 
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full h-32 bg-black/20 border border-border rounded-lg p-4 font-sans text-sm resize-none focus:outline-none focus:border-blue-500"
            placeholder="Tuliskan kendala atau saran perbaikan di sini..."
          ></textarea>
        </Card>

        <div className="flex justify-center pt-4">
          <button 
            onClick={saveEvaluation}
            className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full font-bold shadow-xl flex items-center gap-3 transition-transform active:scale-95"
          >
            <Save size={20} /> Simpan & Analisis Evaluasi
          </button>
        </div>
      </div>
    );
  };

  const renderReport = () => {
    const avgSUS = savedEvaluations.length > 0 
      ? savedEvaluations.reduce((acc, e) => acc + calculateSUS(e.sus), 0) / savedEvaluations.length
      : 74.5;
    
    const radarData = {
      labels: UEQ_DIMENSIONS.map(d => d.label),
      datasets: [{
        label: 'Profil UEQ (Rata-rata)',
        data: UEQ_DIMENSIONS.map(d => {
          if (savedEvaluations.length === 0) return 0;
          return savedEvaluations.reduce((acc, e) => acc + e.ueq[d.key], 0) / savedEvaluations.length;
        }),
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: '#6366f1',
        pointBackgroundColor: '#6366f1',
      }]
    };

    return (
      <div id="report-tab" ref={reportRef} className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="text-blue-400" /> Ringkasan Laporan UX
            </h2>
            <p className="text-gray-400 text-sm">Data agregat dari {savedEvaluations.length || 1} sesi evaluasi</p>
          </div>
          <div className="flex gap-2 no-print">
            <button 
              onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-primary-hex hover:opacity-90 rounded-lg text-sm transition-all"
            >
              <Download size={16} /> Export PDF
            </button>
            <button 
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-surface2 hover:bg-gray-700 rounded-lg text-sm transition-all"
            >
              <FileDown size={16} /> Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Skor SUS Rata-rata</div>
            <div className={`text-4xl font-black ${getSUSBreadcrumb(avgSUS).color}`}>{avgSUS.toFixed(1)}</div>
            <div className="text-[10px] mt-2 opacity-60">Status: {getSUSBreadcrumb(avgSUS).label}</div>
          </Card>
          <Card className="text-center">
             <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total Responden</div>
             <div className="text-4xl font-black text-white">{savedEvaluations.length || 0}</div>
             <div className="text-[10px] mt-2 opacity-60">Aktif hari ini</div>
          </Card>
          <Card className="text-center">
             <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">IoT Uptime</div>
             <div className="text-4xl font-black text-green-500">99.8%</div>
             <div className="text-[10px] mt-2 opacity-60">Reliability Rate</div>
          </Card>
          <Card className="text-center">
             <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Rekomendasi</div>
             <div className="text-4xl font-black text-amber-500">ITR-2</div>
             <div className="text-[10px] mt-2 opacity-60">Iterasi Desain Lanjut</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <Card>
             <h3 className="text-lg font-bold mb-6">Visualisasi Dimensi UEQ</h3>
             <div className="h-[400px]">
               <Radar 
                 data={radarData} 
                 options={{ 
                   scales: { 
                     r: { 
                       min: -3, max: 3,
                       ticks: { display: false },
                       grid: { color: 'rgba(255,255,255,0.1)' },
                       angleLines: { color: 'rgba(255,255,255,0.1)' },
                       pointLabels: { color: '#94a3b8', font: { size: 10 } }
                     } 
                   },
                   plugins: { legend: { display: false } }
                 }} 
               />
             </div>
           </Card>

           <Card>
             <h3 className="text-lg font-bold mb-4">Matriks Temuan UX</h3>
             <div className="overflow-x-auto text-xs">
               <table className="w-full">
                 <thead>
                   <tr className="border-b border-border text-gray-500">
                     <th className="text-left py-3 px-2 font-medium">Temuan</th>
                     <th className="text-left py-3 px-2 font-medium">Severity</th>
                     <th className="text-left py-3 px-2 font-medium">Prioritas</th>
                     <th className="text-left py-3 px-2 font-medium">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border/30">
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-2">Buzzer kurang keras pada speaker simulasi</td>
                      <td className="py-4 px-2"><span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500">Medium</span></td>
                      <td className="py-4 px-2">Low</td>
                      <td className="py-4 px-2 text-gray-500 italic">Terjadwal</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-2">Nomor antrian tidak sinkron saat WiFi mati</td>
                      <td className="py-4 px-2"><span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-500">Critical</span></td>
                      <td className="py-4 px-2">High</td>
                      <td className="py-4 px-2 text-green-500">Selesai</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-2">LCD display butuh backlight lebih terang</td>
                      <td className="py-4 px-2"><span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500">Minor</span></td>
                      <td className="py-4 px-2">Medium</td>
                      <td className="py-4 px-2 text-amber-500 font-medium">Fixing</td>
                    </tr>
                 </tbody>
               </table>
             </div>
             
             <div className="mt-8 space-y-4">
               <h4 className="text-sm font-bold uppercase tracking-widest text-blue-400">Rekomendasi Utama</h4>
               <ul className="space-y-2 text-sm text-gray-400">
                 <li className="flex items-start gap-2">
                   <ArrowRight size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                   Implementasi Local Storage pada ESP32 untuk cadangan saat offline.
                 </li>
                 <li className="flex items-start gap-2">
                   <ArrowRight size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                   Perbaikan visual nomor antrian pada LCD agar lebih scannable dari jarak 5 meter.
                 </li>
                 <li className="flex items-start gap-2">
                   <ArrowRight size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                   Integrasi feedback langsung via tombol kepuasan fisik di samping booth.
                 </li>
               </ul>
             </div>
           </Card>
        </div>
      </div>
    );
  };

  const renderGuide = () => {
    return (
      <div id="guide-tab" className="p-6 max-w-4xl mx-auto space-y-8">
        <header className="text-center mb-8">
          <h2 className="text-3xl font-bold">Panduan Penggunaan</h2>
          <p className="text-gray-400">Pelajari cara kerja sistem SmartQueue dan metodologi evaluasi UX</p>
        </header>

        <Card>
           <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
             <Info className="text-blue-400" /> Tentang SmartQueue
           </h3>
           <p className="text-sm text-gray-400 leading-relaxed">
             SmartQueue adalah sistem antrian cerdas berbasis IoT yang dirancang untuk kantor pelayanan publik. 
             Sistem ini mengintegrasikan perangkat keras (ESP32) dengan database cloud untuk manajemen antrian yang transparan dan efisien.
           </p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card>
             <h4 className="font-bold flex items-center gap-2 mb-3">
               <CheckCircle2 size={18} className="text-green-500" /> SUS Methodology
             </h4>
             <p className="text-xs text-gray-400 leading-relaxed">
               System Usability Scale (SUS) memberikan gambaran cepat tentang kemudahan penggunaan. Skor di atas 68 dianggap "Diatas rata-rata", sementara di atas 80.3 adalah "Excellent".
             </p>
           </Card>
           <Card>
             <h4 className="font-bold flex items-center gap-2 mb-3">
               <CheckCircle2 size={18} className="text-purple-500" /> UEQ Scales
             </h4>
             <p className="text-xs text-gray-400 leading-relaxed">
               User Experience Questionnaire (UEQ) mengukur aspek hedonik dan pragmatis dari pengalaman pengguna, mulai dari kebaruan hingga efisiensi.
             </p>
           </Card>
        </div>

        <Card>
           <h3 className="text-lg font-bold mb-4">Integrasi Wokwi Real</h3>
           <div className="bg-black/40 p-4 rounded-lg font-mono text-xs space-y-4">
             <div>
               <p className="text-blue-400 mb-1">// 1. Hubungkan Pin ke ESP32</p>
               <p className="text-gray-400">Ikuti diagram.json berikut untuk menyusun sirkuit fisik atau di Wokwi.</p>
             </div>
             <pre className="text-[10px] text-gray-500 border border-border/30 p-3 rounded overflow-hidden">
               {JSON.stringify(DIAGRAM_JSON, null, 2)}
             </pre>
             <div>
               <p className="text-blue-400 mb-1">// 2. Konfigurasi Endpoint API</p>
               <p className="text-gray-400">Ganti serverURL dengan URL aplikasi ini (/api/queue) untuk sinkronisasi data real-time.</p>
             </div>
           </div>
        </Card>

        <footer className="text-center pt-8 border-t border-border">
           <p className="text-xs text-gray-500">SmartQueue UX Evaluator v1.0.0 &copy; 2024</p>
           <p className="text-[10px] text-gray-600 mt-1 italic italic flex items-center justify-center gap-1">
             Build with <Star size={10} /> Research Purposes Only
           </p>
        </footer>
      </div>
    );
  };

  return (
    <div id="main-app" className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="glass-card m-4 md:m-6 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)]">
            <Cpu className="text-white" size={24} />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg leading-none">SmartQueue</h1>
            <span className="text-[10px] text-blue-400 uppercase tracking-widest font-mono">UX Evaluator</span>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-4 overflow-x-auto pb-1 md:pb-0 hide-scrollbar no-scrollbar scrollbar-none">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={Cpu} label="Simulasi IoT" active={activeTab === 'simulation'} onClick={() => setActiveTab('simulation')} />
          <NavItem icon={ClipboardCheck} label="Evaluasi UX" active={activeTab === 'evaluation'} onClick={() => setActiveTab('evaluation')} />
          <NavItem icon={FileText} label="Laporan" active={activeTab === 'report'} onClick={() => setActiveTab('report')} />
          <NavItem icon={BookOpen} label="Panduan" active={activeTab === 'guide'} onClick={() => setActiveTab('guide')} />
        </div>
      </nav>

      {/* Hero Content Area */}
      <main className="flex-1 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="tab-transition"
          >
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'simulation' && renderSimulation()}
            {activeTab === 'evaluation' && renderEvaluation()}
            {activeTab === 'report' && renderReport()}
            {activeTab === 'guide' && renderGuide()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Toast & Notifications */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Global Footer */}
      <footer className="mt-auto py-6 px-4 text-center border-t border-border/30 bg-black/20 text-gray-500 text-xs md:text-sm">
        <p>Hak Cipta &copy; Kevin Ibrahimovic - 237006073 - Informatika - Universitas Siliwangi 2026</p>
      </footer>
    </div>
  );
}

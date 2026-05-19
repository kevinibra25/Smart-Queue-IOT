# SmartQueue UX Evaluator
**Sistem Evaluasi User Experience pada Layanan Publik Berbasis IoT dengan Simulator Wokwi**

🌐 **Live Demo**: [https://smartqueue-ux-evaluator-203892229419.asia-east1.run.app](https://smartqueue-ux-evaluator-203892229419.asia-east1.run.app)

SmartQueue UX Evaluator adalah platform analisis dan evaluasi pengalaman pengguna (User Experience) yang dirancang khusus untuk sistem antrean pintar berbasis IoT. Aplikasi ini memungkinkan peneliti dan pengembang untuk mengumpulkan data kualitatif dan kuantitatif dari pengguna yang berinteraksi dengan simulasi Wokwi.

## 🚀 Fitur Utama
- **Integrasi Simulator Wokwi**: Uji coba sistem IoT secara virtual dan langsung dalam platform.
- **Kuesioner UEQ (User Experience Questionnaire)**: Pengumpulan data standar industri untuk mengukur Daya Tarik, Kejelasan, Efisiensi, Ketepatan, Stimulasi, dan Kebaruan.
- **Dashboard Analitik**: Visualisasi data real-time menggunakan Radar Chart dan Statistika Deskriptif.
- **Export Laporan PDF**: Unduh hasil evaluasi dalam format PDF profesional dengan grafik yang disanitasi.
- **Tracking Status IoT**: Pantau status konektivitas simulator secara langsung.
- **Simulasi Antrean**: Tombol interaktif untuk mensimulasikan penambahan antrean dan reset sistem.

## 🛠️ Tech Stack
- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animasi**: [Motion](https://motion.dev/)
- **Grafik/Charts**: [Chart.js](https://www.chartjs.org/) & [react-chartjs-2](https://react-chartjs-2.js.org/)
- **Ikon**: [Lucide React](https://lucide.dev/)
- **Export PDF**: [html2canvas](https://html2canvas.hertzen.com/) & [jsPDF](https://rawgit.com/MrRio/jsPDF/master/docs/index.html)

## 📦 Instalasi
1. **Clone repositori:**
   ```bash
   git clone https://github.com/username/smartqueue-ux-evaluator.git
   cd smartqueue-ux-evaluator
   ```
2. **Instal dependensi:**
   ```bash
   npm install
   ```
3. **Jalankan server pengembangan:**
   ```bash
   npm run dev
   ```
4. **Buka di browser:**
   Akses `http://localhost:3000`

## 🖥️ Penggunaan
1. **Simulasi**: Gunakan panel simulator di sisi kiri untuk berinteraksi dengan perangkat IoT (via Wokwi).
2. **Evaluasi**: Pindah ke tab "Evaluasi" untuk mengisi kuesioner setelah mencoba simulasi.
3. **Analisis**: Lihat tab "Laporan" untuk melihat hasil pengolahan data dari semua responden.
4. **Unduh**: Klik "Export PDF" di tab Laporan untuk menyimpan hasil evaluasi.

## 📄 Lisensi
Proyek ini dilisensikan di bawah MIT License.

---
Dikembangkan untuk optimasi layanan publik berbasis teknologi masa depan.

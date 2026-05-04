# CertiMatch - Sistem Pencocokan Sertifikasi

**CertiMatch** adalah aplikasi berbasis web yang dirancang untuk menganalisis dan mencocokkan sertifikasi menggunakan teknik *Natural Language Processing* (NLP). Proyek ini merupakan bagian dari tugas akhir (Skripsi) oleh **Hilman Zahrawa Budiarto**.

## 🚀 Fitur Utama

- **Analisis Sertifikasi**: Mengekstrak informasi dari dokumen sertifikat (PDF) secara otomatis.
- **Matching Engine**: Mencocokkan sertifikasi dengan standar kompetensi menggunakan model NLP (Sentence Transformers).
- **Dashboard Admin**: Panel manajemen untuk mengelola data sertifikasi dan hasil analisis.
- **Dashboard User**: Antarmuka interaktif untuk melihat hasil pencocokan.

## 🛠️ Stack Teknologi

- **Frontend/Backend**: [Next.js](https://nextjs.org/) (App Router)
- **Database**: [Prisma](https://www.prisma.io/) (PostgreSQL/MySQL/SQLite)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **NLP Engine**: Python (NLTK, Scikit-learn, Sentence-Transformers)
- **PDF Processing**: pdfplumber, pdfjs-dist

## 📦 Instalasi

### 1. Clone Repository
```bash
git clone https://github.com/roqueforti/Skripsi-Hilman-Zahrawa-Budiarto.git
cd Skripsi-Hilman-Zahrawa-Budiarto
```

### 2. Install Dependency Node.js
```bash
npm install
```

### 3. Setup Lingkungan Python
Pastikan Anda memiliki Python 3.9+ terinstal.
```bash
pip install -r requirements.txt
```

Unduh data NLTK yang diperlukan:
```python
import nltk
nltk.download('stopwords')
nltk.download('punkt')
```

### 4. Setup Database
Salin `.env.example` ke `.env` dan sesuaikan URL database Anda, lalu jalankan:
```bash
npx prisma generate
npx prisma db push
```

### 5. Jalankan Aplikasi
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 📁 Struktur Proyek

- `src/app`: Routing dan halaman utama Next.js.
- `src/components`: Komponen UI reusable.
- `src/lib`: Utility functions dan konfigurasi database.
- `scripts/`: Script Python untuk analisis NLP.
- `public/uploads`: Lokasi penyimpanan file sertifikat yang diunggah.

---
**Kontak**: [Hilman Zahrawa Budiarto](https://github.com/roqueforti)

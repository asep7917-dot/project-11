// Utility functions untuk Daftar Nilai Kurikulum Merdeka
// Sesuai Panduan Pembelajaran dan Asesmen 2024

export interface Siswa {
    id: string;
    nis: string;
    nama: string;
}

// Data Formatif per siswa
export interface DataFormatif {
    siswaId: string;
    nilaiTP: number[]; // Nilai per Tujuan Pembelajaran
    catatan: string;   // Catatan/umpan balik untuk siswa
}

// Data Sumatif per siswa
export interface DataSumatif {
    siswaId: string;
    nilaiSLM: number[];  // Sumatif Lingkup Materi (per lingkup materi)
    nilaiSAS: number;    // Sumatif Akhir Semester
    nilaiAkhir: number;
    predikat: string;
    deskripsi: string;
}

export interface LingkupMateri {
    id: string;
    nama: string;
    tujuanPembelajaran: string[];
}

export interface FormIdentitas {
    namaSekolah: string;
    alamatSekolah: string;
    npsn: string;
    kelas: string;
    fase: string; // Fase A/B/C/D/E/F
    mataPelajaran: string;
    semester: string;
    tahunAjaran: string;
    namaGuru: string;
    nipGuru: string;
    kkm: number; // Kriteria Ketuntasan Minimal
    jumlahLM: number; // Jumlah Lingkup Materi
    jumlahTP: number; // Jumlah Tujuan Pembelajaran untuk formatif
}

/**
 * Menghitung nilai akhir sumatif
 * Bobot: SLM 60%, SAS 40% (bisa disesuaikan)
 */
export function hitungNilaiAkhirSumatif(nilaiSLM: number[], nilaiSAS: number, bobotSLM: number = 60): number {
    const nilaiValidSLM = nilaiSLM.filter(n => n > 0);
    if (nilaiValidSLM.length === 0 && nilaiSAS === 0) return 0;

    const bobotSAS = 100 - bobotSLM;

    // Rata-rata SLM
    const rataRataSLM = nilaiValidSLM.length > 0
        ? nilaiValidSLM.reduce((a, b) => a + b, 0) / nilaiValidSLM.length
        : 0;

    // Hitung nilai akhir dengan pembobotan
    const nilaiAkhir = (rataRataSLM * bobotSLM / 100) + (nilaiSAS * bobotSAS / 100);

    return Math.round(nilaiAkhir * 100) / 100;
}

/**
 * Menghitung rata-rata nilai formatif (untuk monitoring, bukan nilai akhir)
 */
export function hitungRataRataFormatif(nilaiTP: number[]): number {
    const nilaiValid = nilaiTP.filter(n => n > 0);
    if (nilaiValid.length === 0) return 0;

    const total = nilaiValid.reduce((sum, nilai) => sum + nilai, 0);
    return Math.round((total / nilaiValid.length) * 100) / 100;
}

/**
 * Konversi nilai ke predikat sesuai Kurikulum Merdeka
 * A: 90-100 (Sangat Baik)
 * B: 80-89 (Baik)  
 * C: 70-79 (Cukup)
 * D: <70 (Perlu Bimbingan)
 */
export function getPredikat(nilai: number): string {
    if (nilai >= 90) return 'A';
    if (nilai >= 80) return 'B';
    if (nilai >= 70) return 'C';
    if (nilai > 0) return 'D';
    return '-';
}

/**
 * Deskripsi predikat
 */
export function getDeskripsiPredikat(predikat: string): string {
    switch (predikat) {
        case 'A': return 'Sangat Baik';
        case 'B': return 'Baik';
        case 'C': return 'Cukup';
        case 'D': return 'Perlu Bimbingan';
        default: return '-';
    }
}

/**
 * Generate deskripsi capaian otomatis berdasarkan nilai
 */
export function generateDeskripsiCapaian(nama: string, predikat: string, mataPelajaran: string): string {
    const namaDepan = nama.split(' ')[0] || 'Siswa';

    switch (predikat) {
        case 'A':
            return `${namaDepan} menunjukkan penguasaan yang sangat baik terhadap seluruh materi ${mataPelajaran}. Mampu mengaplikasikan konsep dengan tepat dan kreatif.`;
        case 'B':
            return `${namaDepan} menunjukkan penguasaan yang baik terhadap materi ${mataPelajaran}. Mampu memahami dan mengaplikasikan sebagian besar konsep dengan baik.`;
        case 'C':
            return `${namaDepan} menunjukkan penguasaan yang cukup terhadap materi ${mataPelajaran}. Perlu penguatan pada beberapa konsep dasar.`;
        case 'D':
            return `${namaDepan} memerlukan bimbingan lebih lanjut dalam memahami materi ${mataPelajaran}. Disarankan untuk mengikuti program remedial.`;
        default:
            return '-';
    }
}

/**
 * Format tanggal Indonesia
 */
export function formatTanggal(date: Date = new Date()): string {
    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    };
    return date.toLocaleDateString('id-ID', options);
}

/**
 * Generate ID unik
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

/**
 * Membuat siswa baru
 */
export function createSiswa(): Siswa {
    return {
        id: generateId(),
        nis: '',
        nama: ''
    };
}

/**
 * Membuat data formatif kosong untuk siswa
 */
export function createDataFormatif(siswaId: string, jumlahTP: number): DataFormatif {
    return {
        siswaId,
        nilaiTP: Array(jumlahTP).fill(0),
        catatan: ''
    };
}

/**
 * Membuat data sumatif kosong untuk siswa
 */
export function createDataSumatif(siswaId: string, jumlahLM: number): DataSumatif {
    return {
        siswaId,
        nilaiSLM: Array(jumlahLM).fill(0),
        nilaiSAS: 0,
        nilaiAkhir: 0,
        predikat: '-',
        deskripsi: ''
    };
}

/**
 * Daftar Fase Kurikulum Merdeka
 */
export const FASE_OPTIONS = [
    { value: 'A', label: 'Fase A (Kelas 1-2 SD)' },
    { value: 'B', label: 'Fase B (Kelas 3-4 SD)' },
    { value: 'C', label: 'Fase C (Kelas 5-6 SD)' },
    { value: 'D', label: 'Fase D (Kelas 7-9 SMP)' },
    { value: 'E', label: 'Fase E (Kelas 10 SMA/SMK)' },
    { value: 'F', label: 'Fase F (Kelas 11-12 SMA/SMK)' }
];

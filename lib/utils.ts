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
    kktp: number; // Kriteria Ketercapaian Tujuan Pembelajaran
    jumlahLM: number; // Jumlah Lingkup Materi
    jumlahTP: number; // Jumlah Tujuan Pembelajaran untuk formatif
    tanggal: string; // Tanggal dokumen (format: YYYY-MM-DD)
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
 * @param dateInput - Date object atau string format YYYY-MM-DD
 */
export function formatTanggal(dateInput?: Date | string): string {
    let date: Date;

    if (typeof dateInput === 'string' && dateInput) {
        date = new Date(dateInput);
    } else if (dateInput instanceof Date) {
        date = dateInput;
    } else {
        date = new Date();
    }

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

/**
 * Jadwal Pelajaran per slot waktu
 */
export interface JadwalItem {
    id: string;
    hari: string;
    jamKe: number;
    waktuMulai: string;
    waktuSelesai: string;
    mataPelajaran: string;
    guru?: string;
    keterangan?: string;
}

/**
 * Data jadwal mingguan
 */
export interface JadwalMingguan {
    kelas: string;
    fase: string;
    jadwal: JadwalItem[];
}

/**
 * Daftar hari sekolah
 */
export const HARI_SEKOLAH = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * Mata Pelajaran SD berdasarkan Fase - Kurikulum Merdeka
 * Sesuai Permendikbud No. 12 Tahun 2024
 */
export const MATA_PELAJARAN_SD: Record<string, string[]> = {
    'A': [ // Fase A - Kelas 1-2
        'Pendidikan Agama dan Budi Pekerti',
        'Pendidikan Pancasila',
        'Bahasa Indonesia',
        'Matematika',
        'Pendidikan Jasmani Olahraga dan Kesehatan',
        'Seni Musik',
        'Seni Rupa',
        'Seni Tari',
        'Seni Teater',
        'Bahasa Inggris',
        'Muatan Lokal',
        'Istirahat',
        'Upacara',
        'P5'
    ],
    'B': [ // Fase B - Kelas 3-4
        'Pendidikan Agama dan Budi Pekerti',
        'Pendidikan Pancasila',
        'Bahasa Indonesia',
        'Matematika',
        'IPAS',
        'Pendidikan Jasmani Olahraga dan Kesehatan',
        'Seni Musik',
        'Seni Rupa',
        'Seni Tari',
        'Seni Teater',
        'Bahasa Inggris',
        'Muatan Lokal',
        'Istirahat',
        'Upacara',
        'P5'
    ],
    'C': [ // Fase C - Kelas 5-6
        'Pendidikan Agama dan Budi Pekerti',
        'Pendidikan Pancasila',
        'Bahasa Indonesia',
        'Matematika',
        'IPAS',
        'Pendidikan Jasmani Olahraga dan Kesehatan',
        'Seni Musik',
        'Seni Rupa',
        'Seni Tari',
        'Seni Teater',
        'Bahasa Inggris',
        'Muatan Lokal',
        'Informatika',
        'Istirahat',
        'Upacara',
        'P5'
    ]
};

/**
 * Generate waktu default untuk jam pelajaran SD (35 menit per JP)
 */
export function generateWaktuJP(jamKe: number, waktuMulaiSekolah: string = '07:00'): { mulai: string; selesai: string } {
    const [startHour, startMin] = waktuMulaiSekolah.split(':').map(Number);
    const durasiJP = 35; // menit
    const startMinutes = startHour * 60 + startMin + (jamKe - 1) * durasiJP;
    const endMinutes = startMinutes + durasiJP;

    const formatTime = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    return { mulai: formatTime(startMinutes), selesai: formatTime(endMinutes) };
}

/**
 * Generate jadwal kosong untuk satu minggu
 */
export function createEmptyJadwal(fase: string = 'A'): JadwalItem[] {
    const jadwal: JadwalItem[] = [];
    const jumlahJP = 8; // 8 jam pelajaran per hari

    HARI_SEKOLAH.forEach(hari => {
        for (let jp = 1; jp <= jumlahJP; jp++) {
            const waktu = generateWaktuJP(jp);
            jadwal.push({
                id: generateId(),
                hari,
                jamKe: jp,
                waktuMulai: waktu.mulai,
                waktuSelesai: waktu.selesai,
                mataPelajaran: '',
                guru: '',
                keterangan: ''
            });
        }
    });

    return jadwal;
}

/**
 * Template jadwal mingguan SD sesuai Kurikulum Merdeka
 * Struktur: 8 JP/hari, JP ke-4 istirahat, variasi mata pelajaran per hari
 */
const JADWAL_TEMPLATE_SD: Record<string, Record<string, string[]>> = {
    'A': { // Fase A - Kelas 1-2 (lebih banyak tematik)
        'Senin': ['Upacara', 'Pendidikan Agama dan Budi Pekerti', 'Pendidikan Agama dan Budi Pekerti', 'Istirahat', 'Bahasa Indonesia', 'Bahasa Indonesia', 'Matematika', 'Matematika'],
        'Selasa': ['Pendidikan Pancasila', 'Pendidikan Pancasila', 'Bahasa Indonesia', 'Istirahat', 'Bahasa Indonesia', 'Matematika', 'Seni Musik', 'Seni Musik'],
        'Rabu': ['Matematika', 'Matematika', 'Bahasa Indonesia', 'Istirahat', 'Bahasa Indonesia', 'Pendidikan Jasmani Olahraga dan Kesehatan', 'Pendidikan Jasmani Olahraga dan Kesehatan', 'Pendidikan Jasmani Olahraga dan Kesehatan'],
        'Kamis': ['Bahasa Indonesia', 'Bahasa Indonesia', 'Matematika', 'Istirahat', 'Matematika', 'Seni Rupa', 'Seni Rupa', 'Muatan Lokal'],
        'Jumat': ['Pendidikan Agama dan Budi Pekerti', 'Pendidikan Agama dan Budi Pekerti', 'Bahasa Indonesia', 'Istirahat', 'Bahasa Indonesia', 'Bahasa Inggris', 'Bahasa Inggris', 'P5'],
        'Sabtu': ['Matematika', 'Matematika', 'Pendidikan Pancasila', 'Istirahat', 'Seni Tari', 'Seni Tari', 'P5', 'P5']
    },
    'B': { // Fase B - Kelas 3-4 (+ IPAS)
        'Senin': ['Upacara', 'Pendidikan Agama dan Budi Pekerti', 'Pendidikan Agama dan Budi Pekerti', 'Istirahat', 'Bahasa Indonesia', 'Bahasa Indonesia', 'Matematika', 'Matematika'],
        'Selasa': ['Pendidikan Pancasila', 'Pendidikan Pancasila', 'IPAS', 'Istirahat', 'IPAS', 'Bahasa Indonesia', 'Bahasa Indonesia', 'Seni Musik'],
        'Rabu': ['Matematika', 'Matematika', 'IPAS', 'Istirahat', 'IPAS', 'Pendidikan Jasmani Olahraga dan Kesehatan', 'Pendidikan Jasmani Olahraga dan Kesehatan', 'Pendidikan Jasmani Olahraga dan Kesehatan'],
        'Kamis': ['Bahasa Indonesia', 'Bahasa Indonesia', 'Matematika', 'Istirahat', 'Matematika', 'Seni Rupa', 'Seni Rupa', 'Muatan Lokal'],
        'Jumat': ['Pendidikan Agama dan Budi Pekerti', 'Pendidikan Agama dan Budi Pekerti', 'IPAS', 'Istirahat', 'IPAS', 'Bahasa Inggris', 'Bahasa Inggris', 'P5'],
        'Sabtu': ['Matematika', 'Matematika', 'Pendidikan Pancasila', 'Istirahat', 'Bahasa Indonesia', 'Seni Tari', 'P5', 'P5']
    },
    'C': { // Fase C - Kelas 5-6 (+ Informatika)
        'Senin': ['Upacara', 'Pendidikan Agama dan Budi Pekerti', 'Pendidikan Agama dan Budi Pekerti', 'Istirahat', 'Bahasa Indonesia', 'Bahasa Indonesia', 'Matematika', 'Matematika'],
        'Selasa': ['Pendidikan Pancasila', 'Pendidikan Pancasila', 'IPAS', 'Istirahat', 'IPAS', 'Bahasa Indonesia', 'Informatika', 'Informatika'],
        'Rabu': ['Matematika', 'Matematika', 'IPAS', 'Istirahat', 'IPAS', 'Pendidikan Jasmani Olahraga dan Kesehatan', 'Pendidikan Jasmani Olahraga dan Kesehatan', 'Pendidikan Jasmani Olahraga dan Kesehatan'],
        'Kamis': ['Bahasa Indonesia', 'Bahasa Indonesia', 'Matematika', 'Istirahat', 'Matematika', 'Seni Rupa', 'Seni Rupa', 'Muatan Lokal'],
        'Jumat': ['Pendidikan Agama dan Budi Pekerti', 'Pendidikan Agama dan Budi Pekerti', 'IPAS', 'Istirahat', 'IPAS', 'Bahasa Inggris', 'Bahasa Inggris', 'P5'],
        'Sabtu': ['Matematika', 'Matematika', 'Pendidikan Pancasila', 'Istirahat', 'Bahasa Indonesia', 'Seni Musik', 'P5', 'P5']
    }
};

/**
 * Generate jadwal dengan template default sesuai fase
 */
export function createDefaultJadwal(fase: string = 'A'): JadwalItem[] {
    const jadwal: JadwalItem[] = [];
    const jumlahJP = 8;
    const selectedFase = ['A', 'B', 'C'].includes(fase) ? fase : 'A';
    const template = JADWAL_TEMPLATE_SD[selectedFase];

    HARI_SEKOLAH.forEach(hari => {
        const mapelHari = template[hari] || [];
        for (let jp = 1; jp <= jumlahJP; jp++) {
            const waktu = generateWaktuJP(jp);
            jadwal.push({
                id: generateId(),
                hari,
                jamKe: jp,
                waktuMulai: waktu.mulai,
                waktuSelesai: waktu.selesai,
                mataPelajaran: mapelHari[jp - 1] || '',
                guru: '',
                keterangan: ''
            });
        }
    });

    return jadwal;
}

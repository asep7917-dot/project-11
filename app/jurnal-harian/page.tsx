'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, Printer, ChevronLeft, ChevronRight, Save, BookOpen, FileText, Plus, Trash2 } from 'lucide-react';
import { useNilai } from '@/lib/NilaiContext';
import { JadwalItem, HARI_SEKOLAH } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';

const JURNAL_STORAGE_KEY = 'jurnal-harian-data-v2';
const JADWAL_STORAGE_KEY = 'jadwal-pelajaran-data';

const NAMA_BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Format Jurnal Harian berdasarkan standar Kurikulum Merdeka
// Sumber: kejarcita.id, tirto.id, websiteedukasi.com, quipper.com, gurusd.id
interface JurnalEntry {
    id: string;
    tanggal: string;
    hari: string;
    jamKe: string;          // Jam pelajaran ke-
    mataPelajaran: string;
    tujuanPembelajaran: string;  // Tujuan Pembelajaran (sesuai CP)
    materiPokok: string;         // Materi pokok yang diajarkan
    kegiatanPembelajaran: string; // Kegiatan: Pembuka, Inti, Penutup
    mediaAlat: string;           // Media/alat pembelajaran
    penilaian: string;           // Jenis penilaian yang dilakukan
    permasalahan: string;        // Hambatan/masalah yang dihadapi
    tindakLanjut: string;        // Rencana tindak lanjut
    kehadiran: {                 // Kehadiran siswa
        hadir: number;
        sakit: number;
        izin: number;
        alpa: number;
    };
}

const availableMonths = [
    { label: 'Juli 2025', month: 6, year: 2025 },
    { label: 'Agustus 2025', month: 7, year: 2025 },
    { label: 'September 2025', month: 8, year: 2025 },
    { label: 'Oktober 2025', month: 9, year: 2025 },
    { label: 'November 2025', month: 10, year: 2025 },
    { label: 'Desember 2025', month: 11, year: 2025 },
    { label: 'Januari 2026', month: 0, year: 2026 }
];

// Contoh Tujuan Pembelajaran per Mata Pelajaran (sesuai CP Kurikulum Merdeka)
const TUJUAN_PEMBELAJARAN: Record<string, string[]> = {
    'Bahasa Indonesia': [
        'Peserta didik mampu menyimak dan memahami teks deskripsi dengan baik',
        'Peserta didik mampu menulis cerita pendek dengan struktur yang benar',
        'Peserta didik mampu membaca nyaring dengan lafal dan intonasi yang tepat',
        'Peserta didik mampu menceritakan kembali isi teks yang dibaca'
    ],
    'Matematika': [
        'Peserta didik mampu melakukan operasi hitung bilangan dengan benar',
        'Peserta didik mampu mengidentifikasi bangun datar dan sifat-sifatnya',
        'Peserta didik mampu menyelesaikan soal pecahan sederhana',
        'Peserta didik mampu mengukur panjang dengan satuan baku'
    ],
    'IPAS': [
        'Peserta didik mampu mengidentifikasi bagian tubuh dan fungsinya',
        'Peserta didik mampu menjelaskan habitat hewan di lingkungan sekitar',
        'Peserta didik mampu mengamati perubahan cuaca dan pengaruhnya',
        'Peserta didik mampu mendeskripsikan siklus air dalam kehidupan'
    ],
    'PJOK': [
        'Peserta didik mampu melakukan gerak dasar lokomotor dengan benar',
        'Peserta didik mampu mempraktikkan senam irama sederhana',
        'Peserta didik mampu bermain permainan tradisional dengan sportif',
        'Peserta didik mampu melakukan aktivitas kebugaran jasmani'
    ],
    'Pendidikan Agama': [
        'Peserta didik mampu membaca huruf hijaiyah dengan benar',
        'Peserta didik mampu mempraktikkan gerakan sholat dengan tertib',
        'Peserta didik mampu menyebutkan rukun Islam dan rukun Iman',
        'Peserta didik mampu menerapkan akhlak terpuji dalam kehidupan'
    ],
    'PPKN': [
        'Peserta didik mampu menjelaskan nilai-nilai Pancasila',
        'Peserta didik mampu menunjukkan sikap toleransi terhadap keberagaman',
        'Peserta didik mampu menyebutkan hak dan kewajiban sebagai warga',
        'Peserta didik mampu menerapkan gotong royong di lingkungan'
    ],
    'Seni Budaya': [
        'Peserta didik mampu menggambar ekspresif sesuai imajinasi',
        'Peserta didik mampu menyanyikan lagu daerah dengan benar',
        'Peserta didik mampu membuat karya prakarya sederhana',
        'Peserta didik mampu mengekspresikan diri melalui gerak tari'
    ],
    'Bahasa Inggris': [
        'Peserta didik mampu menyapa dan memperkenalkan diri dalam bahasa Inggris',
        'Peserta didik mampu menyebutkan nama benda dalam bahasa Inggris',
        'Peserta didik mampu merespons instruksi sederhana dalam bahasa Inggris',
        'Peserta didik mampu bernyanyi lagu anak dalam bahasa Inggris'
    ],
    'P5': [
        'Peserta didik mampu berkolaborasi dalam menyelesaikan projek',
        'Peserta didik mampu mempresentasikan hasil projek dengan percaya diri',
        'Peserta didik mampu menunjukkan kreativitas dalam projek',
        'Peserta didik mampu melakukan refleksi pembelajaran projek'
    ],
    'Mulok': [
        'Peserta didik mampu menggunakan bahasa daerah dengan baik',
        'Peserta didik mampu mengenal budaya lokal daerah setempat',
        'Peserta didik mampu membuat kerajinan khas daerah'
    ]
};

// Contoh Kegiatan Pembelajaran
const KEGIATAN_PEMBELAJARAN = [
    'Pembuka: Salam, doa, presensi, apersepsi | Inti: Diskusi kelompok, praktik langsung | Penutup: Refleksi, kesimpulan, doa',
    'Pembuka: Ice breaking, motivasi | Inti: Penjelasan materi, tanya jawab, latihan | Penutup: Penguatan, tugas rumah',
    'Pembuka: Bernyanyi bersama, apersepsi | Inti: Eksplorasi, demonstrasi, praktik | Penutup: Evaluasi, kesimpulan',
    'Pembuka: Review materi sebelumnya | Inti: Presentasi, diskusi, unjuk kerja | Penutup: Refleksi, pesan moral',
    'Pembuka: Literasi, motivasi | Inti: Observasi lingkungan, diskusi | Penutup: Kesimpulan, penilaian'
];

// Contoh Media/Alat
const MEDIA_ALAT = [
    'Buku paket, papan tulis, spidol',
    'LCD proyektor, laptop, video pembelajaran',
    'Kartu gambar, poster, lembar kerja',
    'Alat peraga, benda konkret, lingkungan sekitar',
    'Audio, musik, media digital'
];

// Contoh Penilaian
const PENILAIAN = [
    'Observasi sikap, tes tertulis, unjuk kerja',
    'Penilaian proses, produk, portofolio',
    'Tes lisan, penugasan, praktik',
    'Rubrik penilaian, skala sikap',
    'Asesmen formatif, kuis singkat'
];

function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

function JurnalHarianContent() {
    const { identitas, siswaList } = useNilai();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [jurnalData, setJurnalData] = useState<Record<string, JurnalEntry[]>>({});
    const [jadwal, setJadwal] = useState<JadwalItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    const currentMonth = availableMonths[currentIndex];
    const currentLabel = currentMonth.label;
    const totalSiswa = siswaList.length || 28;

    // Load jadwal from localStorage
    useEffect(() => {
        try {
            const savedJadwal = localStorage.getItem(JADWAL_STORAGE_KEY);
            if (savedJadwal) {
                const data = JSON.parse(savedJadwal);
                setJadwal(data.jadwal || []);
            }
        } catch (error) {
            console.error('Error loading jadwal:', error);
        }
    }, []);

    // Load jurnal from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(JURNAL_STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                setJurnalData(data.jurnal || {});
                setLastSaved(data.savedAt);
            }
        } catch (error) {
            console.error('Error loading jurnal:', error);
        }
        setIsLoaded(true);
    }, []);

    // Generate working days for current month
    const workingDays = useMemo(() => {
        const days: Date[] = [];
        const { month, year } = currentMonth;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const holidays: Record<string, string> = {
            '2025-07-01': 'Libur Semester', '2025-07-02': 'Libur Semester',
            '2025-07-03': 'Libur Semester', '2025-07-04': 'Libur Semester',
            '2025-07-07': 'Libur Semester', '2025-07-08': 'Libur Semester',
            '2025-07-09': 'Libur Semester', '2025-07-10': 'Libur Semester',
            '2025-07-11': 'Libur Semester', '2025-08-17': 'HUT RI',
            '2025-08-18': 'Cuti Bersama', '2025-09-05': 'Maulid Nabi',
        };

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const day = date.getDay();
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

            if (day === 0 || day === 6) continue;
            if (holidays[dateKey] && dateKey !== '2025-07-14') continue;
            if (month === 6 && year === 2025 && d < 14) continue;

            days.push(date);
        }
        return days;
    }, [currentMonth]);

    // Get jadwal for a specific day
    const getJadwalForDay = (hari: string): JadwalItem[] => {
        return jadwal.filter(j => j.hari === hari && j.mataPelajaran).sort((a, b) => a.jamKe - b.jamKe);
    };

    // Generate jurnal entries
    const generateJurnalFromJadwal = () => {
        const newEntries: JurnalEntry[] = [];

        workingDays.forEach(date => {
            const hari = NAMA_HARI[date.getDay()];
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const dayJadwal = getJadwalForDay(hari);

            // Group consecutive same subjects
            const groupedJadwal: { mapel: string; jamKe: number[] }[] = [];
            let currentGroup: { mapel: string; jamKe: number[] } | null = null;

            dayJadwal.forEach(j => {
                if (currentGroup && currentGroup.mapel === j.mataPelajaran) {
                    currentGroup.jamKe.push(j.jamKe);
                } else {
                    if (currentGroup) groupedJadwal.push(currentGroup);
                    currentGroup = { mapel: j.mataPelajaran, jamKe: [j.jamKe] };
                }
            });
            if (currentGroup) groupedJadwal.push(currentGroup);

            groupedJadwal.forEach(group => {
                const tujuanOptions = TUJUAN_PEMBELAJARAN[group.mapel] || TUJUAN_PEMBELAJARAN['Bahasa Indonesia'];
                const kegiatan = KEGIATAN_PEMBELAJARAN[Math.floor(Math.random() * KEGIATAN_PEMBELAJARAN.length)];
                const media = MEDIA_ALAT[Math.floor(Math.random() * MEDIA_ALAT.length)];
                const penilaian = PENILAIAN[Math.floor(Math.random() * PENILAIAN.length)];

                const jamKeStr = group.jamKe.length > 1
                    ? `${group.jamKe[0]}-${group.jamKe[group.jamKe.length - 1]}`
                    : `${group.jamKe[0]}`;

                newEntries.push({
                    id: generateId(),
                    tanggal: dateKey,
                    hari,
                    jamKe: jamKeStr,
                    mataPelajaran: group.mapel,
                    tujuanPembelajaran: tujuanOptions[Math.floor(Math.random() * tujuanOptions.length)],
                    materiPokok: `Materi ${group.mapel} pertemuan hari ${hari}`,
                    kegiatanPembelajaran: kegiatan,
                    mediaAlat: media,
                    penilaian: penilaian,
                    permasalahan: '-',
                    tindakLanjut: '-',
                    kehadiran: {
                        hadir: totalSiswa,
                        sakit: 0,
                        izin: 0,
                        alpa: 0
                    }
                });
            });
        });

        const monthKey = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}`;
        setJurnalData(prev => ({ ...prev, [monthKey]: newEntries }));
        setTimeout(() => saveJurnal(), 500);
        alert(`Jurnal ${currentLabel} berhasil digenerate! (${newEntries.length} entri)`);
    };

    const saveJurnal = () => {
        try {
            const data = { jurnal: jurnalData, savedAt: new Date().toISOString() };
            localStorage.setItem(JURNAL_STORAGE_KEY, JSON.stringify(data));
            setLastSaved(data.savedAt);
        } catch (error) {
            console.error('Error saving jurnal:', error);
        }
    };

    const handleChange = (entryId: string, field: keyof JurnalEntry, value: string | number | object) => {
        const monthKey = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}`;
        setJurnalData(prev => ({
            ...prev,
            [monthKey]: (prev[monthKey] || []).map(entry =>
                entry.id === entryId ? { ...entry, [field]: value } : entry
            )
        }));
    };

    const handleKehadiranChange = (entryId: string, field: keyof JurnalEntry['kehadiran'], value: number) => {
        const monthKey = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}`;
        setJurnalData(prev => ({
            ...prev,
            [monthKey]: (prev[monthKey] || []).map(entry =>
                entry.id === entryId ? {
                    ...entry,
                    kehadiran: { ...entry.kehadiran, [field]: value }
                } : entry
            )
        }));
    };

    useEffect(() => {
        if (isLoaded && Object.keys(jurnalData).length > 0) {
            const timeout = setTimeout(() => saveJurnal(), 2000);
            return () => clearTimeout(timeout);
        }
    }, [jurnalData, isLoaded]);

    const handlePrint = () => window.print();

    const formatLastSaved = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const prevMonth = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };
    const nextMonth = () => { if (currentIndex < availableMonths.length - 1) setCurrentIndex(currentIndex + 1); };

    const monthKey = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}`;
    const currentEntries = jurnalData[monthKey] || [];

    // Group by date
    const entriesByDate = currentEntries.reduce((acc, entry) => {
        if (!acc[entry.tanggal]) acc[entry.tanggal] = [];
        acc[entry.tanggal].push(entry);
        return acc;
    }, {} as Record<string, JurnalEntry[]>);

    const lastDayOfMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate();

    return (
        <div className="page-container">
            {/* Print Header */}
            <div className="print-header">
                <h2>JURNAL HARIAN PEMBELAJARAN</h2>
                <p>KURIKULUM MERDEKA - BULAN {currentLabel.toUpperCase()}</p>
            </div>

            {/* Print Identitas */}
            <div className="print-identitas">
                <table>
                    <tbody>
                        <tr>
                            <td><strong>Satuan Pendidikan</strong></td>
                            <td>:</td>
                            <td>{identitas.namaSekolah || '-'}</td>
                            <td style={{ width: '40px' }}></td>
                            <td><strong>Semester</strong></td>
                            <td>:</td>
                            <td>{identitas.semester}</td>
                        </tr>
                        <tr>
                            <td><strong>Kelas/Fase</strong></td>
                            <td>:</td>
                            <td>{identitas.kelas || '-'} / Fase {identitas.fase}</td>
                            <td></td>
                            <td><strong>Tahun Ajaran</strong></td>
                            <td>:</td>
                            <td>{identitas.tahunAjaran}</td>
                        </tr>
                        <tr>
                            <td><strong>Guru Kelas</strong></td>
                            <td>:</td>
                            <td>{identitas.namaGuru || '-'}</td>
                            <td></td>
                            <td><strong>Bulan</strong></td>
                            <td>:</td>
                            <td>{currentLabel}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="page-header no-print">
                <h1>Jurnal Harian Pembelajaran</h1>
                <p>Dokumentasi kegiatan pembelajaran harian sesuai format Kurikulum Merdeka</p>
            </div>

            {/* Navigation */}
            <div className="card no-print" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <button className="btn btn-primary" onClick={prevMonth} disabled={currentIndex === 0}>
                        <ChevronLeft size={20} /> Sebelumnya
                    </button>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                        <Calendar size={24} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        {currentLabel}
                    </h2>
                    <button className="btn btn-primary" onClick={nextMonth} disabled={currentIndex === availableMonths.length - 1}>
                        Berikutnya <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="info-box no-print" style={{ marginBottom: '1rem' }}>
                <p>📅 <strong>Hari Efektif:</strong> {workingDays.length} |
                    <strong> Entri Jurnal:</strong> {currentEntries.length} |
                    <strong> Total Siswa:</strong> {totalSiswa}
                    {lastSaved && <span> | Tersimpan: {formatLastSaved(lastSaved)}</span>}
                </p>
            </div>

            {/* Jurnal Content */}
            <div className="card">
                <h2 className="card-title no-print">
                    <BookOpen size={20} />
                    Jurnal Harian - {currentLabel}
                </h2>

                {currentEntries.length === 0 ? (
                    <div className="info-box" style={{ textAlign: 'center', padding: '2rem' }}>
                        <p>Belum ada data jurnal untuk bulan ini.</p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                            Klik tombol di bawah untuk generate jurnal otomatis dari jadwal pelajaran
                        </p>
                        <button className="btn btn-success" onClick={generateJurnalFromJadwal} style={{ marginTop: '1rem' }}>
                            <FileText size={20} />
                            Generate Jurnal dari Jadwal
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="table-container" style={{ overflowX: 'auto' }}>
                            <table className="table jurnal-table" style={{ fontSize: '0.8rem', minWidth: '1200px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '30px', textAlign: 'center' }}>No</th>
                                        <th style={{ width: '85px' }}>Hari/Tanggal</th>
                                        <th style={{ width: '30px', textAlign: 'center' }}>JP</th>
                                        <th style={{ width: '80px' }}>Mapel</th>
                                        <th style={{ minWidth: '180px' }}>Tujuan Pembelajaran</th>
                                        <th style={{ minWidth: '150px' }}>Kegiatan Pembelajaran</th>
                                        <th style={{ width: '100px' }}>Media/Alat</th>
                                        <th style={{ width: '100px' }}>Penilaian</th>
                                        <th style={{ width: '100px' }}>Ket/Hambatan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.keys(entriesByDate).sort().map((dateKey, dateIndex) => {
                                        const entries = entriesByDate[dateKey];
                                        const dateParts = dateKey.split('-');
                                        const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));

                                        return entries.map((entry, entryIndex) => (
                                            <tr key={entry.id}>
                                                {entryIndex === 0 && (
                                                    <>
                                                        <td rowSpan={entries.length} style={{ textAlign: 'center', verticalAlign: 'top', fontWeight: 600 }}>
                                                            {dateIndex + 1}
                                                        </td>
                                                        <td rowSpan={entries.length} style={{ verticalAlign: 'top' }}>
                                                            <strong>{NAMA_HARI[dateObj.getDay()]}</strong><br />
                                                            <span style={{ fontSize: '0.75rem' }}>{dateObj.getDate()} {NAMA_BULAN[dateObj.getMonth()]}</span>
                                                        </td>
                                                    </>
                                                )}
                                                <td style={{ textAlign: 'center' }}>{entry.jamKe}</td>
                                                <td style={{ fontWeight: 500 }}>{entry.mataPelajaran}</td>
                                                <td>
                                                    <textarea
                                                        value={entry.tujuanPembelajaran}
                                                        onChange={(e) => handleChange(entry.id, 'tujuanPembelajaran', e.target.value)}
                                                        rows={2}
                                                        style={{ width: '100%', fontSize: '0.75rem', padding: '4px', border: '1px solid var(--border)', borderRadius: '4px', resize: 'vertical' }}
                                                    />
                                                </td>
                                                <td>
                                                    <textarea
                                                        value={entry.kegiatanPembelajaran}
                                                        onChange={(e) => handleChange(entry.id, 'kegiatanPembelajaran', e.target.value)}
                                                        rows={2}
                                                        style={{ width: '100%', fontSize: '0.75rem', padding: '4px', border: '1px solid var(--border)', borderRadius: '4px', resize: 'vertical' }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={entry.mediaAlat}
                                                        onChange={(e) => handleChange(entry.id, 'mediaAlat', e.target.value)}
                                                        style={{ width: '100%', fontSize: '0.75rem', padding: '4px', border: '1px solid var(--border)', borderRadius: '4px' }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={entry.penilaian}
                                                        onChange={(e) => handleChange(entry.id, 'penilaian', e.target.value)}
                                                        style={{ width: '100%', fontSize: '0.75rem', padding: '4px', border: '1px solid var(--border)', borderRadius: '4px' }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={entry.permasalahan}
                                                        onChange={(e) => handleChange(entry.id, 'permasalahan', e.target.value)}
                                                        style={{ width: '100%', fontSize: '0.75rem', padding: '4px', border: '1px solid var(--border)', borderRadius: '4px' }}
                                                    />
                                                </td>
                                            </tr>
                                        ));
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="btn-group no-print" style={{ marginTop: '1rem' }}>
                            <button className="btn btn-primary" onClick={saveJurnal}>
                                <Save size={20} /> Simpan
                            </button>
                            <button className="btn btn-warning" onClick={handlePrint}>
                                <Printer size={20} /> Cetak
                            </button>
                            <button className="btn btn-success" onClick={generateJurnalFromJadwal}>
                                <FileText size={20} /> Generate Ulang
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Print Keterangan */}
            <div className="print-keterangan">
                <h3>Keterangan:</h3>
                <div className="print-keterangan-list">
                    <span><strong>JP</strong> = Jam Pelajaran</span>
                    <span><strong>H</strong> = Hadir</span>
                    <span><strong>S</strong> = Sakit</span>
                    <span><strong>I</strong> = Izin</span>
                    <span><strong>A</strong> = Alpa</span>
                </div>
            </div>

            {/* Print Signature */}
            <div className="print-signature">
                <p>{identitas.alamatSekolah || identitas.namaSekolah || '.....................'}, {lastDayOfMonth} {NAMA_BULAN[currentMonth.month]} {currentMonth.year}</p>
                <p style={{ marginTop: '8pt' }}>Guru Kelas,</p>
                <div className="signature-space"></div>
                <div className="signature-box">
                    <span className="signature-name"><u>{identitas.namaGuru || '.....................'}</u></span>
                    <span className="signature-nip">NIP. {identitas.nipGuru || '-'}</span>
                </div>
            </div>

            {/* Info */}
            <div className="card no-print">
                <h2 className="card-title">📋 Format Jurnal Harian (Kurikulum Merdeka)</h2>
                <div className="info-box">
                    <p style={{ marginBottom: '0.5rem' }}><strong>Komponen Jurnal Harian sesuai standar:</strong></p>
                    <ul style={{ marginLeft: '1rem', fontSize: '0.9rem', lineHeight: 1.8 }}>
                        <li><strong>Hari/Tanggal</strong> - Pelaksanaan pembelajaran</li>
                        <li><strong>Jam Pelajaran</strong> - Jam ke berapa pembelajaran</li>
                        <li><strong>Tujuan Pembelajaran</strong> - Sesuai Capaian Pembelajaran (CP)</li>
                        <li><strong>Kegiatan Pembelajaran</strong> - Pembuka, Inti, Penutup</li>
                        <li><strong>Media/Alat</strong> - Alat bantu pembelajaran</li>
                        <li><strong>Penilaian</strong> - Jenis asesmen yang dilakukan</li>
                        <li><strong>Kehadiran</strong> - Presensi siswa (H/S/I/A)</li>
                        <li><strong>Permasalahan</strong> - Hambatan yang dihadapi</li>
                    </ul>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                        Sumber: kejarcita.id, tirto.id, websiteedukasi.com, quipper.com, gurusd.id
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function JurnalHarianPage() {
    return (
        <AppLayout>
            <JurnalHarianContent />
        </AppLayout>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { Calendar, Printer, RotateCcw, Save, FileDown } from 'lucide-react';
import { useNilai } from '@/lib/NilaiContext';
import {
    JadwalItem,
    HARI_SEKOLAH,
    MATA_PELAJARAN_SD,
    createEmptyJadwal,
    createDefaultJadwal,
    formatTanggal
} from '@/lib/utils';
import AppLayout from '@/components/AppLayout';

const JADWAL_STORAGE_KEY = 'jadwal-pelajaran-data';

function JadwalContent() {
    const { identitas } = useNilai();
    const [jadwal, setJadwal] = useState<JadwalItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    // Get mata pelajaran based on fase (for SD only use A, B, C)
    const fase = ['A', 'B', 'C'].includes(identitas.fase) ? identitas.fase : 'A';
    const mataPelajaranOptions = MATA_PELAJARAN_SD[fase] || MATA_PELAJARAN_SD['A'];

    // Load jadwal from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(JADWAL_STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                setJadwal(data.jadwal || []);
                setLastSaved(data.savedAt);
            } else {
                // Load template default sesuai fase
                setJadwal(createDefaultJadwal(fase));
            }
        } catch (error) {
            console.error('Error loading jadwal:', error);
            setJadwal(createDefaultJadwal(fase));
        }
        setIsLoaded(true);
    }, []);

    // Auto-save when jadwal changes
    useEffect(() => {
        if (isLoaded && jadwal.length > 0) {
            const timeout = setTimeout(() => {
                saveJadwal();
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [jadwal, isLoaded]);

    const saveJadwal = () => {
        try {
            const data = {
                jadwal,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(JADWAL_STORAGE_KEY, JSON.stringify(data));
            setLastSaved(data.savedAt);
        } catch (error) {
            console.error('Error saving jadwal:', error);
        }
    };

    const handleChange = (id: string, field: keyof JadwalItem, value: string | number) => {
        setJadwal(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const resetJadwal = () => {
        if (confirm('Reset jadwal ke template kosong? Data akan hilang.')) {
            setJadwal(createEmptyJadwal(fase));
        }
    };

    const loadTemplate = () => {
        if (confirm('Load jadwal template sesuai Fase ' + fase + '? Data saat ini akan diganti.')) {
            setJadwal(createDefaultJadwal(fase));
        }
    };

    const handlePrint = () => window.print();

    const formatLastSaved = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Group jadwal by hari
    const jadwalByHari = HARI_SEKOLAH.reduce((acc, hari) => {
        acc[hari] = jadwal.filter(j => j.hari === hari).sort((a, b) => a.jamKe - b.jamKe);
        return acc;
    }, {} as Record<string, JadwalItem[]>);

    const jumlahJP = 8;

    return (
        <div className="page-container">
            {/* Print Header */}
            <div className="print-header">
                <h2>JADWAL PELAJARAN</h2>
                <p>KURIKULUM MERDEKA</p>
            </div>

            {/* Print Identitas */}
            <div className="print-identitas">
                <table>
                    <tbody>
                        <tr>
                            <td><strong>Nama Sekolah</strong></td>
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
                            <td><strong>NIP</strong></td>
                            <td>:</td>
                            <td>{identitas.nipGuru || '-'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="page-header no-print">
                <h1>Jadwal Pelajaran</h1>
                <p>Jadwal mingguan untuk {identitas.kelas || 'Kelas'} - Fase {identitas.fase}</p>
            </div>

            {/* Save Status */}
            <div className="info-box no-print" style={{ marginBottom: '1rem' }}>
                <p>📅 <strong>Durasi:</strong> 35 menit/JP (SD) | <strong>Fase:</strong> {fase} |
                    {lastSaved && <span> Tersimpan: {formatLastSaved(lastSaved)}</span>}
                </p>
            </div>

            {/* Jadwal Table */}
            <div className="card">
                <h2 className="card-title no-print">
                    <Calendar size={20} />
                    Jadwal Mingguan
                </h2>

                <div className="table-container" style={{ overflowX: 'auto' }}>
                    <table className="table jadwal-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px', textAlign: 'center' }}>Jam Ke</th>
                                <th style={{ width: '90px', textAlign: 'center' }}>Waktu</th>
                                {HARI_SEKOLAH.map(hari => (
                                    <th key={hari} style={{ textAlign: 'center', minWidth: '140px' }}>{hari}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: jumlahJP }, (_, i) => i + 1).map(jamKe => (
                                <tr key={jamKe}>
                                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{jamKe}</td>
                                    <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                                        {jadwalByHari['Senin']?.[jamKe - 1]?.waktuMulai || ''} -
                                        {jadwalByHari['Senin']?.[jamKe - 1]?.waktuSelesai || ''}
                                    </td>
                                    {HARI_SEKOLAH.map(hari => {
                                        const item = jadwalByHari[hari]?.[jamKe - 1];
                                        if (!item) return <td key={hari}>-</td>;

                                        return (
                                            <td key={hari} style={{ padding: '0.25rem' }}>
                                                <select
                                                    value={item.mataPelajaran}
                                                    onChange={(e) => handleChange(item.id, 'mataPelajaran', e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        fontSize: '0.8rem',
                                                        padding: '0.4rem',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: '6px',
                                                        background: item.mataPelajaran ? 'var(--card)' : 'var(--background)'
                                                    }}
                                                >
                                                    <option value="">-- Pilih --</option>
                                                    {mataPelajaranOptions.map(mapel => (
                                                        <option key={mapel} value={mapel}>{mapel}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="btn-group no-print" style={{ marginTop: '1rem' }}>
                    <button className="btn btn-primary" onClick={saveJadwal}>
                        <Save size={20} />
                        Simpan
                    </button>
                    <button className="btn btn-success" onClick={loadTemplate}>
                        <FileDown size={20} />
                        Load Template
                    </button>
                    <button className="btn btn-warning" onClick={handlePrint}>
                        <Printer size={20} />
                        Cetak
                    </button>
                    <button className="btn btn-danger" onClick={resetJadwal}>
                        <RotateCcw size={20} />
                        Reset
                    </button>
                </div>
            </div>

            {/* Print Keterangan */}
            <div className="print-keterangan">
                <h3>Keterangan:</h3>
                <div className="print-keterangan-list">
                    <span><strong>JP</strong> = Jam Pelajaran (35 menit)</span>
                    <span><strong>IPAS</strong> = Ilmu Pengetahuan Alam dan Sosial</span>
                    <span><strong>P5</strong> = Projek Penguatan Profil Pelajar Pancasila</span>
                </div>
            </div>

            {/* Print Signature */}
            <div className="print-signature">
                <p>{identitas.alamatSekolah || identitas.namaSekolah || '.....................'}, {formatTanggal(identitas.tanggal)}</p>
                <p style={{ marginTop: '8pt' }}>Guru Kelas,</p>
                <div className="signature-space"></div>
                <div className="signature-box">
                    <span className="signature-name"><u>{identitas.namaGuru || '.....................'}</u></span>
                    <span className="signature-nip">NIP. {identitas.nipGuru || '-'}</span>
                </div>
            </div>

            {/* Info Box */}
            <div className="card no-print">
                <h2 className="card-title">📋 Keterangan Singkatan</h2>
                <div className="info-box">
                    <ul>
                        <li><strong>IPAS</strong> - Ilmu Pengetahuan Alam dan Sosial</li>
                        <li><strong>PJOK</strong> - Pendidikan Jasmani Olahraga dan Kesehatan</li>
                        <li><strong>P5</strong> - Projek Penguatan Profil Pelajar Pancasila</li>
                        <li><strong>Durasi 1 JP</strong> - 35 menit (sesuai Permendikbud No. 12/2024)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default function JadwalPage() {
    return (
        <AppLayout>
            <JadwalContent />
        </AppLayout>
    );
}

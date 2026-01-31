'use client';

import { BookOpen, Save, Trash2, CheckCircle } from 'lucide-react';
import { useNilai } from '@/lib/NilaiContext';
import { FASE_OPTIONS } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';

function IdentitasContent() {
    const { identitas, setIdentitas, saveData, clearData, lastSaved, isLoaded } = useNilai();

    const handleChange = (field: string, value: string | number) => {
        setIdentitas({ ...identitas, [field]: value });
    };

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

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Identitas Dokumen</h1>
                <p>Pengaturan informasi sekolah, kelas, dan mata pelajaran</p>
            </div>

            {/* Save Status Card */}
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)', borderColor: 'var(--secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <CheckCircle size={24} style={{ color: 'var(--secondary)' }} />
                        <div>
                            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Data Tersimpan Otomatis</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                                {lastSaved
                                    ? `Terakhir disimpan: ${formatLastSaved(lastSaved)}`
                                    : 'Data akan tersimpan secara otomatis'}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-primary" onClick={saveData}>
                            <Save size={18} />
                            Simpan Sekarang
                        </button>
                        <button className="btn btn-danger" onClick={clearData}>
                            <Trash2 size={18} />
                            Hapus Semua Data
                        </button>
                    </div>
                </div>
            </div>

            <div className="card">
                <h2 className="card-title">
                    <BookOpen size={20} />
                    Informasi Sekolah & Kelas
                </h2>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Nama Sekolah *</label>
                        <input
                            type="text"
                            placeholder="Masukkan nama sekolah"
                            value={identitas.namaSekolah}
                            onChange={(e) => handleChange('namaSekolah', e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Alamat Sekolah</label>
                        <input
                            type="text"
                            placeholder="Alamat lengkap sekolah"
                            value={identitas.alamatSekolah}
                            onChange={(e) => handleChange('alamatSekolah', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>NPSN</label>
                        <input
                            type="text"
                            placeholder="Nomor Pokok Sekolah Nasional"
                            value={identitas.npsn}
                            onChange={(e) => handleChange('npsn', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Kelas *</label>
                        <input
                            type="text"
                            placeholder="Contoh: X IPA 1"
                            value={identitas.kelas}
                            onChange={(e) => handleChange('kelas', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Fase</label>
                        <select
                            value={identitas.fase}
                            onChange={(e) => handleChange('fase', e.target.value)}
                        >
                            {FASE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Mata Pelajaran *</label>
                        <input
                            type="text"
                            placeholder="Contoh: Matematika"
                            value={identitas.mataPelajaran}
                            onChange={(e) => handleChange('mataPelajaran', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Semester</label>
                        <select
                            value={identitas.semester}
                            onChange={(e) => handleChange('semester', e.target.value)}
                        >
                            <option value="Ganjil">Ganjil</option>
                            <option value="Genap">Genap</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Tahun Ajaran</label>
                        <input
                            type="text"
                            placeholder="2024/2025"
                            value={identitas.tahunAjaran}
                            onChange={(e) => handleChange('tahunAjaran', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Nama Guru Kelas *</label>
                        <input
                            type="text"
                            placeholder="Nama lengkap dengan gelar"
                            value={identitas.namaGuru}
                            onChange={(e) => handleChange('namaGuru', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>NIP</label>
                        <input
                            type="text"
                            placeholder="Nomor Induk Pegawai"
                            value={identitas.nipGuru}
                            onChange={(e) => handleChange('nipGuru', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>KKTP</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={identitas.kktp}
                            onChange={(e) => handleChange('kktp', parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Jumlah Tujuan Pembelajaran (TP)</label>
                        <select
                            value={identitas.jumlahTP}
                            onChange={(e) => handleChange('jumlahTP', parseInt(e.target.value))}
                        >
                            {[3, 4, 5, 6, 7, 8, 9, 10, 12].map(num => (
                                <option key={num} value={num}>{num} TP</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Jumlah Lingkup Materi (LM)</label>
                        <select
                            value={identitas.jumlahLM}
                            onChange={(e) => handleChange('jumlahLM', parseInt(e.target.value))}
                        >
                            {[2, 3, 4, 5, 6, 7, 8].map(num => (
                                <option key={num} value={num}>{num} Lingkup Materi</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Tanggal Dokumen</label>
                        <input
                            type="date"
                            value={identitas.tanggal}
                            onChange={(e) => handleChange('tanggal', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="card">
                <h2 className="card-title">📋 Panduan Penggunaan</h2>
                <div className="info-box">
                    <ul>
                        <li><strong>Identitas</strong> - Isi data sekolah, kelas, dan mata pelajaran terlebih dahulu</li>
                        <li><strong>Data Siswa</strong> - Tambahkan daftar siswa yang akan dinilai</li>
                        <li><strong>Nilai Formatif</strong> - Input nilai per Tujuan Pembelajaran (untuk umpan balik)</li>
                        <li><strong>Nilai Sumatif</strong> - Input nilai SLM dan SAS (untuk rapor)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default function IdentitasPage() {
    return (
        <AppLayout>
            <IdentitasContent />
        </AppLayout>
    );
}

'use client';

import { useRef, useState } from 'react';
import { Users, Plus, Trash2, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Save } from 'lucide-react';
import { useNilai } from '@/lib/NilaiContext';
import { importSiswaFromExcel, downloadSiswaTemplate, exportSiswaToExcel } from '@/lib/import-excel';
import { createDataFormatif, createDataSumatif } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';

function DataSiswaContent() {
    const {
        identitas,
        siswaList,
        setSiswaList,
        addSiswa,
        removeSiswa,
        setDataFormatif,
        setDataSumatif
    } = useNilai();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSiswaChange = (id: string, field: 'nis' | 'nama', value: string) => {
        setSiswaList(siswaList.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const addMultipleSiswa = (count: number) => {
        for (let i = 0; i < count; i++) {
            addSiswa();
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const result = await importSiswaFromExcel(file);

        if (result.success && result.data.length > 0) {
            // Replace siswa list dengan data yang diimpor
            setSiswaList(result.data);

            // Generate data formatif dan sumatif baru untuk siswa yang diimpor
            const newFormatif = result.data.map(s => createDataFormatif(s.id, identitas.jumlahTP));
            const newSumatif = result.data.map(s => createDataSumatif(s.id, identitas.jumlahLM));

            setDataFormatif(newFormatif);
            setDataSumatif(newSumatif);

            setImportMessage({ type: 'success', text: result.message });
        } else {
            setImportMessage({ type: 'error', text: result.message });
        }

        // Reset input file
        e.target.value = '';

        // Clear message after 5 seconds
        setTimeout(() => setImportMessage(null), 5000);
    };

    const handleDownloadTemplate = () => {
        downloadSiswaTemplate();
        setImportMessage({ type: 'success', text: 'Template berhasil diunduh!' });
        setTimeout(() => setImportMessage(null), 3000);
    };

    const handleExportSiswa = () => {
        if (siswaList.length === 0 || !siswaList.some(s => s.nama)) {
            setImportMessage({ type: 'error', text: 'Tidak ada data siswa untuk disimpan!' });
            setTimeout(() => setImportMessage(null), 3000);
            return;
        }
        exportSiswaToExcel(siswaList, identitas.kelas);
        setImportMessage({ type: 'success', text: `Data ${siswaList.length} siswa berhasil disimpan!` });
        setTimeout(() => setImportMessage(null), 3000);
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Data Siswa</h1>
                <p>Kelola daftar siswa yang akan dinilai</p>
            </div>

            {/* Import/Export Card */}
            <div className="card" style={{ marginBottom: '1rem' }}>
                <h2 className="card-title">
                    <FileSpreadsheet size={20} />
                    Import dari Excel
                </h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button className="btn btn-success" onClick={handleImportClick}>
                        <Upload size={20} />
                        Import Siswa
                    </button>
                    <button className="btn btn-secondary" onClick={handleDownloadTemplate}>
                        <Download size={20} />
                        Download Template
                    </button>
                    <button className="btn btn-primary" onClick={handleExportSiswa}>
                        <Save size={20} />
                        Simpan Data Siswa
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                        Format: Excel (.xlsx, .xls)
                    </span>
                </div>

                {importMessage && (
                    <div
                        style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: importMessage.type === 'success'
                                ? 'rgba(34, 197, 94, 0.15)'
                                : 'rgba(239, 68, 68, 0.15)',
                            border: `1px solid ${importMessage.type === 'success' ? 'var(--secondary)' : 'var(--danger)'}`
                        }}
                    >
                        {importMessage.type === 'success'
                            ? <CheckCircle size={20} style={{ color: 'var(--secondary)' }} />
                            : <AlertCircle size={20} style={{ color: 'var(--danger)' }} />
                        }
                        <span>{importMessage.text}</span>
                    </div>
                )}
            </div>

            <div className="card">
                <h2 className="card-title">
                    <Users size={20} />
                    Daftar Siswa ({siswaList.length} siswa)
                </h2>

                <div className="btn-group" style={{ marginBottom: '1rem' }}>
                    <button className="btn btn-primary" onClick={addSiswa}>
                        <Plus size={20} />
                        Tambah 1 Siswa
                    </button>
                    <button className="btn btn-secondary" onClick={() => addMultipleSiswa(5)}>
                        <Plus size={20} />
                        Tambah 5 Siswa
                    </button>
                    <button className="btn btn-secondary" onClick={() => addMultipleSiswa(10)}>
                        <Plus size={20} />
                        Tambah 10 Siswa
                    </button>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                                <th style={{ width: '150px' }}>NIS</th>
                                <th>Nama Siswa</th>
                                <th style={{ width: '60px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {siswaList.map((siswa, index) => (
                                <tr key={siswa.id}>
                                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                                    <td>
                                        <input
                                            type="text"
                                            placeholder="Masukkan NIS"
                                            value={siswa.nis}
                                            onChange={(e) => handleSiswaChange(siswa.id, 'nis', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            className="name-input"
                                            placeholder="Masukkan nama lengkap siswa"
                                            value={siswa.nama}
                                            onChange={(e) => handleSiswaChange(siswa.id, 'nama', e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => removeSiswa(siswa.id)}
                                            title="Hapus siswa"
                                            disabled={siswaList.length <= 1}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="info-box">
                <p>💡 <strong>Tips:</strong></p>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                    <li>Data siswa akan otomatis tersinkronisasi ke halaman Nilai Formatif dan Nilai Sumatif</li>
                    <li>Gunakan <strong>Download Template</strong> untuk mendapatkan format Excel yang benar</li>
                    <li>Import akan menggantikan semua data siswa yang ada</li>
                </ul>
            </div>
        </div>
    );
}

export default function DataSiswaPage() {
    return (
        <AppLayout>
            <DataSiswaContent />
        </AppLayout>
    );
}

'use client';

import { FileText, Trash2, FileSpreadsheet, Printer } from 'lucide-react';
import { useNilai } from '@/lib/NilaiContext';
import {
    hitungNilaiAkhirSumatif,
    getPredikat,
    getDeskripsiPredikat,
    generateDeskripsiCapaian,
    formatTanggal
} from '@/lib/utils';
import { exportToExcel } from '@/lib/export-excel';
import AppLayout from '@/components/AppLayout';

function NilaiSumatifContent() {
    const {
        identitas,
        siswaList,
        setSiswaList,
        dataSumatif,
        setDataSumatif,
        removeSiswa
    } = useNilai();

    const handleSiswaChange = (id: string, field: 'nis' | 'nama', value: string) => {
        setSiswaList(siswaList.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleSLMChange = (siswaId: string, lmIndex: number, value: string) => {
        const numValue = value === '' ? 0 : Math.min(100, Math.max(0, parseInt(value) || 0));

        setDataSumatif(dataSumatif.map(ds => {
            if (ds.siswaId !== siswaId) return ds;

            const newNilaiSLM = [...ds.nilaiSLM];
            newNilaiSLM[lmIndex] = numValue;

            const nilaiAkhir = hitungNilaiAkhirSumatif(newNilaiSLM, ds.nilaiSAS);
            const predikat = getPredikat(nilaiAkhir);
            const siswa = siswaList.find(s => s.id === siswaId);
            const deskripsi = generateDeskripsiCapaian(siswa?.nama || '', predikat, identitas.mataPelajaran);

            return { ...ds, nilaiSLM: newNilaiSLM, nilaiAkhir, predikat, deskripsi };
        }));
    };

    const handleSASChange = (siswaId: string, value: string) => {
        const numValue = value === '' ? 0 : Math.min(100, Math.max(0, parseInt(value) || 0));

        setDataSumatif(dataSumatif.map(ds => {
            if (ds.siswaId !== siswaId) return ds;

            const nilaiAkhir = hitungNilaiAkhirSumatif(ds.nilaiSLM, numValue);
            const predikat = getPredikat(nilaiAkhir);
            const siswa = siswaList.find(s => s.id === siswaId);
            const deskripsi = generateDeskripsiCapaian(siswa?.nama || '', predikat, identitas.mataPelajaran);

            return { ...ds, nilaiSAS: numValue, nilaiAkhir, predikat, deskripsi };
        }));
    };

    const handleExportExcel = () => exportToExcel(siswaList, dataSumatif, identitas);
    const handlePrint = () => window.print();

    return (
        <div className="page-container">
            {/* Print Header */}
            <div className="print-header">
                <h2>DAFTAR NILAI ASESMEN SUMATIF</h2>
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
                            <td><strong>Mata Pelajaran</strong></td>
                            <td>:</td>
                            <td>{identitas.mataPelajaran || '-'}</td>
                            <td></td>
                            <td><strong>Guru Kelas</strong></td>
                            <td>:</td>
                            <td>{identitas.namaGuru || '-'}</td>
                        </tr>
                        <tr>
                            <td><strong>KKTP</strong></td>
                            <td>:</td>
                            <td>{identitas.kktp}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="page-header no-print">
                <h1>Nilai Sumatif</h1>
                <p>Penilaian SLM (Sumatif Lingkup Materi) dan SAS (Sumatif Akhir Semester)</p>
            </div>

            <div className="info-box no-print" style={{ marginBottom: '1rem' }}>
                <p>📊 <strong>Pembobotan:</strong> SLM = 60% | SAS = 40% | KKTP = {identitas.kktp}</p>
            </div>

            <div className="card">
                <h2 className="card-title no-print">
                    <FileText size={20} />
                    Daftar Nilai Sumatif
                </h2>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '35px', textAlign: 'center' }}>No</th>
                                <th style={{ width: '75px', textAlign: 'center' }}>NIS</th>
                                <th style={{ width: '140px' }}>Nama Siswa</th>
                                {Array.from({ length: identitas.jumlahLM }, (_, i) => (
                                    <th key={i} style={{ width: '55px', textAlign: 'center' }}>SLM {i + 1}</th>
                                ))}
                                <th style={{ width: '55px', textAlign: 'center' }}>SAS</th>
                                <th style={{ width: '70px', textAlign: 'center' }}>Nilai Akhir</th>
                                <th style={{ width: '60px', textAlign: 'center' }}>Predikat</th>
                                <th style={{ width: '90px', textAlign: 'center' }}>Ket.</th>
                                <th className="no-print" style={{ width: '35px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {siswaList.map((siswa, index) => {
                                const ds = dataSumatif.find(d => d.siswaId === siswa.id);
                                const isTuntas = ds && ds.nilaiAkhir >= identitas.kktp;

                                return (
                                    <tr key={siswa.id}>
                                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                                        <td>
                                            <input
                                                type="text"
                                                placeholder="NIS"
                                                value={siswa.nis}
                                                onChange={(e) => handleSiswaChange(siswa.id, 'nis', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="name-input"
                                                placeholder="Nama"
                                                value={siswa.nama}
                                                onChange={(e) => handleSiswaChange(siswa.id, 'nama', e.target.value)}
                                            />
                                        </td>
                                        {(ds?.nilaiSLM || []).map((nilai, lmIndex) => (
                                            <td key={lmIndex}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    placeholder="-"
                                                    value={nilai || ''}
                                                    onChange={(e) => handleSLMChange(siswa.id, lmIndex, e.target.value)}
                                                />
                                            </td>
                                        ))}
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                placeholder="-"
                                                value={ds?.nilaiSAS || ''}
                                                onChange={(e) => handleSASChange(siswa.id, e.target.value)}
                                                style={{ fontWeight: 'bold' }}
                                            />
                                        </td>
                                        <td>
                                            <div
                                                className="nilai-akhir"
                                                style={{
                                                    fontSize: '0.95rem',
                                                    color: ds && ds.nilaiAkhir > 0 ? (isTuntas ? 'var(--secondary)' : 'var(--danger)') : 'var(--primary)'
                                                }}
                                            >
                                                {ds && ds.nilaiAkhir > 0 ? ds.nilaiAkhir.toFixed(1) : '-'}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {ds && ds.predikat !== '-' ? (
                                                <span className={`predikat predikat-${ds.predikat.toLowerCase()}`}>
                                                    {ds.predikat}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>
                                            {ds && ds.predikat !== '-' ? getDeskripsiPredikat(ds.predikat) : '-'}
                                        </td>
                                        <td className="no-print">
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => removeSiswa(siswa.id)}
                                                title="Hapus"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="btn-group no-print">
                    <button className="btn btn-success" onClick={handleExportExcel}>
                        <FileSpreadsheet size={20} />
                        Export Excel
                    </button>
                    <button className="btn btn-warning" onClick={handlePrint}>
                        <Printer size={20} />
                        Cetak
                    </button>
                </div>
            </div>

            {/* Keterangan */}
            <div className="card no-print">
                <h2 className="card-title">Keterangan Predikat</h2>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="predikat predikat-a">A</span>
                        <span>90-100</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="predikat predikat-b">B</span>
                        <span>80-89</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="predikat predikat-c">C</span>
                        <span>70-79</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="predikat predikat-d">D</span>
                        <span>&lt;70</span>
                    </div>
                </div>
            </div>

            {/* Print Keterangan */}
            <div className="print-keterangan">
                <h3>Keterangan:</h3>
                <div className="print-keterangan-list">
                    <span><strong>SLM</strong> = Sumatif Lingkup Materi (60%)</span>
                    <span><strong>SAS</strong> = Sumatif Akhir Semester (40%)</span>
                    <span><strong>KKTP</strong> = {identitas.kktp}</span>
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
        </div>
    );
}

export default function NilaiSumatifPage() {
    return (
        <AppLayout>
            <NilaiSumatifContent />
        </AppLayout>
    );
}

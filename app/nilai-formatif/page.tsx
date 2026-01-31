'use client';

import { ClipboardList, Trash2, Printer } from 'lucide-react';
import { useNilai } from '@/lib/NilaiContext';
import { hitungRataRataFormatif, formatTanggal } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';

function NilaiFormatifContent() {
    const {
        identitas,
        siswaList,
        setSiswaList,
        dataFormatif,
        setDataFormatif,
        removeSiswa
    } = useNilai();

    const handleSiswaChange = (id: string, field: 'nis' | 'nama', value: string) => {
        setSiswaList(siswaList.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleNilaiChange = (siswaId: string, tpIndex: number, value: string) => {
        const numValue = value === '' ? 0 : Math.min(100, Math.max(0, parseInt(value) || 0));

        setDataFormatif(dataFormatif.map(df => {
            if (df.siswaId !== siswaId) return df;
            const newNilaiTP = [...df.nilaiTP];
            newNilaiTP[tpIndex] = numValue;
            return { ...df, nilaiTP: newNilaiTP };
        }));
    };

    const handleCatatanChange = (siswaId: string, value: string) => {
        setDataFormatif(dataFormatif.map(df =>
            df.siswaId === siswaId ? { ...df, catatan: value } : df
        ));
    };

    const handlePrint = () => window.print();

    return (
        <div className="page-container">
            {/* Print Header */}
            <div className="print-header">
                <h2>DAFTAR NILAI ASESMEN FORMATIF</h2>
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
                    </tbody>
                </table>
            </div>

            <div className="page-header no-print">
                <h1>Nilai Formatif</h1>
                <p>Penilaian per Tujuan Pembelajaran untuk umpan balik siswa</p>
            </div>

            <div className="info-box no-print" style={{ marginBottom: '1rem' }}>
                <p>💡 <strong>Catatan:</strong> Asesmen formatif digunakan untuk memantau perkembangan belajar siswa. Nilai ini <strong>tidak</strong> digunakan untuk menentukan kenaikan kelas.</p>
            </div>

            <div className="card">
                <h2 className="card-title no-print">
                    <ClipboardList size={20} />
                    Nilai per Tujuan Pembelajaran (TP)
                </h2>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                                <th style={{ width: '80px', textAlign: 'center' }}>NIS</th>
                                <th style={{ width: '160px' }}>Nama Siswa</th>
                                {Array.from({ length: identitas.jumlahTP }, (_, i) => (
                                    <th key={i} style={{ width: '55px', textAlign: 'center' }}>TP {i + 1}</th>
                                ))}
                                <th style={{ width: '70px', textAlign: 'center' }}>Rata-rata</th>
                                <th style={{ width: '180px' }} className="no-print">Catatan</th>
                                <th className="no-print" style={{ width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {siswaList.map((siswa, index) => {
                                const df = dataFormatif.find(d => d.siswaId === siswa.id);
                                const rataRata = df ? hitungRataRataFormatif(df.nilaiTP) : 0;

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
                                                placeholder="Nama siswa"
                                                value={siswa.nama}
                                                onChange={(e) => handleSiswaChange(siswa.id, 'nama', e.target.value)}
                                            />
                                        </td>
                                        {(df?.nilaiTP || []).map((nilai, tpIndex) => (
                                            <td key={tpIndex}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    placeholder="-"
                                                    value={nilai || ''}
                                                    onChange={(e) => handleNilaiChange(siswa.id, tpIndex, e.target.value)}
                                                />
                                            </td>
                                        ))}
                                        <td>
                                            <div className="nilai-akhir" style={{ fontSize: '0.95rem' }}>
                                                {rataRata > 0 ? rataRata.toFixed(1) : '-'}
                                            </div>
                                        </td>
                                        <td className="no-print">
                                            <input
                                                type="text"
                                                className="name-input"
                                                placeholder="Catatan..."
                                                value={df?.catatan || ''}
                                                onChange={(e) => handleCatatanChange(siswa.id, e.target.value)}
                                                style={{ fontSize: '0.85rem' }}
                                            />
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
                    <button className="btn btn-warning" onClick={handlePrint}>
                        <Printer size={20} />
                        Cetak
                    </button>
                </div>
            </div>

            {/* Print Keterangan */}
            <div className="print-keterangan">
                <p><strong>Keterangan:</strong> TP = Tujuan Pembelajaran</p>
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

export default function NilaiFormatifPage() {
    return (
        <AppLayout>
            <NilaiFormatifContent />
        </AppLayout>
    );
}

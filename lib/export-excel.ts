import * as XLSX from 'xlsx';
import { Siswa, DataSumatif, FormIdentitas, formatTanggal, getDeskripsiPredikat } from './utils';

/**
 * Export daftar nilai sumatif ke file Excel dengan format rapi
 */
export function exportToExcel(
    siswaList: Siswa[],
    dataSumatif: DataSumatif[],
    identitas: FormIdentitas
): void {
    const wb = XLSX.utils.book_new();

    // Filter siswa yang memiliki data
    const filteredSiswa = siswaList.filter(s => s.nama.trim() !== '' || s.nis.trim() !== '');
    const dataSiswa = filteredSiswa.length > 0 ? filteredSiswa : siswaList.slice(0, 1);

    // Hitung total kolom tabel
    const lmCount = identitas.jumlahLM;
    const tableColCount = 3 + lmCount + 4; // No, NIS, Nama + SLM + SAS, Nilai Akhir, Predikat, Keterangan

    const rows: string[][] = [];

    // === HEADER DOKUMEN ===
    rows.push(['DAFTAR NILAI ASESMEN SUMATIF']);
    rows.push(['KURIKULUM MERDEKA']);
    rows.push(['']);

    // === IDENTITAS ===
    rows.push(['Nama Sekolah', ':', identitas.namaSekolah || '-']);
    rows.push(['NPSN', ':', identitas.npsn || '-']);
    rows.push(['Kelas / Fase', ':', `${identitas.kelas || '-'} / Fase ${identitas.fase}`]);
    rows.push(['Mata Pelajaran', ':', identitas.mataPelajaran || '-']);
    rows.push(['Semester', ':', identitas.semester || '-']);
    rows.push(['Tahun Ajaran', ':', identitas.tahunAjaran || '-']);
    rows.push(['Guru Pengajar', ':', identitas.namaGuru || '-']);
    rows.push(['NIP', ':', identitas.nipGuru || '-']);
    rows.push(['KKTP', ':', String(identitas.kktp)]);
    rows.push(['']);

    // === HEADER TABEL ===
    const headerRow: string[] = ['No', 'NIS', 'Nama Siswa'];
    for (let i = 1; i <= lmCount; i++) {
        headerRow.push(`SLM ${i}`);
    }
    headerRow.push('SAS', 'Nilai Akhir', 'Predikat', 'Keterangan');
    rows.push(headerRow);

    // === DATA SISWA ===
    dataSiswa.forEach((siswa, index) => {
        const ds = dataSumatif.find(d => d.siswaId === siswa.id);

        const row: string[] = [
            String(index + 1),
            siswa.nis || '',
            siswa.nama || ''
        ];

        // SLM values
        (ds?.nilaiSLM || []).forEach(nilai => {
            row.push(nilai > 0 ? String(nilai) : '');
        });

        // SAS
        row.push(ds && ds.nilaiSAS > 0 ? String(ds.nilaiSAS) : '');

        // Nilai Akhir
        row.push(ds && ds.nilaiAkhir > 0 ? ds.nilaiAkhir.toFixed(1) : '');

        // Predikat
        row.push(ds && ds.predikat !== '-' ? ds.predikat : '');

        // Keterangan
        row.push(ds && ds.predikat !== '-' ? getDeskripsiPredikat(ds.predikat) : '');

        rows.push(row);
    });

    // === STATISTIK ===
    rows.push(['']);

    const nilaiValid = dataSumatif.map(ds => ds.nilaiAkhir).filter(n => n > 0);
    if (nilaiValid.length > 0) {
        const rataRata = nilaiValid.reduce((a, b) => a + b, 0) / nilaiValid.length;
        const tuntas = nilaiValid.filter(n => n >= identitas.kktp).length;
        const belumTuntas = nilaiValid.length - tuntas;

        rows.push(['STATISTIK']);
        rows.push(['Rata-rata Kelas', ':', (Math.round(rataRata * 100) / 100).toFixed(2)]);
        rows.push(['Nilai Tertinggi', ':', String(Math.max(...nilaiValid))]);
        rows.push(['Nilai Terendah', ':', String(Math.min(...nilaiValid))]);
        rows.push(['Jumlah Siswa', ':', String(dataSiswa.length)]);
        rows.push(['Tuntas (≥ KKTP)', ':', `${tuntas} siswa`]);
        rows.push(['Belum Tuntas', ':', `${belumTuntas} siswa`]);
        rows.push(['Persentase Ketuntasan', ':', `${((tuntas / nilaiValid.length) * 100).toFixed(1)}%`]);
    }

    // === KETERANGAN ===
    rows.push(['']);
    rows.push(['KETERANGAN:']);
    rows.push(['SLM = Sumatif Lingkup Materi (Bobot 60%)']);
    rows.push(['SAS = Sumatif Akhir Semester (Bobot 40%)']);
    rows.push(['A = 90-100 (Sangat Baik)', 'B = 80-89 (Baik)', 'C = 70-79 (Cukup)', 'D = <70 (Perlu Bimbingan)']);

    // === TANDA TANGAN ===
    rows.push(['']);
    rows.push(['']);

    const signRow1: string[] = Array(tableColCount).fill('');
    signRow1[tableColCount - 3] = `${identitas.namaSekolah || '...............'}, ${formatTanggal()}`;
    rows.push(signRow1);

    const signRow2: string[] = Array(tableColCount).fill('');
    signRow2[tableColCount - 3] = 'Guru Mata Pelajaran,';
    rows.push(signRow2);

    rows.push(Array(tableColCount).fill(''));
    rows.push(Array(tableColCount).fill(''));
    rows.push(Array(tableColCount).fill(''));

    const signRow3: string[] = Array(tableColCount).fill('');
    signRow3[tableColCount - 3] = identitas.namaGuru || '...............';
    rows.push(signRow3);

    if (identitas.nipGuru) {
        const signRow4: string[] = Array(tableColCount).fill('');
        signRow4[tableColCount - 3] = `NIP. ${identitas.nipGuru}`;
        rows.push(signRow4);
    }

    // Buat worksheet
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Set lebar kolom
    const colWidths: XLSX.ColInfo[] = [
        { wch: 5 },   // No
        { wch: 15 },  // NIS  
        { wch: 30 },  // Nama Siswa
    ];
    for (let i = 0; i < lmCount; i++) {
        colWidths.push({ wch: 8 }); // SLM
    }
    colWidths.push({ wch: 8 });  // SAS
    colWidths.push({ wch: 12 }); // Nilai Akhir
    colWidths.push({ wch: 10 }); // Predikat
    colWidths.push({ wch: 18 }); // Keterangan

    ws['!cols'] = colWidths;

    // Merge cells untuk judul
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: tableColCount - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: tableColCount - 1 } },
    ];

    // Tambahkan ke workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Nilai Sumatif');

    // Generate nama file
    const safeKelas = (identitas.kelas || 'Kelas').replace(/[^a-zA-Z0-9]/g, '_');
    const safeMapel = (identitas.mataPelajaran || 'Mapel').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Nilai_Sumatif_${safeKelas}_${safeMapel}.xlsx`;

    // Download
    XLSX.writeFile(wb, fileName);
}

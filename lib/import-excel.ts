import * as XLSX from 'xlsx';
import { Siswa, generateId } from './utils';

export interface ImportResult {
    success: boolean;
    data: Siswa[];
    message: string;
}

/**
 * Import data siswa dari file Excel
 */
export async function importSiswaFromExcel(file: File): Promise<ImportResult> {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                // Ambil sheet pertama
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert ke JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                // Skip header row, mulai dari baris 1
                const siswaList: Siswa[] = [];

                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (row && row.length >= 2) {
                        // Kolom expected: No, NIS, Nama Siswa
                        // atau: NIS, Nama Siswa
                        let nis = '';
                        let nama = '';

                        if (row.length >= 3) {
                            // Format: No, NIS, Nama
                            nis = String(row[1] || '').trim();
                            nama = String(row[2] || '').trim();
                        } else {
                            // Format: NIS, Nama
                            nis = String(row[0] || '').trim();
                            nama = String(row[1] || '').trim();
                        }

                        if (nama) {
                            siswaList.push({
                                id: generateId(),
                                nis,
                                nama
                            });
                        }
                    }
                }

                if (siswaList.length === 0) {
                    resolve({
                        success: false,
                        data: [],
                        message: 'Tidak ada data siswa yang valid ditemukan dalam file.'
                    });
                } else {
                    resolve({
                        success: true,
                        data: siswaList,
                        message: `Berhasil mengimpor ${siswaList.length} siswa.`
                    });
                }
            } catch (error) {
                resolve({
                    success: false,
                    data: [],
                    message: 'Gagal membaca file Excel. Pastikan format file benar.'
                });
            }
        };

        reader.onerror = () => {
            resolve({
                success: false,
                data: [],
                message: 'Gagal membaca file.'
            });
        };

        reader.readAsBinaryString(file);
    });
}

/**
 * Generate dan download template Excel untuk import siswa
 */
export function downloadSiswaTemplate() {
    // Buat workbook baru
    const wb = XLSX.utils.book_new();

    // Data template dengan contoh
    const templateData = [
        ['No', 'NIS', 'Nama Siswa'],
        [1, '12345', 'Ahmad Rizky'],
        [2, '12346', 'Budi Santoso'],
        [3, '12347', 'Citra Dewi'],
        [4, '', ''],
        [5, '', ''],
    ];

    // Buat worksheet
    const ws = XLSX.utils.aoa_to_array ?
        XLSX.utils.aoa_to_sheet(templateData) :
        XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths
    ws['!cols'] = [
        { wch: 5 },  // No
        { wch: 15 }, // NIS
        { wch: 35 }, // Nama Siswa
    ];

    // Tambahkan worksheet ke workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');

    // Download file
    XLSX.writeFile(wb, 'Template_Data_Siswa.xlsx');
}

/**
 * Export data siswa ke file Excel
 */
export function exportSiswaToExcel(siswaList: Siswa[], kelas?: string) {
    // Buat workbook baru
    const wb = XLSX.utils.book_new();

    // Data siswa dengan header
    const excelData: any[][] = [
        ['No', 'NIS', 'Nama Siswa'],
    ];

    siswaList.forEach((siswa, index) => {
        excelData.push([
            index + 1,
            siswa.nis || '',
            siswa.nama || ''
        ]);
    });

    // Buat worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
        { wch: 5 },  // No
        { wch: 15 }, // NIS
        { wch: 40 }, // Nama Siswa
    ];

    // Tambahkan worksheet ke workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');

    // Generate filename
    const filename = kelas
        ? `Data_Siswa_${kelas.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
        : 'Data_Siswa.xlsx';

    // Download file
    XLSX.writeFile(wb, filename);
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { UserCheck, Printer, Save, RotateCcw, Calendar, ChevronLeft, ChevronRight, Calculator } from 'lucide-react';
import { useNilai } from '@/lib/NilaiContext';
import { formatTanggal, generateId } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';

const ABSENSI_GURU_KEY = 'absensi-guru-harian-data';

// Hari libur nasional & cuti bersama semester 1 2025/2026
const HARI_LIBUR: Record<string, string> = {
    '2025-07-14': 'MPLS', // Hari pertama sekolah (tetap masuk)
    '2025-08-17': 'Hari Kemerdekaan RI',
    '2025-08-18': 'Cuti Bersama Kemerdekaan',
    '2025-09-05': 'Maulid Nabi Muhammad SAW',
    '2025-12-25': 'Hari Raya Natal',
    '2025-12-26': 'Cuti Bersama Natal',
    '2026-01-01': 'Tahun Baru 2026'
};

// Libur akhir semester: 22-31 Desember 2025
const LIBUR_SEMESTER: string[] = [];
for (let d = 22; d <= 31; d++) {
    LIBUR_SEMESTER.push(`2025-12-${d.toString().padStart(2, '0')}`);
}
// Tambahan libur awal Januari 2026 (jika masih libur)
LIBUR_SEMESTER.push('2026-01-02', '2026-01-03');

const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

type StatusKehadiran = 'H' | 'S' | 'I' | 'C' | 'DL' | 'TK' | '';

interface AbsensiHarian {
    id: string;
    tanggal: string; // YYYY-MM-DD
    jamMasuk: string;
    jamPulang: string;
    status: StatusKehadiran;
    keterangan: string;
}

function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Minggu atau Sabtu
}

function isHoliday(dateKey: string): boolean {
    return HARI_LIBUR[dateKey] !== undefined || LIBUR_SEMESTER.includes(dateKey);
}

function getHolidayName(dateKey: string): string {
    if (HARI_LIBUR[dateKey]) return HARI_LIBUR[dateKey];
    if (LIBUR_SEMESTER.includes(dateKey)) return 'Libur Semester';
    return '';
}

function generateMonthDays(year: number, month: number): Date[] {
    const days: Date[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    for (let d = firstDay.getDate(); d <= lastDay.getDate(); d++) {
        days.push(new Date(year, month, d));
    }
    return days;
}

function AbsensiGuruContent() {
    const { identitas } = useNilai();
    // Bulan yang tersedia: {month, year}
    const availableMonths = [
        { month: 5, year: 2025, label: 'Juni 2025' },
        { month: 6, year: 2025, label: 'Juli 2025' },
        { month: 7, year: 2025, label: 'Agustus 2025' },
        { month: 8, year: 2025, label: 'September 2025' },
        { month: 9, year: 2025, label: 'Oktober 2025' },
        { month: 10, year: 2025, label: 'November 2025' },
        { month: 11, year: 2025, label: 'Desember 2025' },
        { month: 0, year: 2026, label: 'Januari 2026' }
    ];

    const [currentIndex, setCurrentIndex] = useState(7); // Default Januari 2026
    const currentMonth = availableMonths[currentIndex].month;
    const currentYear = availableMonths[currentIndex].year;
    const currentLabel = availableMonths[currentIndex].label;

    const [absensiData, setAbsensiData] = useState<Record<string, AbsensiHarian>>({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    // Load data
    useEffect(() => {
        try {
            const saved = localStorage.getItem(ABSENSI_GURU_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                setAbsensiData(data.absensi || {});
                setLastSaved(data.savedAt);
            }
        } catch (error) {
            console.error('Error loading:', error);
        }
        setIsLoaded(true);
    }, []);

    // Auto-save
    useEffect(() => {
        if (isLoaded) {
            const timeout = setTimeout(() => saveData(), 1000);
            return () => clearTimeout(timeout);
        }
    }, [absensiData, isLoaded]);

    const saveData = () => {
        try {
            const data = {
                absensi: absensiData,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(ABSENSI_GURU_KEY, JSON.stringify(data));
            setLastSaved(data.savedAt);
        } catch (error) {
            console.error('Error saving:', error);
        }
    };

    // Days in current month
    const monthDays = useMemo(() => {
        return generateMonthDays(currentYear, currentMonth);
    }, [currentYear, currentMonth]);

    // Working days only (exclude weekends and holidays)
    const workingDays = useMemo(() => {
        return monthDays.filter(date => {
            const dateKey = formatDateKey(date);
            // Skip weekends
            if (isWeekend(date)) return false;
            // Skip holidays (except MPLS which is work day)
            if (isHoliday(dateKey) && dateKey !== '2025-07-14') return false;
            return true;
        });
    }, [monthDays]);

    const handleChange = (dateKey: string, field: keyof AbsensiHarian, value: string) => {
        setAbsensiData(prev => {
            const existing = prev[dateKey] || {
                id: generateId(),
                tanggal: dateKey,
                jamMasuk: '07:00',
                jamPulang: '14:00',
                status: 'H',
                keterangan: ''
            };
            return {
                ...prev,
                [dateKey]: { ...existing, [field]: value }
            };
        });
    };

    const getAbsensi = (dateKey: string): AbsensiHarian => {
        return absensiData[dateKey] || {
            id: generateId(),
            tanggal: dateKey,
            jamMasuk: '07:00',
            jamPulang: '14:00',
            status: 'H',
            keterangan: ''
        };
    };

    const resetData = () => {
        if (confirm('Reset semua data absensi bulan ini?')) {
            setAbsensiData(prev => {
                const newData = { ...prev };
                workingDays.forEach(date => {
                    delete newData[formatDateKey(date)];
                });
                return newData;
            });
        }
    };

    // Data Juli 2025 dari sistem absensi (sesuai gambar, TAP/TAM diperbaiki)
    const loadJuliData = () => {
        const juliData: Record<string, AbsensiHarian> = {
            '2025-07-01': { id: generateId(), tanggal: '2025-07-01', jamMasuk: '07:02', jamPulang: '17:44', status: 'H', keterangan: 'Terlambat' },
            '2025-07-02': { id: generateId(), tanggal: '2025-07-02', jamMasuk: '06:50', jamPulang: '16:56', status: 'H', keterangan: '' },
            '2025-07-03': { id: generateId(), tanggal: '2025-07-03', jamMasuk: '06:38', jamPulang: '16:44', status: 'H', keterangan: '' },
            '2025-07-04': { id: generateId(), tanggal: '2025-07-04', jamMasuk: '06:41', jamPulang: '11:26', status: 'H', keterangan: '' },
            '2025-07-07': { id: generateId(), tanggal: '2025-07-07', jamMasuk: '06:40', jamPulang: '14:33', status: 'H', keterangan: '' },
            '2025-07-08': { id: generateId(), tanggal: '2025-07-08', jamMasuk: '06:32', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-07-09': { id: generateId(), tanggal: '2025-07-09', jamMasuk: '06:43', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-07-10': { id: generateId(), tanggal: '2025-07-10', jamMasuk: '06:45', jamPulang: '14:00', status: 'DD', keterangan: 'Dinas Dalam' },
            '2025-07-11': { id: generateId(), tanggal: '2025-07-11', jamMasuk: '06:54', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-07-14': { id: generateId(), tanggal: '2025-07-14', jamMasuk: '06:53', jamPulang: '14:07', status: 'H', keterangan: 'MPLS' },
            '2025-07-15': { id: generateId(), tanggal: '2025-07-15', jamMasuk: '06:57', jamPulang: '14:03', status: 'H', keterangan: '' },
            '2025-07-16': { id: generateId(), tanggal: '2025-07-16', jamMasuk: '05:45', jamPulang: '14:07', status: 'H', keterangan: '' },
            '2025-07-17': { id: generateId(), tanggal: '2025-07-17', jamMasuk: '06:43', jamPulang: '14:06', status: 'H', keterangan: '' },
            '2025-07-18': { id: generateId(), tanggal: '2025-07-18', jamMasuk: '06:52', jamPulang: '11:30', status: 'H', keterangan: '' },
            '2025-07-21': { id: generateId(), tanggal: '2025-07-21', jamMasuk: '06:50', jamPulang: '14:00', status: 'DD', keterangan: 'Dinas Dalam' },
            '2025-07-22': { id: generateId(), tanggal: '2025-07-22', jamMasuk: '06:47', jamPulang: '14:03', status: 'H', keterangan: '' },
            '2025-07-23': { id: generateId(), tanggal: '2025-07-23', jamMasuk: '06:55', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-07-24': { id: generateId(), tanggal: '2025-07-24', jamMasuk: '07:08', jamPulang: '14:03', status: 'H', keterangan: 'Terlambat' },
            '2025-07-25': { id: generateId(), tanggal: '2025-07-25', jamMasuk: '07:00', jamPulang: '11:30', status: 'H', keterangan: '' },
            '2025-07-28': { id: generateId(), tanggal: '2025-07-28', jamMasuk: '07:13', jamPulang: '17:21', status: 'H', keterangan: 'Terlambat' },
            '2025-07-29': { id: generateId(), tanggal: '2025-07-29', jamMasuk: '06:57', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-07-30': { id: generateId(), tanggal: '2025-07-30', jamMasuk: '06:59', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-07-31': { id: generateId(), tanggal: '2025-07-31', jamMasuk: '06:53', jamPulang: '14:07', status: 'H', keterangan: '' }
        };

        setAbsensiData(prev => ({ ...prev, ...juliData }));
        alert('Data Juli 2025 berhasil dimuat!');
    };

    // Data Agustus 2025 dari sistem absensi (sesuai gambar, TAP/TAM/Alpha diperbaiki)
    const loadAgustusData = () => {
        const agustusData: Record<string, AbsensiHarian> = {
            '2025-08-01': { id: generateId(), tanggal: '2025-08-01', jamMasuk: '06:45', jamPulang: '14:00', status: 'DD', keterangan: 'Dinas Dalam' },
            '2025-08-04': { id: generateId(), tanggal: '2025-08-04', jamMasuk: '07:04', jamPulang: '15:08', status: 'H', keterangan: 'Terlambat' },
            '2025-08-05': { id: generateId(), tanggal: '2025-08-05', jamMasuk: '07:02', jamPulang: '14:12', status: 'H', keterangan: 'Terlambat' },
            '2025-08-06': { id: generateId(), tanggal: '2025-08-06', jamMasuk: '06:50', jamPulang: '14:53', status: 'DD', keterangan: 'Dinas Dalam' },
            '2025-08-07': { id: generateId(), tanggal: '2025-08-07', jamMasuk: '07:03', jamPulang: '14:00', status: 'DD', keterangan: 'Dinas Dalam' },
            '2025-08-08': { id: generateId(), tanggal: '2025-08-08', jamMasuk: '06:52', jamPulang: '11:34', status: 'H', keterangan: '' },
            '2025-08-11': { id: generateId(), tanggal: '2025-08-11', jamMasuk: '07:47', jamPulang: '14:00', status: 'H', keterangan: 'Terlambat' },
            '2025-08-12': { id: generateId(), tanggal: '2025-08-12', jamMasuk: '06:48', jamPulang: '14:21', status: 'H', keterangan: '' },
            '2025-08-13': { id: generateId(), tanggal: '2025-08-13', jamMasuk: '06:58', jamPulang: '14:40', status: 'H', keterangan: '' },
            '2025-08-14': { id: generateId(), tanggal: '2025-08-14', jamMasuk: '06:52', jamPulang: '14:02', status: 'H', keterangan: '' },
            '2025-08-15': { id: generateId(), tanggal: '2025-08-15', jamMasuk: '07:01', jamPulang: '11:02', status: 'H', keterangan: 'Terlambat' },
            '2025-08-19': { id: generateId(), tanggal: '2025-08-19', jamMasuk: '06:46', jamPulang: '14:02', status: 'H', keterangan: '' },
            '2025-08-20': { id: generateId(), tanggal: '2025-08-20', jamMasuk: '06:42', jamPulang: '16:07', status: 'H', keterangan: '' },
            '2025-08-21': { id: generateId(), tanggal: '2025-08-21', jamMasuk: '05:59', jamPulang: '14:09', status: 'H', keterangan: '' },
            '2025-08-22': { id: generateId(), tanggal: '2025-08-22', jamMasuk: '06:48', jamPulang: '11:00', status: 'H', keterangan: '' },
            '2025-08-25': { id: generateId(), tanggal: '2025-08-25', jamMasuk: '06:40', jamPulang: '14:01', status: 'H', keterangan: '' },
            '2025-08-26': { id: generateId(), tanggal: '2025-08-26', jamMasuk: '06:59', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-08-27': { id: generateId(), tanggal: '2025-08-27', jamMasuk: '06:50', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-08-28': { id: generateId(), tanggal: '2025-08-28', jamMasuk: '07:01', jamPulang: '14:00', status: 'H', keterangan: 'Terlambat' },
            '2025-08-29': { id: generateId(), tanggal: '2025-08-29', jamMasuk: '07:27', jamPulang: '11:02', status: 'H', keterangan: 'Terlambat' }
        };

        setAbsensiData(prev => ({ ...prev, ...agustusData }));
        alert('Data Agustus 2025 berhasil dimuat!');
    };

    // Data September 2025 dari sistem absensi (sesuai gambar, TAP/TAM/Alpha diperbaiki)
    const loadSeptemberData = () => {
        const septemberData: Record<string, AbsensiHarian> = {
            '2025-09-01': { id: generateId(), tanggal: '2025-09-01', jamMasuk: '07:03', jamPulang: '14:04', status: 'H', keterangan: 'Terlambat' },
            '2025-09-02': { id: generateId(), tanggal: '2025-09-02', jamMasuk: '06:51', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-09-03': { id: generateId(), tanggal: '2025-09-03', jamMasuk: '06:50', jamPulang: '14:00', status: 'DD', keterangan: 'Dinas Dalam' },
            '2025-09-04': { id: generateId(), tanggal: '2025-09-04', jamMasuk: '06:53', jamPulang: '14:06', status: 'H', keterangan: '' },
            '2025-09-08': { id: generateId(), tanggal: '2025-09-08', jamMasuk: '06:48', jamPulang: '14:10', status: 'H', keterangan: '' },
            '2025-09-09': { id: generateId(), tanggal: '2025-09-09', jamMasuk: '07:00', jamPulang: '14:00', status: 'H', keterangan: 'Terlambat' },
            '2025-09-10': { id: generateId(), tanggal: '2025-09-10', jamMasuk: '07:02', jamPulang: '14:00', status: 'H', keterangan: 'Terlambat' },
            '2025-09-11': { id: generateId(), tanggal: '2025-09-11', jamMasuk: '07:37', jamPulang: '14:00', status: 'DD', keterangan: 'Dinas Dalam' },
            '2025-09-12': { id: generateId(), tanggal: '2025-09-12', jamMasuk: '06:50', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-09-13': { id: generateId(), tanggal: '2025-09-13', jamMasuk: '06:58', jamPulang: '12:49', status: 'H', keterangan: '' },
            '2025-09-15': { id: generateId(), tanggal: '2025-09-15', jamMasuk: '08:18', jamPulang: '14:00', status: 'H', keterangan: 'Terlambat' },
            '2025-09-16': { id: generateId(), tanggal: '2025-09-16', jamMasuk: '06:56', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-09-17': { id: generateId(), tanggal: '2025-09-17', jamMasuk: '07:02', jamPulang: '14:00', status: 'H', keterangan: 'Terlambat' },
            '2025-09-18': { id: generateId(), tanggal: '2025-09-18', jamMasuk: '07:07', jamPulang: '17:12', status: 'H', keterangan: 'Terlambat' },
            '2025-09-19': { id: generateId(), tanggal: '2025-09-19', jamMasuk: '07:00', jamPulang: '11:17', status: 'H', keterangan: '' },
            '2025-09-22': { id: generateId(), tanggal: '2025-09-22', jamMasuk: '06:50', jamPulang: '14:00', status: 'DD', keterangan: 'Dinas Dalam' },
            '2025-09-23': { id: generateId(), tanggal: '2025-09-23', jamMasuk: '06:50', jamPulang: '14:00', status: 'DD', keterangan: 'Dinas Dalam' },
            '2025-09-24': { id: generateId(), tanggal: '2025-09-24', jamMasuk: '06:52', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-09-25': { id: generateId(), tanggal: '2025-09-25', jamMasuk: '07:16', jamPulang: '14:00', status: 'H', keterangan: 'Terlambat' },
            '2025-09-26': { id: generateId(), tanggal: '2025-09-26', jamMasuk: '06:51', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-09-29': { id: generateId(), tanggal: '2025-09-29', jamMasuk: '07:20', jamPulang: '14:00', status: 'H', keterangan: 'Terlambat' },
            '2025-09-30': { id: generateId(), tanggal: '2025-09-30', jamMasuk: '06:50', jamPulang: '14:00', status: 'H', keterangan: '' }
        };
        setAbsensiData(prev => ({ ...prev, ...septemberData }));
        alert('Data September 2025 berhasil dimuat!');
    };

    // Data Oktober 2025 dari sistem absensi (sesuai gambar, TAP/TAM diperbaiki)
    const loadOktoberData = () => {
        const oktoberData: Record<string, AbsensiHarian> = {
            '2025-10-01': { id: generateId(), tanggal: '2025-10-01', jamMasuk: '', jamPulang: '', status: 'C', keterangan: 'Cuti' },
            '2025-10-02': { id: generateId(), tanggal: '2025-10-02', jamMasuk: '', jamPulang: '', status: 'C', keterangan: 'Cuti' },
            '2025-10-03': { id: generateId(), tanggal: '2025-10-03', jamMasuk: '', jamPulang: '', status: 'C', keterangan: 'Cuti' },
            '2025-10-06': { id: generateId(), tanggal: '2025-10-06', jamMasuk: '06:46', jamPulang: '14:02', status: 'H', keterangan: '' },
            '2025-10-07': { id: generateId(), tanggal: '2025-10-07', jamMasuk: '', jamPulang: '', status: 'S', keterangan: 'Sakit' },
            '2025-10-08': { id: generateId(), tanggal: '2025-10-08', jamMasuk: '06:21', jamPulang: '14:02', status: 'H', keterangan: '' },
            '2025-10-09': { id: generateId(), tanggal: '2025-10-09', jamMasuk: '06:53', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-10-10': { id: generateId(), tanggal: '2025-10-10', jamMasuk: '06:49', jamPulang: '11:04', status: 'H', keterangan: '' },
            '2025-10-13': { id: generateId(), tanggal: '2025-10-13', jamMasuk: '06:37', jamPulang: '16:05', status: 'H', keterangan: '' },
            '2025-10-14': { id: generateId(), tanggal: '2025-10-14', jamMasuk: '06:30', jamPulang: '14:06', status: 'H', keterangan: '' },
            '2025-10-15': { id: generateId(), tanggal: '2025-10-15', jamMasuk: '07:01', jamPulang: '14:00', status: 'H', keterangan: 'Terlambat' },
            '2025-10-16': { id: generateId(), tanggal: '2025-10-16', jamMasuk: '06:47', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-10-17': { id: generateId(), tanggal: '2025-10-17', jamMasuk: '06:56', jamPulang: '11:21', status: 'H', keterangan: '' },
            '2025-10-20': { id: generateId(), tanggal: '2025-10-20', jamMasuk: '06:37', jamPulang: '14:02', status: 'H', keterangan: '' },
            '2025-10-21': { id: generateId(), tanggal: '2025-10-21', jamMasuk: '06:31', jamPulang: '14:06', status: 'H', keterangan: '' },
            '2025-10-22': { id: generateId(), tanggal: '2025-10-22', jamMasuk: '06:44', jamPulang: '14:01', status: 'H', keterangan: '' },
            '2025-10-23': { id: generateId(), tanggal: '2025-10-23', jamMasuk: '06:53', jamPulang: '14:11', status: 'H', keterangan: '' },
            '2025-10-24': { id: generateId(), tanggal: '2025-10-24', jamMasuk: '06:50', jamPulang: '14:00', status: 'DD', keterangan: 'Dinas Dalam' },
            '2025-10-27': { id: generateId(), tanggal: '2025-10-27', jamMasuk: '06:52', jamPulang: '14:02', status: 'H', keterangan: '' },
            '2025-10-28': { id: generateId(), tanggal: '2025-10-28', jamMasuk: '06:55', jamPulang: '14:03', status: 'H', keterangan: '' },
            '2025-10-29': { id: generateId(), tanggal: '2025-10-29', jamMasuk: '06:58', jamPulang: '14:57', status: 'H', keterangan: '' },
            '2025-10-30': { id: generateId(), tanggal: '2025-10-30', jamMasuk: '06:50', jamPulang: '14:01', status: 'H', keterangan: '' },
            '2025-10-31': { id: generateId(), tanggal: '2025-10-31', jamMasuk: '06:49', jamPulang: '14:00', status: 'DD', keterangan: 'Dinas Dalam' }
        };
        setAbsensiData(prev => ({ ...prev, ...oktoberData }));
        alert('Data Oktober 2025 berhasil dimuat!');
    };

    // Data November 2025 dari sistem absensi (sesuai gambar, TAP/TAM diperbaiki)
    const loadNovemberData = () => {
        const novemberData: Record<string, AbsensiHarian> = {
            '2025-11-03': { id: generateId(), tanggal: '2025-11-03', jamMasuk: '06:34', jamPulang: '16:08', status: 'H', keterangan: '' },
            '2025-11-04': { id: generateId(), tanggal: '2025-11-04', jamMasuk: '06:44', jamPulang: '14:00', status: 'DD', keterangan: 'Dinas Dalam' },
            '2025-11-05': { id: generateId(), tanggal: '2025-11-05', jamMasuk: '06:47', jamPulang: '14:01', status: 'H', keterangan: '' },
            '2025-11-06': { id: generateId(), tanggal: '2025-11-06', jamMasuk: '06:41', jamPulang: '15:50', status: 'H', keterangan: '' },
            '2025-11-07': { id: generateId(), tanggal: '2025-11-07', jamMasuk: '06:59', jamPulang: '11:01', status: 'H', keterangan: '' },
            '2025-11-10': { id: generateId(), tanggal: '2025-11-10', jamMasuk: '07:21', jamPulang: '14:27', status: 'H', keterangan: 'Terlambat' },
            '2025-11-11': { id: generateId(), tanggal: '2025-11-11', jamMasuk: '06:34', jamPulang: '14:00', status: 'DD', keterangan: 'Dinas Dalam' },
            '2025-11-12': { id: generateId(), tanggal: '2025-11-12', jamMasuk: '06:53', jamPulang: '14:02', status: 'H', keterangan: '' },
            '2025-11-13': { id: generateId(), tanggal: '2025-11-13', jamMasuk: '07:00', jamPulang: '14:00', status: 'DD', keterangan: 'Dinas Dalam' },
            '2025-11-14': { id: generateId(), tanggal: '2025-11-14', jamMasuk: '06:50', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-11-15': { id: generateId(), tanggal: '2025-11-15', jamMasuk: '06:55', jamPulang: '13:20', status: 'H', keterangan: '' },
            '2025-11-17': { id: generateId(), tanggal: '2025-11-17', jamMasuk: '06:28', jamPulang: '16:43', status: 'H', keterangan: '' },
            '2025-11-18': { id: generateId(), tanggal: '2025-11-18', jamMasuk: '06:54', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-11-19': { id: generateId(), tanggal: '2025-11-19', jamMasuk: '06:46', jamPulang: '14:04', status: 'H', keterangan: '' },
            '2025-11-20': { id: generateId(), tanggal: '2025-11-20', jamMasuk: '06:50', jamPulang: '14:00', status: 'DD', keterangan: 'Dinas Dalam' },
            '2025-11-21': { id: generateId(), tanggal: '2025-11-21', jamMasuk: '06:39', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-11-24': { id: generateId(), tanggal: '2025-11-24', jamMasuk: '06:55', jamPulang: '15:04', status: 'H', keterangan: '' },
            '2025-11-25': { id: generateId(), tanggal: '2025-11-25', jamMasuk: '06:53', jamPulang: '14:00', status: 'DD', keterangan: 'Dinas Dalam' },
            '2025-11-26': { id: generateId(), tanggal: '2025-11-26', jamMasuk: '06:53', jamPulang: '14:01', status: 'H', keterangan: '' },
            '2025-11-27': { id: generateId(), tanggal: '2025-11-27', jamMasuk: '06:50', jamPulang: '14:00', status: 'DD', keterangan: 'Dinas Dalam' },
            '2025-11-28': { id: generateId(), tanggal: '2025-11-28', jamMasuk: '06:45', jamPulang: '11:02', status: 'H', keterangan: '' }
        };
        setAbsensiData(prev => ({ ...prev, ...novemberData }));
        alert('Data November 2025 berhasil dimuat!');
    };

    // Data Desember 2025 dari sistem absensi (sesuai gambar, TAP/TAM diperbaiki)
    const loadDesemberData = () => {
        const desemberData: Record<string, AbsensiHarian> = {
            '2025-12-01': { id: generateId(), tanggal: '2025-12-01', jamMasuk: '06:43', jamPulang: '14:04', status: 'H', keterangan: '' },
            '2025-12-02': { id: generateId(), tanggal: '2025-12-02', jamMasuk: '', jamPulang: '', status: 'S', keterangan: 'Sakit' },
            '2025-12-03': { id: generateId(), tanggal: '2025-12-03', jamMasuk: '06:36', jamPulang: '14:02', status: 'H', keterangan: '' },
            '2025-12-04': { id: generateId(), tanggal: '2025-12-04', jamMasuk: '06:55', jamPulang: '14:05', status: 'H', keterangan: '' },
            '2025-12-05': { id: generateId(), tanggal: '2025-12-05', jamMasuk: '06:41', jamPulang: '11:13', status: 'H', keterangan: '' },
            '2025-12-08': { id: generateId(), tanggal: '2025-12-08', jamMasuk: '06:45', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-12-09': { id: generateId(), tanggal: '2025-12-09', jamMasuk: '06:56', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-12-10': { id: generateId(), tanggal: '2025-12-10', jamMasuk: '07:05', jamPulang: '14:19', status: 'H', keterangan: 'Terlambat' },
            '2025-12-11': { id: generateId(), tanggal: '2025-12-11', jamMasuk: '07:07', jamPulang: '14:00', status: 'H', keterangan: 'Terlambat' },
            '2025-12-12': { id: generateId(), tanggal: '2025-12-12', jamMasuk: '06:43', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-12-15': { id: generateId(), tanggal: '2025-12-15', jamMasuk: '06:58', jamPulang: '14:01', status: 'H', keterangan: '' },
            '2025-12-16': { id: generateId(), tanggal: '2025-12-16', jamMasuk: '06:50', jamPulang: '14:00', status: 'DD', keterangan: 'Dinas Dalam' },
            '2025-12-17': { id: generateId(), tanggal: '2025-12-17', jamMasuk: '06:45', jamPulang: '14:00', status: 'H', keterangan: '' },
            '2025-12-18': { id: generateId(), tanggal: '2025-12-18', jamMasuk: '06:25', jamPulang: '14:02', status: 'H', keterangan: '' },
            '2025-12-19': { id: generateId(), tanggal: '2025-12-19', jamMasuk: '06:51', jamPulang: '11:06', status: 'H', keterangan: '' },
            '2025-12-22': { id: generateId(), tanggal: '2025-12-22', jamMasuk: '', jamPulang: '', status: 'S', keterangan: 'Sakit' },
            '2025-12-23': { id: generateId(), tanggal: '2025-12-23', jamMasuk: '06:39', jamPulang: '15:03', status: 'H', keterangan: '' },
            '2025-12-24': { id: generateId(), tanggal: '2025-12-24', jamMasuk: '07:25', jamPulang: '14:01', status: 'H', keterangan: 'Terlambat' },
            '2025-12-29': { id: generateId(), tanggal: '2025-12-29', jamMasuk: '07:09', jamPulang: '14:14', status: 'H', keterangan: 'Terlambat' },
            '2025-12-30': { id: generateId(), tanggal: '2025-12-30', jamMasuk: '', jamPulang: '', status: 'S', keterangan: 'Sakit' },
            '2025-12-31': { id: generateId(), tanggal: '2025-12-31', jamMasuk: '06:27', jamPulang: '14:40', status: 'H', keterangan: '' }
        };
        setAbsensiData(prev => ({ ...prev, ...desemberData }));
        alert('Data Desember 2025 berhasil dimuat!');
    };

    const handlePrint = () => window.print();

    const formatLastSaved = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // Calculate monthly stats
    const monthlyStats = useMemo(() => {
        let hadir = 0, sakit = 0, izin = 0, cuti = 0, dinasLuar = 0, tanpaKet = 0;

        workingDays.forEach(date => {
            const dateKey = formatDateKey(date);
            const absen = absensiData[dateKey];
            const status = absen?.status || 'H';

            switch (status) {
                case 'H': hadir++; break;
                case 'S': sakit++; break;
                case 'I': izin++; break;
                case 'C': cuti++; break;
                case 'DL': dinasLuar++; break;
                case 'TK': tanpaKet++; break;
                default: hadir++;
            }
        });

        const total = workingDays.length;
        const persentase = total > 0 ? ((hadir / total) * 100).toFixed(1) : '0';

        return { total, hadir, sakit, izin, cuti, dinasLuar, tanpaKet, persentase };
    }, [workingDays, absensiData]);

    // Calculate semester stats
    const semesterStats = useMemo(() => {
        let hadir = 0, sakit = 0, izin = 0, cuti = 0, dinasLuar = 0, tanpaKet = 0, total = 0;

        // Loop through all available months
        availableMonths.forEach(({ month, year }) => {
            const days = generateMonthDays(year, month);
            days.forEach(date => {
                const dateKey = formatDateKey(date);
                if (isWeekend(date)) return;
                if (isHoliday(dateKey) && dateKey !== '2025-07-14') return;

                total++;
                const absen = absensiData[dateKey];
                const status = absen?.status || 'H';

                switch (status) {
                    case 'H': hadir++; break;
                    case 'S': sakit++; break;
                    case 'I': izin++; break;
                    case 'C': cuti++; break;
                    case 'DL': dinasLuar++; break;
                    case 'TK': tanpaKet++; break;
                    default: hadir++;
                }
            });
        });

        const persentase = total > 0 ? ((hadir / total) * 100).toFixed(2) : '0';
        return { total, hadir, sakit, izin, cuti, dinasLuar, tanpaKet, persentase };
    }, [absensiData]);

    const prevMonth = () => {
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    };

    const nextMonth = () => {
        if (currentIndex < availableMonths.length - 1) setCurrentIndex(currentIndex + 1);
    };

    return (
        <div className="page-container">
            {/* Print Header */}
            <div className="print-header">
                <h2>MENGHITUNG ABSEN SENDIRI</h2>
                <p>BULAN {currentLabel.toUpperCase()} - SEMESTER {identitas.semester.toUpperCase()}</p>
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
                            <td><strong>Bulan</strong></td>
                            <td>:</td>
                            <td>{currentLabel}</td>
                        </tr>
                        <tr>
                            <td><strong>Nama Guru</strong></td>
                            <td>:</td>
                            <td>{identitas.namaGuru || '-'}</td>
                            <td></td>
                            <td><strong>Tahun Ajaran</strong></td>
                            <td>:</td>
                            <td>{identitas.tahunAjaran}</td>
                        </tr>
                        <tr>
                            <td><strong>NIP</strong></td>
                            <td>:</td>
                            <td>{identitas.nipGuru || '-'}</td>
                            <td></td>
                            <td><strong>Kelas</strong></td>
                            <td>:</td>
                            <td>{identitas.kelas || '-'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="page-header no-print">
                <h1>Menghitung Absen Sendiri</h1>
                <p>Rekap kehadiran harian guru Semester {identitas.semester} {identitas.tahunAjaran}</p>
            </div>

            {/* Month Navigation */}
            <div className="card no-print">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <button className="btn btn-primary" onClick={prevMonth} disabled={currentIndex === 0}>
                        <ChevronLeft size={20} />
                        Sebelumnya
                    </button>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                        <Calendar size={24} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        {currentLabel}
                    </h2>
                    <button className="btn btn-primary" onClick={nextMonth} disabled={currentIndex === availableMonths.length - 1}>
                        Berikutnya
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Monthly Stats */}
            <div className="info-box no-print" style={{ marginBottom: '1rem' }}>
                <p>📊 <strong>Hari Kerja:</strong> {monthlyStats.total} |
                    <strong> Hadir:</strong> {monthlyStats.hadir} |
                    <strong> Kehadiran:</strong> {monthlyStats.persentase}%
                    {lastSaved && <span> | Tersimpan: {formatLastSaved(lastSaved)}</span>}
                </p>
            </div>

            {/* Daily Attendance Table */}
            <div className="card">
                <h2 className="card-title no-print">
                    <UserCheck size={20} />
                    Kehadiran Harian - {currentLabel}
                </h2>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                                <th style={{ width: '80px' }}>Hari</th>
                                <th style={{ width: '100px' }}>Tanggal</th>
                                <th style={{ width: '80px', textAlign: 'center' }}>Jam Masuk</th>
                                <th style={{ width: '80px', textAlign: 'center' }}>Jam Pulang</th>
                                <th style={{ width: '80px', textAlign: 'center' }}>Status</th>
                                <th style={{ minWidth: '120px' }}>Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workingDays.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                                        Tidak ada hari kerja di bulan ini
                                    </td>
                                </tr>
                            ) : (
                                workingDays.map((date, index) => {
                                    const dateKey = formatDateKey(date);
                                    const absen = getAbsensi(dateKey);
                                    const hariNama = NAMA_HARI[date.getDay()];
                                    const tanggalStr = `${date.getDate()} ${NAMA_BULAN[date.getMonth()]}`;

                                    return (
                                        <tr key={dateKey}>
                                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                                            <td style={{ fontWeight: 500 }}>{hariNama}</td>
                                            <td>{tanggalStr}</td>
                                            <td>
                                                <input
                                                    type="time"
                                                    value={absen.jamMasuk}
                                                    onChange={(e) => handleChange(dateKey, 'jamMasuk', e.target.value)}
                                                    style={{ width: '100%' }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="time"
                                                    value={absen.jamPulang}
                                                    onChange={(e) => handleChange(dateKey, 'jamPulang', e.target.value)}
                                                    style={{ width: '100%' }}
                                                />
                                            </td>
                                            <td>
                                                <select
                                                    value={absen.status || 'H'}
                                                    onChange={(e) => handleChange(dateKey, 'status', e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.4rem',
                                                        fontSize: '0.85rem',
                                                        background: absen.status === 'H' || !absen.status ? '#dcfce7' :
                                                            absen.status === 'TK' ? '#fecaca' : '#fef3c7',
                                                        color: '#1a1a1a',
                                                        border: '1px solid var(--input-border)',
                                                        borderRadius: '4px'
                                                    }}
                                                >
                                                    <option value="H">H - Hadir</option>
                                                    <option value="S">S - Sakit</option>
                                                    <option value="I">I - Izin</option>
                                                    <option value="C">C - Cuti</option>
                                                    <option value="DL">DL - Dinas Luar</option>
                                                    <option value="TK">TK - Tanpa Ket.</option>
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={absen.keterangan}
                                                    onChange={(e) => handleChange(dateKey, 'keterangan', e.target.value)}
                                                    placeholder="Keterangan..."
                                                    style={{ width: '100%', textAlign: 'left' }}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            {/* Monthly Total Row */}
                            <tr style={{ background: 'var(--input-bg)', fontWeight: 700 }}>
                                <td colSpan={5} style={{ textAlign: 'right', paddingRight: '1rem' }}>
                                    JUMLAH BULAN {currentLabel.toUpperCase()}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    H:{monthlyStats.hadir} S:{monthlyStats.sakit} I:{monthlyStats.izin}
                                </td>
                                <td>
                                    C:{monthlyStats.cuti} DL:{monthlyStats.dinasLuar} TK:{monthlyStats.tanpaKet}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="btn-group no-print" style={{ marginTop: '1rem' }}>
                    <button className="btn btn-primary" onClick={saveData}>
                        <Save size={20} />
                        Simpan
                    </button>
                    <button className="btn btn-warning" onClick={handlePrint}>
                        <Printer size={20} />
                        Cetak
                    </button>
                    <button className="btn btn-danger" onClick={resetData}>
                        <RotateCcw size={20} />
                        Reset Bulan Ini
                    </button>
                    {currentLabel === 'Juli 2025' && (
                        <button className="btn btn-secondary" onClick={loadJuliData} style={{ background: 'var(--secondary)' }}>
                            <Calendar size={20} />
                            Load Data Juli
                        </button>
                    )}
                    {currentLabel === 'Agustus 2025' && (
                        <button className="btn btn-secondary" onClick={loadAgustusData} style={{ background: 'var(--secondary)' }}>
                            <Calendar size={20} />
                            Load Data Agustus
                        </button>
                    )}
                    {currentLabel === 'September 2025' && (
                        <button className="btn btn-secondary" onClick={loadSeptemberData} style={{ background: 'var(--secondary)' }}>
                            <Calendar size={20} />
                            Load Data September
                        </button>
                    )}
                    {currentLabel === 'Oktober 2025' && (
                        <button className="btn btn-secondary" onClick={loadOktoberData} style={{ background: 'var(--secondary)' }}>
                            <Calendar size={20} />
                            Load Data Oktober
                        </button>
                    )}
                    {currentLabel === 'November 2025' && (
                        <button className="btn btn-secondary" onClick={loadNovemberData} style={{ background: 'var(--secondary)' }}>
                            <Calendar size={20} />
                            Load Data November
                        </button>
                    )}
                    {currentLabel === 'Desember 2025' && (
                        <button className="btn btn-secondary" onClick={loadDesemberData} style={{ background: 'var(--secondary)' }}>
                            <Calendar size={20} />
                            Load Data Desember
                        </button>
                    )}
                </div>
            </div>



            {/* Print Keterangan */}
            <div className="print-keterangan">
                <h3>Keterangan:</h3>
                <div className="print-keterangan-list">
                    <span><strong>H</strong> = Hadir</span>
                    <span><strong>S</strong> = Sakit</span>
                    <span><strong>I</strong> = Izin</span>
                    <span><strong>C</strong> = Cuti</span>
                    <span><strong>DL</strong> = Dinas Luar</span>
                    <span><strong>TK</strong> = Tanpa Keterangan</span>
                </div>
            </div>

            {/* Print Signature */}
            <div className="print-signature">
                <p>{identitas.alamatSekolah || identitas.namaSekolah || '.....................'}, {(() => {
                    const { month, year } = availableMonths[currentIndex];
                    const lastDay = new Date(year, month + 1, 0).getDate();
                    return `${lastDay} ${NAMA_BULAN[month]} ${year}`;
                })()}</p>
                <p style={{ marginTop: '8pt' }}>Yang Membuat,</p>
                <div className="signature-space"></div>
                <div className="signature-box">
                    <span className="signature-name"><u>{identitas.namaGuru || '.....................'}</u></span>
                    <span className="signature-nip">NIP. {identitas.nipGuru || '-'}</span>
                </div>
            </div>

            {/* Panduan */}
            <div className="card no-print">
                <h2 className="card-title">📋 Panduan & Kaldik</h2>
                <div className="info-box">
                    <h4>Kalender Pendidikan Semester 1 2025/2026:</h4>
                    <ul style={{ marginTop: '0.5rem' }}>
                        <li><strong>14 Juli 2025</strong> - Hari Pertama Sekolah & MPLS</li>
                        <li><strong>17-18 Agustus 2025</strong> - Libur Kemerdekaan RI & Cuti Bersama</li>
                        <li><strong>5 September 2025</strong> - Libur Maulid Nabi Muhammad SAW</li>
                        <li><strong>1-5 Desember 2025</strong> - Penilaian Akhir Semester</li>
                        <li><strong>19 Desember 2025</strong> - Pembagian Rapor</li>
                        <li><strong>22-31 Desember 2025</strong> - Libur Semester</li>
                        <li><strong>25-26 Desember 2025</strong> - Libur Natal & Cuti Bersama</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default function AbsensiPage() {
    return (
        <AppLayout>
            <AbsensiGuruContent />
        </AppLayout>
    );
}

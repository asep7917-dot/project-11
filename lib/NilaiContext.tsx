'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
    Siswa, FormIdentitas, DataFormatif, DataSumatif,
    createSiswa, createDataFormatif, createDataSumatif,
    generateId
} from '@/lib/utils';

const STORAGE_KEY = 'daftar-nilai-data';

interface SavedData {
    identitas: FormIdentitas;
    siswaList: Siswa[];
    dataFormatif: DataFormatif[];
    dataSumatif: DataSumatif[];
    savedAt: string;
}

interface NilaiContextType {
    identitas: FormIdentitas;
    setIdentitas: (identitas: FormIdentitas) => void;
    siswaList: Siswa[];
    setSiswaList: (siswa: Siswa[]) => void;
    dataFormatif: DataFormatif[];
    setDataFormatif: (data: DataFormatif[]) => void;
    dataSumatif: DataSumatif[];
    setDataSumatif: (data: DataSumatif[]) => void;
    addSiswa: () => void;
    removeSiswa: (id: string) => void;
    saveData: () => void;
    clearData: () => void;
    lastSaved: string | null;
    isLoaded: boolean;
}

const NilaiContext = createContext<NilaiContextType | null>(null);

export function useNilai() {
    const context = useContext(NilaiContext);
    if (!context) {
        throw new Error('useNilai must be used within NilaiProvider');
    }
    return context;
}

const defaultIdentitas: FormIdentitas = {
    namaSekolah: '',
    alamatSekolah: '',
    npsn: '',
    kelas: '',
    fase: 'D',
    mataPelajaran: '',
    semester: 'Ganjil',
    tahunAjaran: '2024/2025',
    namaGuru: '',
    nipGuru: '',
    kkm: 70,
    jumlahLM: 4,
    jumlahTP: 6
};

export function NilaiProvider({ children }: { children: ReactNode }) {
    const [identitas, setIdentitas] = useState<FormIdentitas>(defaultIdentitas);
    const [siswaList, setSiswaList] = useState<Siswa[]>([]);
    const [dataFormatif, setDataFormatif] = useState<DataFormatif[]>([]);
    const [dataSumatif, setDataSumatif] = useState<DataSumatif[]>([]);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load data from localStorage on mount
    useEffect(() => {
        try {
            const savedDataStr = localStorage.getItem(STORAGE_KEY);

            if (savedDataStr) {
                const savedData: SavedData = JSON.parse(savedDataStr);

                setIdentitas(savedData.identitas);
                setSiswaList(savedData.siswaList);
                setDataFormatif(savedData.dataFormatif);
                setDataSumatif(savedData.dataSumatif);
                setLastSaved(savedData.savedAt);
                setIsLoaded(true);
            } else {
                // Initialize with 5 empty students if no saved data
                initializeEmptyData();
            }
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
            initializeEmptyData();
        }
    }, []);

    const initializeEmptyData = () => {
        const initialSiswa: Siswa[] = [];
        const initialFormatif: DataFormatif[] = [];
        const initialSumatif: DataSumatif[] = [];

        for (let i = 0; i < 5; i++) {
            const siswa = createSiswa();
            initialSiswa.push(siswa);
            initialFormatif.push(createDataFormatif(siswa.id, defaultIdentitas.jumlahTP));
            initialSumatif.push(createDataSumatif(siswa.id, defaultIdentitas.jumlahLM));
        }

        setSiswaList(initialSiswa);
        setDataFormatif(initialFormatif);
        setDataSumatif(initialSumatif);
        setIsLoaded(true);
    };

    // Auto-save when data changes (after initial load)
    useEffect(() => {
        if (isLoaded && siswaList.length > 0) {
            const saveTimeout = setTimeout(() => {
                saveData();
            }, 1000); // Debounce 1 second

            return () => clearTimeout(saveTimeout);
        }
    }, [identitas, siswaList, dataFormatif, dataSumatif, isLoaded]);

    // Update formatif data when jumlahTP changes
    useEffect(() => {
        if (dataFormatif.length > 0) {
            setDataFormatif(prev => prev.map(df => {
                const currentLength = df.nilaiTP.length;
                let newNilaiTP = [...df.nilaiTP];

                if (identitas.jumlahTP > currentLength) {
                    newNilaiTP = [...newNilaiTP, ...Array(identitas.jumlahTP - currentLength).fill(0)];
                } else if (identitas.jumlahTP < currentLength) {
                    newNilaiTP = newNilaiTP.slice(0, identitas.jumlahTP);
                }

                return { ...df, nilaiTP: newNilaiTP };
            }));
        }
    }, [identitas.jumlahTP]);

    // Update sumatif data when jumlahLM changes
    useEffect(() => {
        if (dataSumatif.length > 0) {
            setDataSumatif(prev => prev.map(ds => {
                const currentLength = ds.nilaiSLM.length;
                let newNilaiSLM = [...ds.nilaiSLM];

                if (identitas.jumlahLM > currentLength) {
                    newNilaiSLM = [...newNilaiSLM, ...Array(identitas.jumlahLM - currentLength).fill(0)];
                } else if (identitas.jumlahLM < currentLength) {
                    newNilaiSLM = newNilaiSLM.slice(0, identitas.jumlahLM);
                }

                return { ...ds, nilaiSLM: newNilaiSLM };
            }));
        }
    }, [identitas.jumlahLM]);

    const saveData = () => {
        try {
            const dataToSave: SavedData = {
                identitas,
                siswaList,
                dataFormatif,
                dataSumatif,
                savedAt: new Date().toISOString()
            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
            setLastSaved(dataToSave.savedAt);
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };

    const clearData = () => {
        if (confirm('Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.')) {
            localStorage.removeItem(STORAGE_KEY);
            setIdentitas(defaultIdentitas);
            setLastSaved(null);
            initializeEmptyData();
        }
    };

    const addSiswa = () => {
        const newSiswa = createSiswa();
        setSiswaList(prev => [...prev, newSiswa]);
        setDataFormatif(prev => [...prev, createDataFormatif(newSiswa.id, identitas.jumlahTP)]);
        setDataSumatif(prev => [...prev, createDataSumatif(newSiswa.id, identitas.jumlahLM)]);
    };

    const removeSiswa = (id: string) => {
        if (siswaList.length <= 1) return;
        setSiswaList(prev => prev.filter(s => s.id !== id));
        setDataFormatif(prev => prev.filter(df => df.siswaId !== id));
        setDataSumatif(prev => prev.filter(ds => ds.siswaId !== id));
    };

    return (
        <NilaiContext.Provider value={{
            identitas,
            setIdentitas,
            siswaList,
            setSiswaList,
            dataFormatif,
            setDataFormatif,
            dataSumatif,
            setDataSumatif,
            addSiswa,
            removeSiswa,
            saveData,
            clearData,
            lastSaved,
            isLoaded
        }}>
            {children}
        </NilaiContext.Provider>
    );
}

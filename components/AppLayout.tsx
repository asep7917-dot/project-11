'use client';

import { NilaiProvider } from '@/lib/NilaiContext';
import Sidebar from '@/components/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <NilaiProvider>
            <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                    {children}
                </main>
            </div>
        </NilaiProvider>
    );
}

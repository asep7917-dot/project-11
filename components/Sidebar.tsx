'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    GraduationCap,
    Users,
    Settings,
    ClipboardList,
    FileText,
    ChevronRight
} from 'lucide-react';

const menuItems = [
    {
        title: 'Identitas',
        href: '/identitas',
        icon: Settings,
        description: 'Info sekolah & kelas'
    },
    {
        title: 'Data Siswa',
        href: '/data-siswa',
        icon: Users,
        description: 'Kelola daftar siswa'
    },
    {
        title: 'Nilai Formatif',
        href: '/nilai-formatif',
        icon: ClipboardList,
        description: 'Penilaian umpan balik'
    },
    {
        title: 'Nilai Sumatif',
        href: '/nilai-sumatif',
        icon: FileText,
        description: 'Penilaian akhir (SLM & SAS)'
    }
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <GraduationCap size={32} />
                    <div>
                        <h1>Daftar Nilai</h1>
                        <p>Kurikulum Merdeka</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            <item.icon size={20} />
                            <div className="sidebar-link-content">
                                <span className="sidebar-link-title">{item.title}</span>
                                <span className="sidebar-link-desc">{item.description}</span>
                            </div>
                            {isActive && <ChevronRight size={16} className="sidebar-arrow" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <p>© 2024 Daftar Nilai</p>
                <p>Permendikbud No. 12/2024</p>
            </div>
        </aside>
    );
}

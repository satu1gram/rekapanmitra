import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dashboard } from '@/components/dashboard/Dashboard';

export default function DashboardPage() {
    const navigate = useNavigate();

    const handleNavigate = (tab: 'orders' | 'stock', action?: string) => {
        if (tab === 'orders') {
            navigate('/riwayat', { state: action === 'add' ? { openAdd: true } : undefined });
        } else if (tab === 'stock') {
            navigate('/produk');
        }
    };

    return <Dashboard onNavigate={handleNavigate} />;
}

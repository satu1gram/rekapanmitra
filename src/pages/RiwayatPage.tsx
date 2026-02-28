import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { OrdersPage } from '@/components/orders/OrdersPage';

export default function RiwayatPage() {
    const location = useLocation();
    // Terima state openAdd yang dikirim dari DashboardPage
    const [openAddForm, setOpenAddForm] = useState(location.state?.openAdd === true);

    // Reset state di history agar refresh tidak buka form lagi
    useEffect(() => {
        if (location.state?.openAdd) {
            window.history.replaceState({}, '');
        }
    }, []);

    return (
        <OrdersPage
            openAddForm={openAddForm}
            onAddFormClose={() => setOpenAddForm(false)}
        />
    );
}

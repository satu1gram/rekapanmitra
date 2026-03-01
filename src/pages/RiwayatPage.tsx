import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { OrdersPage } from '@/components/orders/OrdersPage';

export default function RiwayatPage() {
    const location = useLocation();
    const [openAddForm, setOpenAddForm] = useState(location.state?.openAdd === true);

    // Watch for location state changes — handles FAB navigation from same page
    useEffect(() => {
        if (location.state?.openAdd) {
            setOpenAddForm(true);
            window.history.replaceState({}, '');
        }
    }, [location.state]);

    return (
        <OrdersPage
            openAddForm={openAddForm}
            onAddFormClose={() => setOpenAddForm(false)}
        />
    );
}

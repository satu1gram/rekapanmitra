import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { OrdersPage } from '@/components/orders/OrdersPage';

export default function RiwayatPage() {
    const location = useLocation();
    const [openAddForm, setOpenAddForm] = useState(location.state?.openAdd === true);

    const navigate = useNavigate();

    // Watch for location state changes — handles FAB navigation from same page
    useEffect(() => {
        if (location.state?.openAdd) {
            setOpenAddForm(true);
            // Clear the state so it can be re-triggered if user clicks FAB again 
            // while staying on this same page
            navigate(location.pathname, { replace: true, state: {} });
        } else {
            setOpenAddForm(false);
        }
    }, [location.state, location.pathname, navigate]);

    return (
        <OrdersPage
            openAddForm={openAddForm}
            onAddFormClose={() => setOpenAddForm(false)}
        />
    );
}

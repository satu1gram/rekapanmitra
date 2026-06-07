import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { OrdersPage } from '@/components/orders/OrdersPage';

export default function RiwayatPage() {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const hasOpenAddParam = query.get('openAdd') === 'true';
    const [openAddForm, setOpenAddForm] = useState(location.state?.openAdd === true || hasOpenAddParam);

    const navigate = useNavigate();

    // Watch for location state changes — handles FAB navigation from same page
    useEffect(() => {
        if (location.state?.openAdd || hasOpenAddParam) {
            setOpenAddForm(true);
            if (location.state?.openAdd) {
                // Clear the state so it can be re-triggered if user clicks FAB again 
                // while staying on this same page
                navigate(location.pathname + location.search, { replace: true, state: {} });
            }
        } else {
            setOpenAddForm(false);
        }
    }, [location.state, location.pathname, location.search, navigate, hasOpenAddParam]);

    return (
        <OrdersPage
            openAddForm={openAddForm}
            onAddFormClose={() => setOpenAddForm(false)}
        />
    );
}

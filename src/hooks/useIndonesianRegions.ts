import { useState, useEffect } from 'react';

export interface Region {
    id: string;
    name: string;
}

const BASE_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api';

export function useIndonesianRegions() {
    const [provinces, setProvinces] = useState<Region[]>([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);

    const [cities, setCities] = useState<Region[]>([]);
    const [loadingCities, setLoadingCities] = useState(false);

    useEffect(() => {
        let mounted = true;
        const fetchProvinces = async () => {
            setLoadingProvinces(true);
            try {
                const res = await fetch(`${BASE_URL}/provinces.json`);
                if (!res.ok) throw new Error('Network response was not ok');
                const data: Region[] = await res.json();

                // Casing normalization (e.g. "JAWA BARAT" -> "Jawa Barat")
                const normalized = data.map(p => ({
                    ...p,
                    name: p.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
                }));

                if (mounted) setProvinces(normalized);
            } catch (error) {
                console.error('Failed to fetch provinces', error);
            } finally {
                if (mounted) setLoadingProvinces(false);
            }
        };

        fetchProvinces();
        return () => { mounted = false; };
    }, []);

    const fetchCities = async (provinceId: string) => {
        if (!provinceId) {
            setCities([]);
            return;
        }
        setLoadingCities(true);
        try {
            const res = await fetch(`${BASE_URL}/regencies/${provinceId}.json`);
            if (!res.ok) throw new Error('Network response was not ok');
            const data: Region[] = await res.json();

            const normalized = data.map(c => ({
                ...c,
                name: c.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
            }));

            setCities(normalized);
        } catch (error) {
            console.error('Failed to fetch cities', error);
            setCities([]);
        } finally {
            setLoadingCities(false);
        }
    };

    return {
        provinces,
        loadingProvinces,
        cities,
        loadingCities,
        fetchCities,
        setCities // expose so UI can reset it if needed
    };
}

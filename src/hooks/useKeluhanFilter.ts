import { useState } from 'react';

export function useKeluhanFilter() {
    const [selectedKeluhan, setSelectedKeluhan] = useState<string[]>([]);
    return { selectedKeluhan, setSelectedKeluhan };
}

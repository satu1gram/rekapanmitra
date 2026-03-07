export interface ProductData {
    id: string;
    category: string;
    badgeText: string;
    badgeColor: 'green' | 'red' | 'blue' | 'gold' | 'kids' | 'supplement';
    name: string;
    tagline: string;
    description: string;
    benefits: string[];
    specs: { icon: string; text: string }[];
    price: string;
    priceNote: string;
    oldPrice?: string;
    bgStyle: 'green' | 'teal' | 'gold' | 'blue' | 'red' | 'purple';
    emoji: string;
}

export const KATALOG_PRODUCTS: ProductData[] = [
    {
        id: "british-propolis",
        category: "propolis",
        badgeText: "British Propolis",
        badgeColor: "green",
        name: "British Propolis",
        tagline: "Imunitas & Pemulihan Ekstra",
        description: "Suplemen antibakteri, antioksidan murni dari lebah Inggris. Cepat bekerja mempercepat pemulihan dan menjaga daya tahan tubuh secara optimal.",
        benefits: [
            "Mempercepat pemulihan tubuh yang drop",
            "Imunitas kuat tanpa efek samping",
            "Kaya flavonoid (Antioksidan tinggi)"
        ],
        specs: [
            { icon: "💧", text: "Drop 6 ML" },
            { icon: "🔬", text: "Botol Kaca" }
        ],
        price: "Rp 250.000",
        priceNote: "Per Botol 6 ML",
        bgStyle: "green",
        emoji: "🍯"
    },
    {
        id: "british-propolis-green",
        category: "propolis",
        badgeText: "Untuk Anak",
        badgeColor: "kids",
        name: "British Propolis Green",
        tagline: "Perisai Imunitas Si Kecil",
        description: "Formulasi khusus anak 1–12 tahun dengan Madu Trigona. Melindungi anak dari virus agar tidak gampang sakit dan merangsang kecerdasan.",
        benefits: [
            "Meningkatkan nafsu makan & berat badan",
            "Mendukung kecerdasan & daya ingat",
            "Anak jarang gampang flu/sakit"
        ],
        specs: [
            { icon: "💧", text: "Drop 6 ML" },
            { icon: "👶", text: "Usia 1-12 Th" }
        ],
        price: "Rp 250.000",
        priceNote: "Per Botol 6 ML",
        bgStyle: "teal",
        emoji: "👦👧"
    },
    {
        id: "brassic-pro",
        category: "suplemen",
        badgeText: "Suplemen",
        badgeColor: "gold",
        name: "Brassic Pro",
        tagline: "Bebas Nyeri Sendi & Insomnia",
        description: "Moringa + Echinacea yang sangat ampuh meredakan pegal/linu linu, menenangkan syaraf, serta membantu tubuh mendapatkan tidur lelap berkualitas.",
        benefits: [
            "Sendi nyaman, bebas nyeri saat gerak",
            "Bantu atasi sulit tidur (insomnia)",
            "Badan segar tak gampang penat"
        ],
        specs: [
            { icon: "💊", text: "40 Kapsul" },
            { icon: "🌿", text: "Moringa" }
        ],
        price: "Rp 250.000",
        priceNote: "1 Botol 40 Kapsul",
        bgStyle: "gold",
        emoji: "🦴"
    },
    {
        id: "brassic-eye",
        category: "suplemen",
        badgeText: "Suplemen Mata",
        badgeColor: "blue",
        name: "Brassic Eye",
        tagline: "Perlidungan Mata Era Gadget",
        description: "Ekstrak Bilberry dan Gynura. Solusi untuk mata cepat lelah, iritasi merah, hingga keluhan rabun akibat paparan layar hp/laptop rutin tiap hari.",
        benefits: [
            "Menghilangkan penat pada mata lelah",
            "Menjaga ketajaman penglihatan",
            "Menyaring paparan Radiasi Biru layar"
        ],
        specs: [
            { icon: "💊", text: "40 Kapsul" },
            { icon: "🫐", text: "Bilberry Extract" }
        ],
        price: "Rp 250.000",
        priceNote: "1 Botol 40 Kapsul",
        bgStyle: "blue",
        emoji: "👁️"
    },
    {
        id: "bp-norway",
        category: "suplemen",
        badgeText: "Suplemen Otak",
        badgeColor: "supplement",
        name: "BP Norway",
        tagline: "DHA Otak & Kesehatan Jantung",
        description: "100% Atlantic Salmon Oil dari perairan Norwegia. Kaya Omega-3 dan Astaxanthin, menutrisi otak secara maksimal agar cepat respon dan fokus.",
        benefits: [
            "Menaingkatkan fokus & respon mental",
            "Nutrisi pembuluh darah & jantung",
            "DHA tinggi bantu tumbuh kembang otak"
        ],
        specs: [
            { icon: "💊", text: "Soft Kapsul" },
            { icon: "📦", text: "40 Kapsul" },
            { icon: "🐟", text: "Salmon Oil" }
        ],
        price: "Rp 250.000",
        priceNote: "40 Soft Capsules",
        bgStyle: "blue",
        emoji: "🧠"
    },
    {
        id: "belgie-facial-wash",
        category: "skincare",
        badgeText: "Skincare Halal",
        badgeColor: "red",
        name: "Belgie Facial Wash",
        tagline: "Wajah Bersih Tanpa Ketarik",
        description: "Sabun wajah yang melembabkan, tidak membuat kering kulit. Cepat bersihkan kotoran terdalam dan meninggalkan sensasi segar bercahaya.",
        benefits: [
            "Bersih maksimal tanpa efek kering/ketarik",
            "Wajah lebih lembab & cerah",
            "Mengontrol produksi sebum minyak"
        ],
        specs: [
            { icon: "🧴", text: "Gel 100 ML" },
            { icon: "⚗️", text: "Propolis" }
        ],
        price: "Rp 195.000",
        priceNote: "Gel 100 ML",
        bgStyle: "red",
        emoji: "💦"
    },
    {
        id: "belgie-serum",
        category: "skincare",
        badgeText: "Skincare Halal",
        badgeColor: "red",
        name: "Belgie Anti Aging Serum",
        tagline: "Pudarkan Flek & Kerutan Cepat",
        description: "Kandungan aktif tinggi Kolagen & Propolis. Meresap ke lapisan terdalam secara instan, menyamarkan flek hitam, sekaligus mengencangkan wajah.",
        benefits: [
            "Menyamarkan flek hitam membandel",
            "Kurangi garis halus kerutan drastis",
            "Kenyalkan kulit (Anti-Aging)"
        ],
        specs: [
            { icon: "💧", text: "Cair 10 ML" },
            { icon: "✨", text: "5 Bahan Aktif" }
        ],
        price: "Rp 195.000",
        priceNote: "10 ML",
        bgStyle: "purple",
        emoji: "🌟"
    },
    {
        id: "belgie-day-cream",
        category: "skincare",
        badgeText: "Skincare Halal",
        badgeColor: "red",
        name: "Belgie Day Cream",
        tagline: "Perlindungan Siang Anti UV",
        description: "Melindungi wajah dari sengatan sinar UV (SPF30+), polusi udara serta kelembaban hilang saat beraktivitas dari pagi hingga menjelang sore.",
        benefits: [
            "Proteksi matahari tinggi & polusi",
            "Wajah tak mudah kusam di siang hari",
            "Melembapkan seharian penuh"
        ],
        specs: [
            { icon: "🌅", text: "Krim 10 gr" },
            { icon: "☀️", text: "SPF 30+" }
        ],
        price: "Rp 195.000",
        priceNote: "10 Gram",
        bgStyle: "red",
        emoji: "🌅"
    },
    {
        id: "belgie-night-cream",
        category: "skincare",
        badgeText: "Skincare Halal",
        badgeColor: "red",
        name: "Belgie Night Cream",
        tagline: "Regenerasi Maksimal di Malam Hari",
        description: "Krim malam bekerja memperbaiki sel kulit yang rusak, berkat Salicylic Acid. Wajah terasa kenyal bagai lahir kembali saat di pagi hari.",
        benefits: [
            "Regenerasi sel kulit baru saat tidur",
            "Otot wajah jadi rileks & kencang",
            "Cepat perbaiki skin barrier rusak"
        ],
        specs: [
            { icon: "🌙", text: "Malam" },
            { icon: "📦", text: "10 Gram" },
            { icon: "🔬", text: "Collagen" }
        ],
        price: "Rp 195.000",
        priceNote: "Krim 10 Gram",
        bgStyle: "red",
        emoji: "🌙"
    },
    {
        id: "belgie-hair-tonic",
        category: "skincare",
        badgeText: "Perawatan Rambut",
        badgeColor: "red",
        name: "Belgie Hair Tonic",
        tagline: "Bebas Rontok & Rambut Lebat",
        description: "Bahan langka AnaGain dari Swiss bekerja langsung menstimulasi folikel rambut di kulit kepala, menghentikan kerontokan & merangsang rambut baru.",
        benefits: [
            "Hentikan kerontokan dengan sangat cepat",
            "Merangsang tunas rambut baru tumbuh",
            "Sensasi dingin tenangkan kulit kepala"
        ],
        specs: [
            { icon: "💆", text: "Spray" },
            { icon: "📦", text: "100 ML" },
            { icon: "🌿", text: "Anagain Swiss" }
        ],
        price: "Rp 195.000",
        priceNote: "Spray 100 ML",
        bgStyle: "gold",
        emoji: "💇"
    },
    {
        id: "steffi-pro",
        category: "natural",
        badgeText: "Natural Sweetener",
        badgeColor: "blue",
        name: "Steffi Pro",
        tagline: "Manisnya Teh Tanpa Rasa Bersalah",
        description: "Pengganti gula dari ekstrak Stevia. Benar-benar nol kalori! Solusi nikmati rasa manis aman bagi pemilik diabetes atau yang ingin diet gula.",
        benefits: [
            "Nol gula, amankan lonjakan gula darah",
            "1 tetes sama percis manis gula biasa",
            "Tak ada rasa pahit di tenggorokan (aftertaste)"
        ],
        specs: [
            { icon: "💧", text: "Cair" },
            { icon: "📦", text: "30 ML" },
            { icon: "🌿", text: "Stevia Extract" }
        ],
        price: "Rp 195.000",
        priceNote: "🔥 Harga Promo",
        oldPrice: "Rp 250.000",
        bgStyle: "blue",
        emoji: "🍵"
    }
];

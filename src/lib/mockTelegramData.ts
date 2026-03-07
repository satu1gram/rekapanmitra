export interface TelegramMessage {
    id: string;
    source: 'testimoni' | 'product_knowledge';
    text: string;
    sender: string;
    tags: string[]; // Mocking embedded concepts
    related_products: string[];
}

// Simulasi data yang ditarik dari grup t.me/+aEs5CmlwJbozYWZl
export const mockTelegramDatabase: TelegramMessage[] = [
    {
        id: "msg-001",
        source: "testimoni",
        text: "Alhamdulillah setelah rutin minum British Propolis (BP) selama 2 minggu, gula darah bapak saya yang tadinya sering di atas 200 sekarang perlahan stabil di bawah 150. Badan juga kerasa lebih enteng buat ibadah.",
        sender: "Mitra Aisyah",
        tags: ["gula darah tinggi", "diabetes", "lemas"],
        related_products: ["British Propolis"]
    },
    {
        id: "msg-002",
        source: "testimoni",
        text: "Masyallah tabarakallah... Anak saya umur 5 tahun kemarin sempat batuk pilek parah (sering flu). Biasanya lama sembuhnya. Saya rutinkan BP Kids (Green), alhamdulillah 3 hari langsung kering dan aktif lagi mainnya. Nafsu makannya juga nambah drastis!",
        sender: "Bunda Nisa",
        tags: ["sering flu", "anak susah makan", "batuk pilek", "demam"],
        related_products: ["British Propolis Green"]
    },
    {
        id: "msg-003",
        source: "testimoni",
        text: "Testi pribadi: Sering banget lutut sakit kalau dipakai jalan lama atau naik tangga (nyeri sendi). Setelah disarankan upline buat coba Brassic Pro, biidznillah sakitnya berkurang jauh. Tidur saya yang tadinya gampang kebangun (susah tidur) sekarang jadi lebih pules.",
        sender: "Pak Hermawan",
        tags: ["nyeri sendi", "lutut", "asam urat", "susah tidur", "insomnia"],
        related_products: ["Brassic Pro"]
    },
    {
        id: "msg-004",
        source: "testimoni",
        text: "Kerjaan sering di depan laptop bikin mata lelah, kadang sampai buram dan berair. Sejak sedia Brassic Eye, alhamdulillah mata jadi lebih seger, nggak gampang perih lagi kalau lembur.",
        sender: "Ahmad Rizki",
        tags: ["mata lelah", "mata minus", "buram", "perih"],
        related_products: ["Brassic Eye"]
    },
    {
        id: "msg-005",
        source: "testimoni",
        text: "Flek hitam di wajah lumayan pudar setelah 1 bulan pakai rangkaian Belgie Skincare (Facial Wash, Day Cream, Serum, Night Cream). Kulit kusam juga hilang, teman-teman pada bilang muka kelihatan lebih glowing berseri. Puas banget sama hasilnya karena ini juga halal dan aman.",
        sender: "Umi Kalsum",
        tags: ["flek hitam", "kulit kusam", "glowing", "jerawat"],
        related_products: ["Belgie Facial Wash", "Belgie Anti Aging Serum", "Belgie Night Cream"]
    },
    {
        id: "msg-006",
        source: "testimoni",
        text: "Dulu sering begadang jadi gampang banget drop imunnya (kurang stamina, gampang sakit). Rutin 5 tetes British Propolis tiap pagi sblm sarapan ngaruh banget buat jaga stamina harian. Walau begadang, besoknya tetep fit.",
        sender: "Kang Ridwan",
        tags: ["susah tidur", "kurang stamina", "imun lemah", "gampang sakit"],
        related_products: ["British Propolis"]
    },
    {
        id: "msg-007",
        source: "testimoni",
        text: "Rambut rontok parah pasca melahirkan. Disaranin coba Belgie Hair Tonic. Wanginya enak, seger di kulit kepala. Sebulanan rontoknya jauh berkurang dan mulai banyak anak rambut (baby hair) yang tumbuh.",
        sender: "Ibu Fatimah",
        tags: ["rambut rontok", "botak", "rambut tipis"],
        related_products: ["Belgie Hair Tonic"]
    },
    {
        id: "msg-008",
        source: "product_knowledge",
        text: "Kandungan Propolis pada British Propolis berasal dari lebah di Inggris yang hidup di cuaca ekstrem (-5 hingga 35 derajat). Ini membuat flavonoid-nya 3-4x lebih tinggi dibanding propolis biasa. Sangat bagus untuk PIS (Pemulihan, Imunitas, Stamina).",
        sender: "Materi Pusat",
        tags: ["imun lemah", "kurang stamina", "imunitas", "pemulihan"],
        related_products: ["British Propolis"]
    },
    {
        id: "msg-009",
        source: "product_knowledge",
        text: "Brassic Pro menggabungkan khasiat Moringa (Kelor) dan Echinacea. Sangat direkomendasikan untuk masalah neuro & tulang seperti insomnia (susah tidur), pengapuran, dan nyeri sendi.",
        sender: "Materi Pusat",
        tags: ["susah tidur", "nyeri sendi", "insomnia", "pegal"],
        related_products: ["Brassic Pro"]
    },
    {
        id: "msg-010",
        source: "testimoni",
        text: "Wah, Steffi Pro ini beneran game changer buat kami sekeluarga! Suami yang punya keturunan gula darah tinggi sekarang bisa nikmatin teh manis lagi tapi aman. Rasanya beneran manis gula, ga pahit atau aneh kayak pemanis diet lainnya, padahal cuma pake 1 tetes aja.",
        sender: "Dian Pelangi",
        tags: ["gula darah tinggi", "diabetes", "pemanis alami"],
        related_products: ["Steffi Pro"]
    },
    {
        id: "msg-011",
        source: "testimoni",
        text: "Masya Allah, BP Norway beneran dapet banget khasiatnya buat anak sulung saya. Dia tadinya agak lambat bicaranya dibanding temen-temen seurian (kurang fokus). Baru habis 1 botol, alhamdulillah vocabulari-nya nambah banyak dan gampang nyambung kalau diajak ngobrol.",
        sender: "Mama Syifa",
        tags: ["kurang fokus", "telat bicara", "kecerdasan", "anak"],
        related_products: ["BP Norway"]
    }
];

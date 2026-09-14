import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PackagePlus, Pencil, Power, Plus, Search, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';

interface MasterProduct {
  id: string;
  name: string;
  category: string;
  package_type: string;
  quantity_per_package: number;
  price: number;
  is_active: boolean;
}

type ProductForm = Omit<MasterProduct, 'id'>;

const CATEGORIES = ['STEFFI', 'BELGIE', 'BP', 'BRO', 'BRE', 'NORWAY'];
const PACKAGE_TYPES = [
  { value: 'satuan', label: 'Satuan' },
  { value: '3_botol', label: '3 Botol' },
  { value: '5_botol', label: '5 Botol' },
  { value: '10_botol', label: '10 Botol' },
  { value: '40_botol', label: '40 Botol' },
  { value: '200_botol', label: '200 Botol' },
];

const EMPTY_FORM: ProductForm = {
  name: '',
  category: 'BP',
  package_type: 'satuan',
  quantity_per_package: 1,
  price: 0,
  is_active: true,
};

function packageLabel(packageType: string, quantity: number) {
  return packageType === 'satuan' ? 'Satuan' : `${quantity} botol`;
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MasterProduct | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const { data: products = [], isLoading } = useQuery<MasterProduct[]>({
    queryKey: ['admin-master-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('master_products' as never)
        .select('id, name, category, package_type, quantity_per_package, price, is_active')
        .order('category')
        .order('quantity_per_package');
      if (error) throw error;
      return (data || []) as MasterProduct[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: ProductForm | (ProductForm & { id: string })) => {
      const { id, ...values } = payload as ProductForm & { id?: string };
      const query = id
        ? supabase.from('master_products' as never).update(values).eq('id', id)
        : supabase.from('master_products' as never).insert(values);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-master-products'] });
      setEditingProduct(null);
      setForm(EMPTY_FORM);
      toast.success('Produk berhasil disimpan');
    },
    onError: error => toast.error(`Gagal menyimpan produk: ${error.message}`),
  });

  const toggleMutation = useMutation({
    mutationFn: async (product: MasterProduct) => {
      const { error } = await supabase
        .from('master_products' as never)
        .update({ is_active: !product.is_active })
        .eq('id', product.id);
      if (error) throw error;
    },
    onSuccess: (_, product) => {
      queryClient.invalidateQueries({ queryKey: ['admin-master-products'] });
      toast.success(product.is_active ? 'Produk dinonaktifkan' : 'Produk diaktifkan');
    },
    onError: error => toast.error(`Gagal mengubah status: ${error.message}`),
  });

  const visibleProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return products.filter(product => {
      const matchesSearch = !normalizedSearch || [product.name, product.category, product.package_type]
        .some(value => value.toLowerCase().includes(normalizedSearch));
      return matchesSearch && (showInactive || product.is_active);
    });
  }, [products, searchTerm, showInactive]);

  const openCreate = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (product: MasterProduct) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      package_type: product.package_type,
      quantity_per_package: product.quantity_per_package,
      price: product.price,
      is_active: product.is_active,
    });
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormError('');
  };

  const updateForm = <K extends keyof ProductForm>(field: K, value: ProductForm[K]) => {
    setForm(previous => ({ ...previous, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return setFormError('Nama produk wajib diisi.');
    if (form.quantity_per_package < 1) return setFormError('Jumlah paket minimal 1.');
    if (form.price < 1) return setFormError('Harga harus lebih besar dari 0.');
    setFormError('');
    saveMutation.mutate(editingProduct ? { ...form, id: editingProduct.id } : form);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Catalog Control</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Produk & Harga</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Kelola harga jual pusat yang dipakai katalog publik.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white shadow-md transition hover:bg-slate-800"
        >
          <Plus size={17} /> Tambah Produk
        </button>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Cari nama, kategori, atau paket..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-medium outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
          <input type="checkbox" checked={showInactive} onChange={event => setShowInactive(event.target.checked)} className="h-4 w-4 accent-emerald-600" />
          Tampilkan nonaktif
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-6">{[1, 2, 3, 4].map(item => <div key={item} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : visibleProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <PackagePlus className="mb-3 text-slate-300" size={38} />
            <p className="font-black text-slate-700">Belum ada produk yang cocok</p>
            <p className="mt-1 text-sm text-slate-400">Tambahkan produk baru atau ubah filter pencarian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {['Produk', 'Kategori', 'Paket', 'Harga Jual', 'Status', 'Aksi'].map(label => <th key={label} className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleProducts.map(product => (
                  <tr key={product.id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3"><p className="font-black text-slate-900">{product.name}</p><p className="text-xs font-medium text-slate-400">ID {product.id.slice(0, 8)}</p></td>
                    <td className="px-4 py-3"><span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600">{product.category}</span></td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-600">{packageLabel(product.package_type, product.quantity_per_package)}</td>
                    <td className="px-4 py-3 font-black text-emerald-600">{formatCurrency(Number(product.price))}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-black ${product.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{product.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1"><button type="button" onClick={() => openEdit(product)} className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600" title="Edit produk"><Pencil size={16} /></button><button type="button" onClick={() => toggleMutation.mutate(product)} disabled={toggleMutation.isPending} className="rounded-lg p-2 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600" title={product.is_active ? 'Nonaktifkan produk' : 'Aktifkan produk'}><Power size={16} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-5 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">{editingProduct ? 'Edit katalog' : 'Katalog baru'}</p><h2 className="mt-1 text-xl font-black text-slate-900">{editingProduct ? 'Edit Produk' : 'Tambah Produk'}</h2></div><button type="button" onClick={closeForm} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-black uppercase tracking-wide text-slate-500">Nama Produk</span><input value={form.name} onChange={event => updateForm('name', event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" placeholder="Contoh: British Propolis" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-wide text-slate-500">Kategori</span><select value={form.category} onChange={event => updateForm('category', event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-emerald-500">{CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-wide text-slate-500">Jenis Paket</span><select value={form.package_type} onChange={event => { const packageType = event.target.value; updateForm('package_type', packageType); updateForm('quantity_per_package', packageType === 'satuan' ? 1 : Number(packageType.split('_')[0])); }} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-emerald-500">{PACKAGE_TYPES.map(packageType => <option key={packageType.value} value={packageType.value}>{packageType.label}</option>)}</select></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-wide text-slate-500">Jumlah per Paket</span><input type="number" min="1" value={form.quantity_per_package} onChange={event => updateForm('quantity_per_package', Number(event.target.value))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-emerald-500" /></label>
              <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-wide text-slate-500">Harga Jual Paket</span><input type="number" min="1" step="1000" value={form.price || ''} onChange={event => updateForm('price', Number(event.target.value))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-emerald-500" placeholder="250000" /></label>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-600"><input type="checkbox" checked={form.is_active} onChange={event => updateForm('is_active', event.target.checked)} className="h-4 w-4 accent-emerald-600" /> Produk aktif di katalog</label>
            {formError && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600">{formError}</p>}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={closeForm} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Batal</button><button type="submit" disabled={saveMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"><Save size={16} />{saveMutation.isPending ? 'Menyimpan...' : 'Simpan Produk'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

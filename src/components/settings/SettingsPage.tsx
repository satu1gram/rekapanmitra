import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TIER_PRICING } from '@/types';
import { formatCurrency, formatShortCurrency } from '@/lib/formatters';
import { useAuth } from '@/hooks/useAuth';
import { 
  Lock,
  User,
  Info,
  LogOut,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      toast.success('Berhasil keluar');
    } catch (error) {
      toast.error('Gagal keluar');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Konfigurasi aplikasi</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Profil Mitra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lokasi</span>
              <span className="font-medium">Malang, Jawa Timur</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            Tabel Harga (Terkunci)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.values(TIER_PRICING).map(tier => (
              <div 
                key={tier.tier}
                className="rounded-lg border p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{tier.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {tier.bottles} botol • {formatShortCurrency(tier.pricePerBottle)}/btl
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(tier.totalPrice)}</p>
                    {tier.marginPerBottle > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Margin {formatShortCurrency(tier.marginPerBottle)}/btl
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 p-3">
            <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium">Aturan Harga:</p>
              <ul className="mt-1 list-inside list-disc space-y-1">
                <li>Harga jual bebas, bisa input berapa saja</li>
                <li>Minimal 3 botol untuk jual ulang (menjadi Reseller)</li>
                <li>1 botol hanya untuk konsumsi pribadi</li>
                <li>Tier otomatis naik setelah beli paket lebih besar</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button 
        variant="destructive" 
        className="w-full" 
        onClick={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Keluar...
          </>
        ) : (
          <>
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </>
        )}
      </Button>

      {/* App Info */}
      <Card>
        <CardContent className="py-4 text-center">
          <p className="font-semibold">BP Community Manager</p>
          <p className="text-xs text-muted-foreground">Versi 1.0.0 • Made in Malang 🇮🇩</p>
        </CardContent>
      </Card>
    </div>
  );
}

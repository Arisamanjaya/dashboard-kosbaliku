export interface User {
  user_id: string;
  user_name: string;
  user_email: string;
  user_password: string;
  user_phone: string;
  user_ig: string;
  role: 'admin' | 'pemilik' | 'user';
  created_at: string;
}

export type KosTipe = 'Putra' | 'Putri' | 'Campur';

export interface AuthUser {
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  user_ig?: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Kos {
  kos_id: string;
  kos_nama: string;
  kos_alamat: string;
  kos_lokasi: string;
  kos_lng?: number | null;
  kos_lat?: number | null;
  pemilik_id: string;
  kos_tipe: KosTipe;
  kos_premium: boolean;
  kos_rule: string;
  kos_note: string;
  kos_avail: boolean;
  created_at: string;
  status: 'active' | 'rejected' | 'pending';
  // Relations
  pemilik?: User;
  fasilitas?: Fasilitas[]; // ✅ REFACTOR: Use the specific Fasilitas type
  harga?: HargaKos[];
  images?: KosImage[];
  // This is for the junction table data, often not needed on the final Kos object
  kos_fasilitas?: KosFasilitas[];
}

export interface KosFormData {
  kos_nama: string;
  kos_alamat: string;
  kos_lokasi: string;
  kos_lng?: number;
  kos_lat?: number;
  kos_tipe: KosTipe;
  kos_premium: boolean;
  kos_rule: string;
  kos_note: string;
  kos_avail: boolean;
  fasilitas_ids: string[];
  harga: HargaKos[];
}

export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

export interface HargaKos {
  harga_id?: string;
  kos_id?: string;
  tipe_durasi: 'Mingguan' | 'Bulanan' | 'Tahunan';
  harga: number;
}

export interface Fasilitas {
  fasilitas_id: string;
  fasilitas_nama: string;
  fasilitas_tipe: 'Kamar' | 'Lingkungan';
}

export interface KosImage {
  id: string;
  kos_id: string;
  url_foto: string;
}

export interface KosFasilitas {
  id: string;
  kos_id: string;
  fasilitas_id: string;
}
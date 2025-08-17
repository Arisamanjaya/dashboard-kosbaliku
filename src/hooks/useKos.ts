import { useState, useEffect } from 'react';
import { Kos, Fasilitas } from '@/types/database';
import { KosService } from '@/lib/kosService';

export const useKosByOwner = (pemilikId: string) => {
  const [kos, setKos] = useState<Kos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKos = async () => {
    setLoading(true);
    setError(null);
    
    const { data, error: err } = await KosService.getKosByOwner(pemilikId);
    
    if (err) {
      setError(err);
    } else {
      setKos(data || []);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (pemilikId) {
      fetchKos();
    }
  }, [pemilikId]);

  const refetch = () => {
    fetchKos();
  };

  return { kos, loading, error, refetch };
};

export const useKosStats = (pemilikId: string) => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      
      const { stats: data, error: err } = await KosService.getKosStats(pemilikId);
      
      if (err) {
        setError(err);
      } else {
        setStats(data || { total: 0, active: 0, pending: 0, inactive: 0 });
      }
      
      setLoading(false);
    };

    if (pemilikId) {
      fetchStats();
    }
  }, [pemilikId]);

  return { stats, loading, error };
};

export const useFasilitas = () => {
  const [fasilitas, setFasilitas] = useState<Fasilitas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFasilitas = async () => {
      setLoading(true);
      setError(null);
      
      const { data, error: err } = await KosService.getAllFasilitas();
      
      if (err) {
        setError(err);
      } else {
        setFasilitas(data || []);
      }
      
      setLoading(false);
    };

    fetchFasilitas();
  }, []);

  return { fasilitas, loading, error };
};
'use client';

import Link from 'next/link';

// Landing page - Redirige a /motor 

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>CaraCola Viajes</h1>
      <p style={{ fontSize: '1.1rem', color: '#666', margin: 0 }}>Motor de búsqueda de itinerarios</p>
      <Link href="/motor" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#dc2626', color: 'white', textDecoration: 'none', borderRadius: '0.375rem', fontSize: '1rem', fontWeight: '500' }}>
        Ir al Motor
      </Link>
    </div>
  );
}
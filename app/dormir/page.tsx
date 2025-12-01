import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dormir',
  description: 'Guía de alojamiento para tu viaje',
};

export default function DormirPage() {
  return (
    <div>
      <h1>Dormir</h1>
      <p>Información sobre alojamiento próximamente.</p>
    </div>
  );
}

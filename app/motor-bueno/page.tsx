import { notFound } from 'next/navigation';

export default function MotorBuenoDisabledPage() {
  // Control absoluto: esta ruta usaba servicios Google client-side (places/directions/geocoder).
  // Se deshabilita para evitar consumo “invisible” desde navegador.
  notFound();
}

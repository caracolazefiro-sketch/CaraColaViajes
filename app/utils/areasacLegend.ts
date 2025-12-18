export const AREASAC_CODE_LABELS: Record<string, string> = {
  // Area type
  PU: 'Área Pública / Municipal',
  PR: 'Área Privada',
  RU: 'Área en Ruta',
  CP: 'Área en Camping',
  PK: 'Parking / Pernocta',
  AR: 'Área Recomendada',

  // Flags (shown in PDF legend; we usually expose these as booleans)
  '!': 'Área con Advertencia',
  '€': 'Área / Parking de Pago',
  '#': 'Área / Parking Gratis',
  '@': 'Abierto todo el año',

  // Services
  PN: 'Pernocta posible',
  AL: 'Cargar Agua Limpia',
  AG: 'Vaciado Aguas Grises',
  AN: 'Vaciado Aguas Negras',
  CE: 'Conexión Eléctrica',
  RT: 'Restaurante / Cafetería',
  SM: 'Supermercado / Compras',
  JU: 'Zona de Juegos',
  PI: 'Zona de Picnic',
  GA: 'Gasolinera próxima',
  VG: 'Vigilancia',
  MS: 'Mascotas permitidas',
  WI: 'Conexión Wi-Fi',
  IT: 'Información Turística',
};

export function areasAcLabelForCode(code: string): string | undefined {
  const key = String(code || '').trim().toUpperCase();
  if (!key) return undefined;
  return AREASAC_CODE_LABELS[key];
}

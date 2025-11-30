import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* * 🛡️ MODO SEGURO ACTIVADO
   * Hemos eliminado 'ignoreBuildErrors' y 'ignoreDuringBuilds'.
   * Ahora, si hay un error de tipo (TypeScript) o de estilo (ESLint),
   * el build fallará para avisarte ANTES de llegar a producción.
   */
  
  // Si en el futuro necesitas configurar imágenes externas, headers, etc., van aquí.
};

export default nextConfig;
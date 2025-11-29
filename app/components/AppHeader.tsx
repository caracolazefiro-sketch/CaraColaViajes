// --------------------------------------------------------------------------
// AppHeader.tsx
// --------------------------------------------------------------------------
'use client'; // Necesario si usas hooks (useState) y Context/MUI
import React, { useState } from 'react';
import Image from 'next/image'; // Para usar el logo como imagen optimizada

// 1. IMPORTACIONES CORREGIDAS A MUI
import { 
    Box, Button, IconButton, Drawer, Typography, Divider 
} from '@mui/material'; 
import MenuIcon from '@mui/icons-material/Menu'; // Icono de hamburguesa

// 2. IMPORTACIÓN DE COMPONENTES LOCALES
import UserArea from './UserArea'; // Importamos tu componente UserArea.tsx

const AppHeader = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Componente para el Logo (Asume una imagen en /public)
  const LogoComponent = () => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Image 
        src="/logo.jpg" // CAMBIA ESTA RUTA SI TU LOGO TIENE OTRO NOMBRE
        alt="CaraCola Viajes Logo" 
        width={40} 
        height={40} 
        priority // Carga prioritaria para la cabecera
      />
    </Box>
  );

  // --- COMPONENTES INTERNOS SIMPLIFICADOS (Botones de Acción) ---
  const ActionButtons = () => (
    <Box sx={styles.actionButtonsContainer}>
      <Button variant="text" color="primary">Buscar Viajes</Button>
      <Button variant="text" color="secondary"># 🐌 MANIFIESTO</Button> 
    </Box>
  );
  // --------------------------------------------------------------------------

  return (
    <Box component="header" sx={styles.header}>
      
      {/* 1. Bloque Izquierdo: Logo */}
      <LogoComponent />

      {/* 2. Bloque Derecho: Controles y Área de Usuario */}
      <Box sx={styles.controlsContainer}>
        
        {/* A. Botones de Acción (SOLO VISIBLES en Sobremesa) */}
        <Box sx={styles.desktopControls}>
          <ActionButtons />
        </Box>

        {/* B. Icono de Menú Hamburguesa (SOLO VISIBLE en Móvil) */}
        <Box sx={styles.mobileMenuIcon}>
          <IconButton 
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Menú principal"
            size="large"
          >
            <MenuIcon />
          </IconButton>
        </Box>
        
        {/* C. Área de Usuario (SIEMPRE VISIBLE) */}
        <UserArea /> {/* Usamos tu componente existente */}
      </Box>

      {/* 3. Drawer para Menú Móvil */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        <Box sx={styles.drawerContent} role="presentation">
          <Typography variant="h6" sx={{ p: 2 }}>Menú CaraCola</Typography>
          <Divider />
          <ActionButtons />
          {/* Aquí irían otros enlaces de navegación si fuera necesario */}
        </Box>
      </Drawer>
    </Box>
  );
};

// Objeto de Estilos Responsivos
const styles = {
    // ... (El objeto styles sigue siendo el mismo que acordamos)
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between', 
      padding: '10px 20px',
      backgroundColor: '#fff', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    
    controlsContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px', 
    },
  
    actionButtonsContainer: {
      display: 'flex',
      gap: '10px',
    },
  
    // Controla la VISIBILIDAD DE BOTONES DE ACCIÓN: SOLO SOBREMESA
    desktopControls: {
      // Usando breakpoints de MUI: Oculto en 'xs' (móvil), visible en 'sm' (sobremesa)
      display: { xs: 'none', sm: 'flex' }, 
    },
  
    // Controla la VISIBILIDAD DEL ICONO DE MENÚ: SOLO MÓVIL
    mobileMenuIcon: {
      // Visible en 'xs' (móvil), oculto en 'sm' (sobremesa)
      display: { xs: 'block', sm: 'none' }, 
    },
  
    drawerContent: {
      width: 250, 
      paddingTop: '10px',
    }
  };

export default AppHeader;
// --------------------------------------------------------------------------
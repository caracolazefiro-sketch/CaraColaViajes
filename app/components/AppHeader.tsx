import React, { useState } from 'react';
// Importa tus componentes de UI
// Asumo componentes como Box (contenedor flex), Button, IconButton, Avatar
import { Box, Button, IconButton, Avatar, Drawer, Typography } from 'tu-libreria-ui'; 
import MenuIcon from 'tu-libreria-ui/MenuIcon'; // Icono de hamburguesa
import Logo from './Logo'; // Tu componente de logo

const AppHeader = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // --- COMPONENTES INTERNOS SIMPLIFICADOS (Simulan tus botones de acción) ---
  const ActionButtons = () => (
    <Box sx={styles.actionButtonsContainer}>
      <Button variant="text" color="primary">Buscar Viajes</Button>
      <Button variant="text" color="secondary"># 🐌 MANIFIESTO</Button>
    </Box>
  );

  const UserArea = () => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Avatar src="/images/user-avatar.jpg" alt="Usuario" />
    </Box>
  );
  // --------------------------------------------------------------------------

  return (
    <Box component="header" sx={styles.header}>
      
      {/* 1. Bloque Izquierdo: Logo */}
      <Box>
        <Logo /> {/* Asegúrate que el logo no sea demasiado grande en móvil */}
      </Box>

      {/* 2. Bloque Derecho: Controles (Condicionales según la vista) */}
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
        <UserArea />
      </Box>

      {/* 3. Drawer para Menú Móvil */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        <Box sx={styles.drawerContent} role="presentation">
          <Typography variant="h6" sx={{ p: 2 }}>Menú CaraCola</Typography>
          <ActionButtons /> {/* Reutilizamos los botones aquí */}
          {/* Puedes añadir más links o navegación */}
        </Box>
      </Drawer>
    </Box>
  );
};

export default AppHeader;
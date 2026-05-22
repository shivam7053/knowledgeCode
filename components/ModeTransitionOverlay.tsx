// //ModeTransitionOverlay

// "use client";
// import React, { useState, useEffect } from 'react';
// import { Box, Fade, useColorScheme } from '@mui/material';
// import { useChillMode } from '@/app/providers';

// export default function ModeTransitionOverlay() {
//   const { isChillMode } = useChillMode();
//   const { mode, systemMode } = useColorScheme();
//   const [visible, setVisible] = useState(false);
//   const [activeSvg, setActiveSvg] = useState('');
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//     console.log("[ModeTransitionOverlay] Mounted.");
//   }, []);

//   // Properly determine the active theme (light or dark)
//   const activeTheme = (mode === 'system' ? systemMode : mode);

//   useEffect(() => {
//     // Wait for mounting and for MUI to settle the theme mode
//     if (!mounted || !activeTheme) return;

//     const currentTheme = activeTheme || 'light';
//     console.log("[ModeTransitionOverlay] Triggering effect for theme:", currentTheme, "chillMode:", isChillMode);

//     // Expected files: learning-light.svg, learning-dark.svg, chill-light.svg, chill-dark.svg
//     const themeSuffix = currentTheme === 'dark' ? 'dark' : 'light';
//     const typePrefix = isChillMode ? 'chill' : 'learning';
//     setActiveSvg(`/svgs/${typePrefix}-${themeSuffix}.svg`);

//     // Trigger overlay
//     setVisible(true);

//     // Show for 2 seconds then fade out
//     const timer = setTimeout(() => {
//       setVisible(false);
//     }, 2000);

//     return () => clearTimeout(timer);
//   }, [isChillMode, activeTheme, mounted]);

//   if (!mounted || !activeSvg || !visible) return null;

//   const bgTheme = activeTheme || 'light';

//   return (
//     <Fade in={visible} timeout={400}>
//       <Box
//         sx={{
//           position: 'fixed',
//           top: 0,
//           left: 0,
//           width: '100vw',
//           height: '100vh',
//           bgcolor: bgTheme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)',
//           backdropFilter: 'blur(8px)',
//           zIndex: 9999,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           pointerEvents: 'none', // Allow clicks to pass through if it hasn't faded yet
//         }}
//       >
//         <Box
//           component="img"
//           src={activeSvg}
//           sx={{
//             width: { xs: 200, md: 400 },
//             height: 'auto',
//           }}
//           alt="Transition Animation"
//         />
//       </Box>
//     </Fade>
//   );
// }

// ModeTransitionOverlay.tsx — use next-themes instead of useColorScheme
"use client";
import React, { useState, useEffect } from 'react';
import { Box, Fade } from '@mui/material';
import { useTheme } from 'next-themes';
import { useChillMode } from '@/app/providers';

export default function ModeTransitionOverlay() {
  const { isChillMode } = useChillMode();
  const { resolvedTheme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [activeSvg, setActiveSvg] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !resolvedTheme) return;

    const themeSuffix = resolvedTheme === 'dark' ? 'dark' : 'light';
    const typePrefix = isChillMode ? 'chill' : 'learning';
    setActiveSvg(`/svgs/${typePrefix}-${themeSuffix}.svg`);
    setVisible(true);

    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [isChillMode, resolvedTheme, mounted]);

  if (!mounted || !activeSvg || !visible) return null;

  return (
    <Fade in={visible} timeout={400}>
      <Box sx={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        bgcolor: resolvedTheme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <Box component="img" src={activeSvg} sx={{ width: { xs: 200, md: 400 }, height: 'auto' }} alt="Transition Animation" />
      </Box>
    </Fade>
  );
}
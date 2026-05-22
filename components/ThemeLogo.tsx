// //themelogo

// import * as React from 'react';
// import { useColorScheme } from '@mui/material/styles';
// import { Box } from '@mui/material';

// interface ThemeLogoProps {
//   isChillMode?: boolean;
// }

// /**
//  * ThemeLogo dynamically renders one of four SVGs based on:
//  * 1. Theme Mode (Light/Dark)
//  * 2. Chill Mode (On/Off)
//  */
// const ThemeLogo: React.FC<ThemeLogoProps> = ({ isChillMode = false }) => {
//   const { mode, systemMode } = useColorScheme();
//   const [mounted, setMounted] = React.useState(false);

//   // Ensure component is mounted to prevent hydration mismatch with SSR
//   React.useEffect(() => {
//     setMounted(true);
//     console.log("[ThemeLogo] Mounted.");
//   }, []);

//   // Determine the active mode (handling 'system' preference)
//   const activeTheme = (mode === 'system' ? systemMode : mode) || 'light';

//   React.useEffect(() => {
//     if (mounted) {
//       console.log("[ThemeLogo] Reacting to state change. activeTheme:", activeTheme, "isChillMode:", isChillMode, "Image path:", getLogoPath());
//     }
//   }, [activeTheme, isChillMode, mounted]);

//   const getLogoPath = () => {
//     const themeSuffix = activeTheme === 'dark' ? 'dark' : 'light';
//     const typePrefix = isChillMode ? 'chill' : 'learning';
//     // Expected files: learning-light.png, learning-dark.png, chill-light.png, chill-dark.png
//     return `/logos/${typePrefix}-${themeSuffix}.png`;
//   };

//   if (!mounted) {
//     return <Box sx={{ height: { xs: 32, md: 40 }, width: 120 }} />;
//   }

//   return (
//     <Box
//       component="img"
//       key={`${activeTheme}-${isChillMode}`} // Key helps trigger transition on change
//       src={getLogoPath()}
//       alt={isChillMode ? "Chill Mode Logo" : "App Logo"}
//       sx={{
//         height: { xs: 32, md: 40 },
//         width: 'auto',
//         display: 'block',
//         transition: 'opacity 0.3s ease-in-out, transform 0.3s ease',
//         '&:hover': { transform: 'scale(1.05)' },
//       }}
//     />
//   );
// };

// export default ThemeLogo;

// ThemeLogo.tsx — use next-themes instead of useColorScheme
"use client";
import * as React from 'react';
import { useTheme } from 'next-themes';
import { Box } from '@mui/material';

interface ThemeLogoProps {
  isChillMode?: boolean;
}

const ThemeLogo: React.FC<ThemeLogoProps> = ({ isChillMode = false }) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <Box sx={{ height: { xs: 32, md: 40 }, width: 120 }} />;
  }

  const themeSuffix = resolvedTheme === 'dark' ? 'dark' : 'light';
  const typePrefix = isChillMode ? 'chill' : 'learning';
  const logoPath = `/logos/${typePrefix}-${themeSuffix}.png`;

  return (
    <Box
      component="img"
      key={logoPath}
      src={logoPath}
      alt={isChillMode ? "Chill Mode Logo" : "App Logo"}
      sx={{
        height: { xs: 32, md: 40 },
        width: 'auto',
        display: 'block',
        transition: 'opacity 0.3s ease-in-out, transform 0.3s ease',
        '&:hover': { transform: 'scale(1.05)' },
      }}
    />
  );
};

export default ThemeLogo;
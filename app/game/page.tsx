// "use client";
// import { Box, Typography, Button, Container, Card, CardContent, CardMedia } from "@mui/material";
// import Grid from "@mui/material/Grid2";
// import Link from "next/link";
// import { SportsEsports as GameIcon, Psychology as BrainIcon, Extension as MemoryIcon } from "@mui/icons-material";
// import { useChillMode } from "@/app/providers";
// import { useEffect } from "react";
// import { useRouter } from "next/navigation";

// export default function GameHomePage() {
//   const { isChillMode, setIsChillMode } = useChillMode();
//   const router = useRouter();

//   // Ensure chill mode is active when on this page
//   useEffect(() => {
//     if (!isChillMode) {
//       setIsChillMode(true);
//     }
//   }, [isChillMode, setIsChillMode]);

//   const games = [
//     {
//       title: "Quiz Arena",
//       description: "Test your knowledge across various categories!",
//       link: "/game/quiz",
//       icon: <BrainIcon fontSize="large" />,
//       photo: <BrainIcon sx={{ fontSize: 100 }} />,
//     },
//     {
//       title: "Flip The Cards",
//       description: "Test your memory with our fun card matching game!",
//       link: "/game/flip-cards",
//       icon: <MemoryIcon fontSize="large" />,
//       photo: <MemoryIcon sx={{ fontSize: 100 }} />,
//     },
//   ];

//   return (
//     <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
//       {/* Game Hero Section */}
//       <Box sx={{ 
//         py: 12, 
//         textAlign: 'center', 
//         position: 'relative',
//         background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.1) 0%, transparent 70%)',
//         mb: 6
//       }}>
//         <Container maxWidth="md">
//           <GameIcon sx={{ fontSize: 60, color: 'primary.main', mb: 3 }} />
//           <Typography variant="h2" sx={{ 
//             fontWeight: 900, 
//             mb: 2, 
//             background: 'linear-gradient(to right, #ef4444, #f87171)', 
//             WebkitBackgroundClip: 'text', 
//             WebkitTextFillColor: 'transparent' 
//           }}>
//             Chillout Zone
//           </Typography>
//           <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 300, maxWidth: '600px', mx: 'auto' }}>
//             Level up your break time with interactive challenges and daily brain teasers.
//           </Typography>
//         </Container>
//       </Box>

//       <Container maxWidth="lg">
//         <Grid container spacing={4} justifyContent="center">
//           {games.map((game, index) => (
//             <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
//               <Card 
//                 variant="outlined" 
//                 sx={{ 
//                   height: '100%', 
//                   display: 'flex', 
//                   flexDirection: 'column', 
//                   transition: 'transform 0.3s, box-shadow 0.3s', 
//                   '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 },
//                   borderColor: 'primary.main',
//                   borderWidth: 2,
//                 }}
//               >
//                 {/* MUI Logo as Photo */}
//                 <Box sx={{ 
//                   height: 200, 
//                   bgcolor: 'action.hover', 
//                   display: 'flex', 
//                   alignItems: 'center', 
//                   justifyContent: 'center',
//                   color: 'primary.main',
//                   borderBottom: '1px solid',
//                   borderColor: 'divider'
//                 }}>
//                   {game.photo}
//                 </Box>
//                 <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 3 }}>
//                   {game.icon}
//                   <Typography variant="h5" component="h3" sx={{ fontWeight: 'bold', mt: 2, mb: 1, color: 'text.primary' }}>
//                     {game.title}
//                   </Typography>
//                   <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//                     {game.description}
//                   </Typography>
//                   <Button 
//                     component={Link} 
//                     href={game.link} 
//                     variant="contained" 
//                     color="primary" 
//                     sx={{ mt: 'auto', px: 4, py: 1.5, fontWeight: 'bold' }}
//                   >
//                     Play Now
//                   </Button>
//                 </CardContent>
//               </Card>
//             </Grid>
//           ))}
//         </Grid>
//       </Container>
//     </Box>
//   );
// }

"use client";

import {
Box,
Typography,
Button,
Container,
Card,
CardContent
} from "@mui/material";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import {
SportsEsports as GameIcon,
Psychology as BrainIcon,
Extension as MemoryIcon
} from "@mui/icons-material";
import { useChillMode } from "@/app/providers";
import { useEffect } from "react";

export default function GameHomePage() {
const { isChillMode, setIsChillMode } = useChillMode();

// Ensure chill mode is active when on this page
useEffect(() => {
  setIsChillMode(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

const games = [
{
title: "Quiz Arena",
description: "Test your knowledge across various categories!",
link: "/game/quiz",
icon: <BrainIcon fontSize="large" />,
photo: <BrainIcon sx={{ fontSize: 100 }} />
},
{
title: "Flip The Cards",
description: "Test your memory with our fun card matching game!",
link: "/game/flip-cards",
icon: <MemoryIcon fontSize="large" />,
photo: <MemoryIcon sx={{ fontSize: 100 }} />
}
];

return (
<Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 8 }}>
{/* Hero Section */}
<Box
sx={{
py: 12,
textAlign: "center",
background:
"radial-gradient(circle at center, rgba(239, 68, 68, 0.1) 0%, transparent 70%)",
mb: 6
}}
> <Container maxWidth="md">
<GameIcon sx={{ fontSize: 60, color: "primary.main", mb: 3 }} />


      <Typography
        variant="h2"
        sx={{
          fontWeight: 900,
          mb: 2,
          background: "linear-gradient(to right, #ef4444, #f87171)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}
      >
        Chillout Zone
      </Typography>

      <Typography
        variant="h5"
        color="text.secondary"
        sx={{ fontWeight: 300, maxWidth: "600px", mx: "auto" }}
      >
        Level up your break time with interactive challenges and daily brain
        teasers.
      </Typography>
    </Container>
  </Box>

  {/* Game Cards */}
  <Container maxWidth="lg">
    <Grid
      container
      spacing={4}
      justifyContent="center"
      alignItems="stretch"
    >
      {games.map((game, index) => (
        <Grid xs={12} sm={6} md={4} key={index}>
          <Card
            variant="outlined"
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              transition: "0.3s",
              "&:hover": {
                transform: "translateY(-6px)",
                boxShadow: 6
              },
              borderColor: "primary.main",
              borderWidth: 2
            }}
          >
            {/* Icon Area */}
            <Box
              sx={{
                height: 200,
                bgcolor: "action.hover",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "primary.main",
                borderBottom: "1px solid",
                borderColor: "divider"
              }}
            >
              {game.photo}
            </Box>

            <CardContent
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                p: 3
              }}
            >
              {game.icon}

              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  mt: 2,
                  mb: 1
                }}
              >
                {game.title}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                {game.description}
              </Typography>

              <Button
                component={Link}
                href={game.link}
                variant="contained"
                sx={{
                  mt: "auto",
                  px: 4,
                  py: 1.5,
                  fontWeight: "bold"
                }}
              >
                Play Now
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Container>
</Box>

);
}

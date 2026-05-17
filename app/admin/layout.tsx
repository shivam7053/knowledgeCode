import { Box, Container } from "@mui/material";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="xl" sx={{ py: 5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {children}
        </Box>
      </Container>
    </Box>
  );
}

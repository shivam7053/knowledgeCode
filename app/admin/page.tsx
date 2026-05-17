"use client";

import React from "react";
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Button, 
  Typography, 
  Box, 
  Divider, 
  Grid,
  Stack
} from "@mui/material";
import { 
  Add as PlusIcon, 
  Article as FileTextIcon, 
  School as GraduationCapIcon, 
  Group as UsersIcon, 
  Visibility as EyeIcon, 
  Dashboard as DashboardIcon,
  Terminal as TerminalIcon
} from "@mui/icons-material";
import Link from "next/link";

const ICON_MAP: Record<string, React.ElementType> = {
  views: EyeIcon,
  students: UsersIcon,
  articles: FileTextIcon,
  courses: GraduationCapIcon,
  challenges: TerminalIcon
};

export default function AdminDashboard() {
  const stats = [
    { label: "Total Views", value: "0", iconKey: 'views' },
    { label: "Students", value: "0", iconKey: 'students' },
    { label: "Articles", value: "0", iconKey: 'articles' },
    { label: "Courses", value: "0", iconKey: 'courses' },
    { label: "Challenges", value: "0", iconKey: 'challenges' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, py: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <DashboardIcon color="primary" fontSize="large" />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', letterSpacing: -1 }}>Admin Dashboard</Typography>
          <Typography color="text.secondary">Manage your professional content and educational tracks.</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {stats.map((stat) => {
          const Icon = ICON_MAP[stat.iconKey];
          return (
            <Grid item xs={12} sm={6} md={2.4} key={stat.label}>
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', p: 1.5, bgcolor: 'primary.main', borderRadius: 2, color: 'white' }}>
                    <Icon fontSize="medium" />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{stat.value}</Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={3}>
        {/* Post Management */}
        <Grid item xs={12} lg={4}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              avatar={<Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: 1, color: 'white', display: 'flex' }}><FileTextIcon /></Box>}
              title={<Typography variant="h6" sx={{ fontWeight: 'bold' }}>Content Management</Typography>}
              subheader="News, Facts, and Information"
            />
            <Divider />
            <CardContent sx={{ display: 'flex', gap: 2, py: 3 }}>
              <Link href="/admin/posts/new" style={{ textDecoration: 'none' }}>
                <Button variant="contained" startIcon={<PlusIcon />}>New Post</Button>
              </Link>
              <Link href="/admin/posts" style={{ textDecoration: 'none' }}>
                <Button variant="outlined">View All</Button>
              </Link>
            </CardContent>
          </Card>
        </Grid>

        {/* Course Management */}
        <Grid item xs={12} lg={4}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              avatar={<Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: 1, color: 'white', display: 'flex' }}><GraduationCapIcon /></Box>}
              title={<Typography variant="h6" sx={{ fontWeight: 'bold' }}>Course Management</Typography>}
              subheader="Professional Educational Tracks"
            />
            <Divider />
            <CardContent sx={{ display: 'flex', gap: 2, py: 3 }}>
              <Link href="/admin/courses/new" style={{ textDecoration: 'none' }}>
                <Button variant="contained" startIcon={<PlusIcon />}>New Course</Button>
              </Link>
              <Link href="/admin/courses" style={{ textDecoration: 'none' }}>
                <Button variant="outlined">Manage</Button>
              </Link>
            </CardContent>
          </Card>
        </Grid>

        {/* Practice Management */}
        <Grid item xs={12} lg={4}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              avatar={<Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: 1, color: 'white', display: 'flex' }}><TerminalIcon /></Box>}
              title={<Typography variant="h6" sx={{ fontWeight: 'bold' }}>Practice Management</Typography>}
              subheader="Coding Challenges and Tests"
            />
            <Divider />
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 3 }}>
              <Stack direction="row" spacing={2}>
                <Link href="/admin/practice/new" style={{ textDecoration: 'none' }}>
                  <Button variant="contained" startIcon={<PlusIcon />}>New Challenge</Button>
                </Link>
                <Link href="/admin/practice" style={{ textDecoration: 'none' }}>
                  <Button variant="outlined">Manage Tests</Button>
                </Link>
              </Stack>
              <Link href="/admin/practice/categories" style={{ textDecoration: 'none' }}>
                <Button variant="text" size="small" fullWidth>Manage Categories</Button>
              </Link>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
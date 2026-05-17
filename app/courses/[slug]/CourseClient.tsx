"use client";
import { useState, useEffect } from "react";
import {
  Box, Typography, List, ListItemButton, ListItemText,
  Container, useTheme, Paper, Checkbox, Collapse,
  LinearProgress, Stack
} from "@mui/material";
import {
  LibraryBooks as LessonIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  ExpandMore as ExpandMoreIcon,
  PlayCircleFilled as PlayIcon
} from "@mui/icons-material";

export default function CourseClient({ course }: { course: any }) {
  const [selection, setSelection] = useState<{ topic: number; subtopic: number | null }>({
    topic: 0,
    subtopic: null,
  });

  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true });
  const [totalProgress, setTotalProgress] = useState(0);

  const calculateProgress = (currentProgress: Record<string, boolean>) => {
    if (!course.topics) return;
    let total = 0;
    let done = 0;
    course.topics.forEach((t: any, tIdx: number) => {
      total++;
      if (currentProgress[`t_${tIdx}`]) done++;
      t.subtopics?.forEach((_: any, sIdx: number) => {
        total++;
        if (currentProgress[`s_${tIdx}_${sIdx}`]) done++;
      });
    });
    setTotalProgress(total === 0 ? 0 : Math.round((done / total) * 100));
  };

  const toggleExpanded = (index: number) => {
    setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const theme = useTheme();

  useEffect(() => {
    const savedProgress = localStorage.getItem(
      `knowledgecode_progress_${course.id || 'default'}`
    );
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      setProgress(parsed);
      calculateProgress(parsed);
    }
  }, [course.id]);

  const toggleProgress = (id: string) => {
    const newProgress = { ...progress, [id]: !progress[id] };
    setProgress(newProgress);
    calculateProgress(newProgress);
    localStorage.setItem(
      `knowledgecode_progress_${course.id || 'default'}`,
      JSON.stringify(newProgress)
    );
  };

  const currentTopic = course.topics?.[selection.topic];
  const activeDisplay =
    selection.subtopic !== null && currentTopic?.subtopics
      ? {
          title: currentTopic.subtopics[selection.subtopic].subtitle,
          content: currentTopic.subtopics[selection.subtopic].content,
        }
      : {
          title: currentTopic?.title || "Introduction",
          content: currentTopic?.content || course.description,
        };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Course Header Banner */}
      <Box
        sx={{
          position: 'relative',
          backgroundImage: `url(${course.thumbnail || "https://via.placeholder.com/1200x400?text=Course"})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'common.white',
          py: { xs: 6, md: 10 },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            bgcolor: 'rgba(0,0,0,0.65)',
            zIndex: 1,
          },
        }}
      >
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
            {course.title}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
            Instructor: {course.instructor}
          </Typography>

          <Box sx={{ mt: 3, maxWidth: '300px' }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Your Progress</Typography>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{totalProgress}%</Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={totalProgress}
              sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.2)' }}
            />
          </Box>
        </Container>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 'calc(100vh - 200px)' }}>
        {/* Sidebar */}
        <Box
          sx={{
            width: { xs: '100%', md: '320px', lg: '380px' },
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            position: { md: 'sticky' },
            top: '64px',
            height: { md: 'calc(100vh - 64px)' },
            overflowY: 'auto',
          }}
        >
          <Box
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'action.hover',
            }}
          >
            <LessonIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              Curriculum
            </Typography>
          </Box>

          <List component="nav" disablePadding>
            {course.topics?.map((topic: any, tIdx: number) => (
              <Box key={tIdx}>
                <ListItemButton
                  disableRipple
                  selected={selection.topic === tIdx && selection.subtopic === null}
                  onClick={() => {
                    setSelection({ topic: tIdx, subtopic: null });
                    if (topic.subtopics?.length > 0) toggleExpanded(tIdx);
                  }}
                  sx={{
                    py: 1.5,
                    px: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    '&.Mui-selected': {
                      bgcolor: theme.palette.mode === 'dark'
                        ? 'rgba(59,130,246,0.15)'
                        : 'rgba(16,185,129,0.1)',
                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                    },
                  }}
                >
                  <Checkbox
                    icon={<UncheckedIcon />}
                    checkedIcon={<CheckCircleIcon color="success" />}
                    checked={!!progress[`t_${tIdx}`]}
                    onChange={(e) => { e.stopPropagation(); toggleProgress(`t_${tIdx}`); }}
                    sx={{ p: 0, mr: 1.5 }}
                  />
                  {/* ✅ Use Typography directly instead of primaryTypographyProps */}
                  <ListItemText
                    primary={
                      <Typography
                        fontWeight={(selection.topic === tIdx && selection.subtopic === null) ? 700 : 600}
                        fontSize="0.95rem"
                        color={(selection.topic === tIdx && selection.subtopic === null) ? 'primary.main' : 'text.primary'}
                      >
                        {topic.title}
                      </Typography>
                    }
                  />
                  {topic.subtopics?.length > 0 && (
                    <ExpandMoreIcon
                      fontSize="small"
                      sx={{
                        opacity: 0.5,
                        transition: '0.3s',
                        transform: expanded[tIdx] ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  )}
                </ListItemButton>

                {/* Subtopics */}
                {topic.subtopics?.length > 0 && (
                  <Collapse in={expanded[tIdx]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ bgcolor: 'action.hover', position: 'relative' }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          left: '26px',
                          top: 0,
                          bottom: 0,
                          width: '2px',
                          bgcolor: 'divider',
                          zIndex: 1,
                        }}
                      />
                      {topic.subtopics.map((sub: any, sIdx: number) => (
                        <ListItemButton
                          key={`${tIdx}-${sIdx}`}
                          selected={selection.topic === tIdx && selection.subtopic === sIdx}
                          onClick={() => setSelection({ topic: tIdx, subtopic: sIdx })}
                          sx={{
                            py: 1.2,
                            pl: 5.5,
                            pr: 3,
                            zIndex: 2,
                            '&.Mui-selected': {
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'white',
                              '& .MuiTypography-root': { color: 'primary.main', fontWeight: 700 },
                            },
                          }}
                        >
                          <PlayIcon
                            sx={{ fontSize: 16, mr: 1, opacity: (selection.topic === tIdx && selection.subtopic === sIdx) ? 1 : 0.3 }}
                            color="primary"
                          />
                          <Checkbox
                            size="small"
                            icon={<UncheckedIcon fontSize="small" />}
                            checkedIcon={<CheckCircleIcon fontSize="small" color="success" />}
                            checked={!!progress[`s_${tIdx}_${sIdx}`]}
                            onChange={(e) => { e.stopPropagation(); toggleProgress(`s_${tIdx}_${sIdx}`); }}
                            sx={{ p: 0, mr: 1.5 }}
                          />
                          {/* ✅ Use Typography directly instead of primaryTypographyProps */}
                          <ListItemText
                            primary={
                              <Typography
                                fontSize="0.9rem"
                                fontWeight={(selection.topic === tIdx && selection.subtopic === sIdx) ? 700 : 400}
                                color={(selection.topic === tIdx && selection.subtopic === sIdx) ? 'primary.main' : 'text.secondary'}
                              >
                                {sub.subtitle}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                )}
              </Box>
            ))}
          </List>
        </Box>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, p: { xs: 3, md: 8 }, bgcolor: 'background.default' }}>
          <Paper elevation={0} sx={{ p: { xs: 3, md: 6 }, borderRadius: 4, border: 1, borderColor: 'divider' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: 'text.primary' }}>
              {activeDisplay.title}
            </Typography>
            <Box
              sx={{
                color: 'text.secondary',
                '& h1, h2, h3': { color: 'text.primary', mt: 4, mb: 2, fontWeight: 700 },
                '& p': { mb: 2.5, lineHeight: 1.8, fontSize: '1.1rem' },
                '& ul, ol': { mb: 3, pl: 4 },
                '& li': { mb: 1 },
                '& code': { bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1, fontFamily: 'monospace' },
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: activeDisplay.content }} />
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
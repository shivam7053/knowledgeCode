"use client";

import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Paper,
  Card,
} from "@mui/material";
import Grid from "@mui/material/Grid"; // ✅ Stable Grid v1 (no Unstable_Grid2)
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Topic as TopicIcon,
  Subtitles as SubtitleIcon,
} from "@mui/icons-material";

interface Subtopic {
  subtitle: string;
  content: string;
}

interface Topic {
  title: string;
  content: string;
  subtopics: Subtopic[];
}

interface CourseFormProps {
  initialData?: any;
  action: (prevState: any, formData: FormData) => Promise<any>;
  submitButtonText: string;
}

export default function CourseForm({
  initialData,
  action,
  submitButtonText,
}: CourseFormProps) {
  const [topics, setTopics] = useState<Topic[]>(
    initialData?.topics || [{ title: "Introduction", content: "", subtopics: [] }]
  );

  const handleAddTopic = () => {
    setTopics([...topics, { title: "", content: "", subtopics: [] }]);
  };

  const handleRemoveTopic = (index: number) => {
    setTopics((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTopicChange = (index: number, field: keyof Topic, value: any) => {
    setTopics((prev) =>
      prev.map((topic, i) =>
        i === index ? { ...topic, [field]: value } : topic
      )
    );
  };

  const handleAddSubtopic = (topicIndex: number) => {
    setTopics((prev) =>
      prev.map((topic, i) => {
        if (i !== topicIndex) return topic;
        return {
          ...topic,
          subtopics: [...(topic.subtopics || []), { subtitle: "", content: "" }],
        };
      })
    );
  };

  const handleRemoveSubtopic = (topicIndex: number, subtopicIndex: number) => {
    setTopics((prev) =>
      prev.map((topic, i) => {
        if (i !== topicIndex) return topic;
        return {
          ...topic,
          subtopics: (topic.subtopics || []).filter(
            (_, sIdx) => sIdx !== subtopicIndex
          ),
        };
      })
    );
  };

  const handleSubtopicChange = (
    topicIndex: number,
    subtopicIndex: number,
    field: keyof Subtopic,
    value: string
  ) => {
    setTopics((prev) =>
      prev.map((topic, tIdx) => {
        if (tIdx !== topicIndex) return topic;
        const newSubtopics = (topic.subtopics || []).map((sub, sIdx) => {
          if (sIdx !== subtopicIndex) return sub;
          return { ...sub, [field]: value };
        });
        return { ...topic, subtopics: newSubtopics };
      })
    );
  };

  return (
    <form
      action={async (formData) => {
        console.log(
          "DEBUG: Submitting topics to server action:",
          JSON.stringify(topics, null, 2)
        );
        formData.set("topics", JSON.stringify(topics));
        await action(null, formData);
      }}
    >
      {initialData?.id && (
        <input type="hidden" name="id" value={initialData.id} />
      )}

      <Stack spacing={4}>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
            General Information
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Course Title"
                name="title"
                defaultValue={initialData?.title}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="URL Slug"
                name="slug"
                defaultValue={initialData?.slug}
                required
                placeholder="e.g. python-masterclass"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Instructor Name"
                name="instructor"
                defaultValue={initialData?.instructor || "Admin"}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Price ($)"
                name="price"
                type="number"
                defaultValue={initialData?.price || 0}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Thumbnail URL"
                name="thumbnail"
                defaultValue={initialData?.thumbnail}
                placeholder="https://..."
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Course Overview / Description"
                name="description"
                defaultValue={initialData?.description}
              />
            </Grid>
          </Grid>
        </Paper>

        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Course Curriculum
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddTopic}
            >
              Add Main Topic
            </Button>
          </Stack>

          <Stack spacing={2}>
            {topics.map((topic, tIdx) => (
              <Accordion
                key={tIdx}
                variant="outlined"
                sx={{ borderRadius: 2, overflow: "hidden" }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ bgcolor: "action.hover" }}
                  component="div" // Prevents "button nested in button" error
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{ width: "100%", pr: 2 }}
                  >
                    <TopicIcon color="primary" />
                    <Typography sx={{ fontWeight: 700, flexGrow: 1 }}>
                      {topic.title || `Topic ${tIdx + 1}`}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTopic(tIdx);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 3 }}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Topic Title"
                      value={topic.title}
                      onChange={(e) =>
                        handleTopicChange(tIdx, "title", e.target.value)
                      }
                      required
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Topic Content (HTML supported)"
                      value={topic.content}
                      onChange={(e) =>
                        handleTopicChange(tIdx, "content", e.target.value)
                      }
                    />

                    <Divider>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 700, textTransform: "uppercase" }}
                      >
                        Subtopics for {topic.title || "this module"}
                      </Typography>
                    </Divider>

                    <Box sx={{ pl: { md: 4 } }}>
                      <Stack spacing={2}>
                        {(topic.subtopics || []).map((sub, sIdx) => (
                          <Card
                            key={sIdx}
                            variant="outlined"
                            sx={{ p: 2, bgcolor: "background.default" }}
                          >
                            <Stack spacing={2}>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                              >
                                <SubtitleIcon fontSize="small" color="action" />
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Subtopic Subtitle"
                                  value={sub.subtitle}
                                  onChange={(e) =>
                                    handleSubtopicChange(
                                      tIdx,
                                      sIdx,
                                      "subtitle",
                                      e.target.value
                                    )
                                  }
                                />
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    handleRemoveSubtopic(tIdx, sIdx)
                                  }
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                              <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Subtopic Content"
                                value={sub.content}
                                onChange={(e) =>
                                  handleSubtopicChange(
                                    tIdx,
                                    sIdx,
                                    "content",
                                    e.target.value
                                  )
                                }
                              />
                            </Stack>
                          </Card>
                        ))}
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<AddIcon />}
                          onClick={() => handleAddSubtopic(tIdx)}
                          sx={{ alignSelf: "flex-start" }}
                        >
                          Add Subtopic
                        </Button>
                      </Stack>
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 2, pb: 6 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<SaveIcon />}
            sx={{ px: 8, py: 1.5, borderRadius: 2, fontWeight: "bold" }}
          >
            {submitButtonText}
          </Button>
        </Box>
      </Stack>
    </form>
  );
}
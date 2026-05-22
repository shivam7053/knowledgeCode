"use client";
import { useActionState, useState } from "react";
import { TextField, Button, Select, MenuItem, Card, CardContent, Divider, Box, Typography, FormControl, InputLabel, Alert, Stack } from "@mui/material";
import Grid from "@mui/material/Grid2"; // Use Grid2 for modern Material UI grid system
import { Send as SendIcon, Close as CloseIcon, Title as TypeIcon, Link as LinkIcon, Image as ImageIcon, Article as FileTextIcon, Category as CategoryIcon, Info as InfoIcon, Warning as AlertCircleIcon } from "@mui/icons-material";
import { updatePost } from "@/app/actions/post-actions";
import { useRouter } from "next/navigation";

interface PostData {
  _id: string;
  title: string;
  slug: string;
  category: string;
  image?: string;
  content: string;
  excerpt?: string;
  author: string; // Added author to PostData interface
}

export default function PostForm({ postData }: { postData: PostData }) {
  const [state, formAction] = useActionState(updatePost, null);
  const [currentPost, setCurrentPost] = useState<PostData>(postData);
  const router = useRouter();

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setCurrentPost(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Box sx={{ maxWidth: '900px', mx: 'auto', width: '100%', py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'extrabold' }}>Edit Entry</Typography>
        <Typography color="text.secondary">Modify your published news, facts, or educational information.</Typography>
      </Box>

      <Card variant="outlined" sx={{ boxShadow: 3, bgcolor: 'background.paper' }}>
        <CardContent sx={{ p: 5 }}>
          <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <input type="hidden" name="id" value={currentPost._id} />
            {state?.error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {state.error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2, color: 'primary.contrastText', display: 'flex' }}><TypeIcon fontSize="small" /></Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>General Information</Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Article Title" name="title" fullWidth required value={currentPost.title} onChange={handleChange} InputProps={{ startAdornment: <FileTextIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="URL Slug" name="slug" fullWidth required value={currentPost.slug} onChange={handleChange} InputProps={{ startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2, color: 'primary.contrastText', display: 'flex' }}><CategoryIcon fontSize="small" /></Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Classification & Media</Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth required>
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select labelId="category-label" name="category" label="Category" value={currentPost.category} onChange={handleChange} InputProps={{ startAdornment: <CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}>
                      <MenuItem value="news">News Article</MenuItem>
                      <MenuItem value="facts">Interesting Facts</MenuItem>
                      <MenuItem value="blog">Blog Post</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {/* Added Author field */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Author" name="author" fullWidth required value={currentPost.author} onChange={handleChange} InputProps={{ startAdornment: <TypeIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} />
                </Grid>
                {/* Image URL field */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Cover Image URL" name="image" fullWidth value={currentPost.image || ''} onChange={handleChange} InputProps={{ startAdornment: <ImageIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} />
                  {currentPost.image && (
                    <Box sx={{ mt: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                      <img 
                        src={currentPost.image} 
                        alt="Preview" 
                        style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/400x120?text=Broken+Image+URL";
                        }}
                      />
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2, color: 'primary.contrastText', display: 'flex' }}><InfoIcon fontSize="small" /></Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Article Content</Typography>
              </Box>
              <TextField label="Excerpt" name="excerpt" fullWidth multiline rows={3} value={currentPost.excerpt || ''} onChange={handleChange} />
              <TextField label="Body Content" name="content" fullWidth multiline rows={12} required value={currentPost.content} onChange={handleChange} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button variant="outlined" color="error" startIcon={<CloseIcon />} onClick={() => router.back()}>Cancel</Button>
              <Button variant="contained" color="primary" type="submit" startIcon={<SendIcon />}>Update Article</Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
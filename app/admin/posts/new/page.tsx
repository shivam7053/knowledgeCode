'use client';

import React, { useActionState, useState } from "react";
import { createPost } from "@/app/actions/post-actions";
import { 
  Container, Typography, TextField, Button, Box, Paper, 
  FormControl, InputLabel, Select, MenuItem, Alert, Stack 
} from "@mui/material";
import Link from "next/link";

const initialState = {
  error: null,
};

export default function NewPostPage() {
  // useActionState provides a clean way to handle server action transitions and results
  const [state, formAction, isPending] = useActionState(createPost, initialState);
  const [imageUrl, setImageUrl] = useState("");

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
          Create New Post
        </Typography>
        
        {state?.error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {state.error}
          </Alert>
        )}

        <Box component="form" action={formAction}>
          <Stack spacing={3}>
            <TextField name="title" label="Post Title" variant="outlined" fullWidth required />
            
            <TextField name="slug" label="URL Slug" variant="outlined" fullWidth required placeholder="e.g., my-awesome-post" />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select name="category" label="Category" defaultValue="blog">
                  <MenuItem value="news">News</MenuItem>
                  <MenuItem value="facts">Facts</MenuItem>
                  <MenuItem value="blog">Blog</MenuItem>
                </Select>
              </FormControl>

              <TextField name="author" label="Author" variant="outlined" fullWidth required />
            </Stack>

            <Box>
              <TextField 
                name="image" 
                label="Image URL" 
                variant="outlined" 
                fullWidth 
                placeholder="https://..." 
                onChange={(e) => setImageUrl(e.target.value)}
              />
              {imageUrl && (
                <Box sx={{ mt: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ display: 'block', p: 1, bgcolor: 'action.hover' }}>
                    Image Preview:
                  </Typography>
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                    onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/600x200?text=Invalid+Image+URL")}
                  />
                </Box>
              )}
            </Box>

            <TextField 
              name="excerpt" 
              label="Excerpt" 
              variant="outlined" 
              fullWidth 
              multiline 
              rows={2} 
              helperText="Brief summary for the blog list view"
            />

            <TextField 
              name="content" 
              label="Content" 
              variant="outlined" 
              fullWidth 
              multiline 
              rows={12} 
              required 
            />

            <Box sx={{ pt: 2, display: 'flex', gap: 2 }}>
              <Button type="submit" variant="contained" size="large" disabled={isPending} sx={{ px: 4 }}>
                {isPending ? "Publishing..." : "Publish Post"}
              </Button>
              <Button component={Link} href="/admin/posts" variant="outlined" color="inherit" size="large">
                Cancel
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}
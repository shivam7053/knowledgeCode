import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Stack } from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Article as ArticleIcon } from "@mui/icons-material";
import Link from "next/link";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import { deletePost } from "@/app/actions/post-actions";

export default async function AdminPostsPage() {
  await connectDB();
  const posts = await Post.find().sort({ createdAt: -1 }).lean();

  return (
    <Box sx={{ pb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
            <ArticleIcon color="primary" fontSize="large" />
            Manage Articles
          </Typography>
          <Typography color="text.secondary">View and manage all published news, facts, and guides.</Typography>
        </Box>
        <Link href="/admin/posts/new" style={{ textDecoration: 'none' }}>
          <Button variant="contained" startIcon={<AddIcon />} sx={{ px: 3 }}>
            New Post
          </Button>
        </Link>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Author</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.map((post: any) => (
              <TableRow key={post._id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{post.title}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>/{post.category}/{post.slug}</Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={post.category} 
                    size="small" 
                    color={post.category === 'news' ? 'primary' : post.category === 'fact' ? 'secondary' : 'default'} 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{post.author || "Admin"}</TableCell>
                <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  <Link href={`/admin/posts/edit/${post._id}`} style={{ textDecoration: 'none' }}>
                    <IconButton size="small" color="primary" sx={{ mr: 1 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Link>
                  <Box component="form" action={deletePost} sx={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={post._id.toString()} />
                    <IconButton type="submit" size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {posts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ py: 10, textAlign: 'center' }}>
                  <Typography color="text.secondary">No articles found. Create your first one!</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

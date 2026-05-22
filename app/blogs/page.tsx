import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import { Box, Container, Typography, Card, CardContent, CardMedia, Chip } from "@mui/material";
import Grid from "@mui/material/Grid2"; // Ensure Grid2 is used for 'size' prop
import Stack from "@mui/material/Stack"; // Import Stack explicitly
import Link from "next/link";

export default async function BlogsPage() {
  await connectDB();

  let posts = [];
  try {
    // Fetch posts from the database
    // Using .lean() to get plain JavaScript objects for better performance and serialization
    posts = await Post.find({}).sort({ createdAt: -1 }).lean();

    // Serialize ObjectId to string and Date objects to ISO strings
    // This is crucial for passing data from a Server Component to the client or for direct rendering
    posts = posts.map(post => ({
      ...post,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    }));

  } catch (error) {
    console.error("Failed to fetch posts:", error);
    // In a production application, you might want to display a user-friendly error message
    // or redirect to an error page.
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Our Blog
      </Typography>

      {posts.length === 0 ? (
        <Typography variant="h6" color="text.secondary">
          No blog posts found.
        </Typography>
      ) : (
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {posts.map((post) => (
            <Grid key={post._id} size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex' }}>
              <Card sx={{ width: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 } }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={post.image || "https://via.placeholder.com/600x400?text=KnowledgeCode"}
                  alt={post.title}
                  sx={{ objectFit: 'cover', width: '100%' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Chip 
                    label={post.category} 
                    size="small" 
                    color="primary" 
                    sx={{ mb: 1.5, textTransform: 'capitalize', fontWeight: 'bold' }} 
                  />
                  <Link href={`/blogs/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Typography
                      variant="h6"
                      component="h2"
                      sx={{
                        fontWeight: 'bold',
                        mt: 1,
                        mb: 1.5,
                        transition: 'color 0.2s',
                        '&:hover': {
                          color: 'primary.main',
                        }
                      }}
                    >
                      {post.title}
                    </Typography>
                  </Link>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {post.excerpt || (post.content ? `${post.content.substring(0, 150)}...` : '')}
                  </Typography>
                  <Stack 
                    direction="row" 
                    sx={{ 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      mt: 'auto', 
                      pt: 2 
                    }}>
                    <Typography variant="caption" color="text.secondary">
                      By {post.author}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
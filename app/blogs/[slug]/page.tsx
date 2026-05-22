import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import { Container, Typography, Box, CardMedia, Divider, Button, Paper } from "@mui/material";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PostDetailPage({ params }: PageProps) {
  const { slug } = await params;
  await connectDB();

  // Fetch the post by slug using lean() for better performance
  const post = await Post.findOne({ slug }).lean();

  if (!post) {
    notFound();
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Link href="/blogs" style={{ textDecoration: 'none' }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 4, fontWeight: "bold" }}
          color="inherit"
        >
          Back to Blog
        </Button>
      </Link>

      <Box component="article">
        <Typography variant="overline" color="primary" sx={{ fontWeight: "bold", letterSpacing: 1.2 }}>
          {post.category?.toUpperCase()}
        </Typography>

        <Typography variant="h2" component="h1" sx={{ fontWeight: 800, mb: 3, lineHeight: 1.1, fontSize: { xs: "2.5rem", md: "3.5rem" } }}>
          {post.title}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 5, color: "text.secondary" }}> {/* alignItems is already in sx */}
          <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
            By {post.author}
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.5 }}>|</Typography>
          <Typography variant="subtitle1">
            {new Date(post.createdAt as any).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ borderRadius: 4, overflow: "hidden", mb: 6, border: "1px solid", borderColor: "divider" }}>
          <CardMedia
            component="img"
            image={post.image || "https://via.placeholder.com/1200x600?text=KnowledgeCode"}
            alt={post.title}
            sx={{ 
              width: "100%", 
              height: "auto", 
              aspectRatio: '16/9',
              maxHeight: 500, 
              objectFit: "cover" 
            }}
          />
        </Paper>

        <Typography
          variant="body1"
          sx={{ fontSize: "1.15rem", lineHeight: 1.8, whiteSpace: "pre-wrap", color: "text.primary" }}
        >
          {post.content}
        </Typography>
      </Box>

      <Divider sx={{ my: 8 }} />
    </Container>
  );
}
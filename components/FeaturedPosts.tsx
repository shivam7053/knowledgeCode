"use client";
import { Card, CardContent, CardMedia, CardActions, Typography, Button, Grid, Box, Chip } from "@mui/material";
import Link from "next/link";

interface PostProps {
  posts: any[];
}

export default function FeaturedPosts({ posts }: PostProps) {
  if (!posts || posts.length === 0) return null; // Ensure posts exist

  return (
    <Box component="section" sx={{ py: 8, px: 3, maxWidth: '1200px', mx: 'auto' }}>
      <Typography variant="h4" align="center" sx={{ fontWeight: 'bold', mb: 6 }}>Latest Insight & Facts</Typography>
      <Grid container spacing={4}>
        {posts.map((post) => (
          <Grid key={post._id} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 } }}>
              <CardMedia
                component="img"
                height="180"
                image={post.image || "https://via.placeholder.com/300x180?text=KnowledgeCode"}
                alt={post.title}
                sx={{ borderRadius: 0 }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Chip label={post.category} size="small" color="primary" sx={{ mb: 1, textTransform: 'capitalize' }} />
                <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 1, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {post.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {post.excerpt}
                </Typography>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button component={Link} href={`/${post.category}/${post.slug}`} size="small" color="primary" sx={{ fontWeight: 'bold' }}>
                Read More
              </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

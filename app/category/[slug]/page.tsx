import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import { Box, Typography, Chip, Button, Link as MuiLink } from "@mui/material";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowBack as ArrowLeftIcon } from "@mui/icons-material";

export default async function PostDetailPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  await connectDB();
  const post = await Post.findOne({
    slug: slug,
    category: category,
  }).lean();

  if (!post) {
    notFound();
  }

  return (
    <Box component="article" sx={{ maxWidth: '800px', mx: 'auto', py: 8, px: 3 }}>
        <Button 
          component={MuiLink} 
          href="/" 
          variant="text" 
          size="sm" 
          startIcon={<ArrowLeftIcon fontSize="small" />} 
          sx={{ mb: 4, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
        >
          Back to Discover
        </Button>

        <Box component="header" sx={{ mb: 4 }}>
          <Chip color="primary" variant="outlined" label={post.category} sx={{ mb: 2, textTransform: 'uppercase', fontWeight: 'bold' }} />
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'extrabold', mb: 3, lineHeight: 1.2, color: 'text.primary' }}>
            {post.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.contrastText', fontWeight: 'bold' }}>
              {post.author?.charAt(0) || "A"}
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>By {post.author}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Typography>
            </Box>
          </Box>
        </Box>

        {post.image && (
          <Box sx={{ position: 'relative', borderRadius: '2rem', overflow: 'hidden', boxShadow: 3, mb: 6, '&:hover img': { transform: 'scale(1.05)' } }}>
            <Image
              src={post.image}
              alt={post.title}
              width={800} // Adjust based on your design needs
              height={450} // Adjust based on your design needs
              style={{ 
                transition: 'transform 0.7s',
                width: '100%',
                height: 'auto',
                objectFit: 'cover' 
              }}
            />
          </Box>
        )}

        <Box className="prose" sx={{ '& p': { lineHeight: 1.8, fontSize: '1.1rem', color: 'text.secondary' }, '& h1,h2,h3,h4,h5,h6': { color: 'text.primary' }, '& strong': { color: 'text.primary' } }}>
          {/* You might need to use a markdown renderer here if post.content is markdown */}
          <Typography component="div" dangerouslySetInnerHTML={{ __html: post.content }} />
        </Box>
    </Box>
  );
}

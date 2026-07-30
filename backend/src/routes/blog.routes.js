import { Router } from 'express';
import { listBlogPostsPublic, getBlogPostBySlugPublic } from '../controllers/blog.controller.js';

const router = Router();

router.get('/', listBlogPostsPublic);
router.get('/:slug', getBlogPostBySlugPublic);

export default router;

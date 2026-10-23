import { Router } from 'express';
import { prisma } from '../db.js';
const router = Router();
const wrap = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
router.get('/', wrap(async (req,res) => {
 const search = String(req.query.search || '').slice(0,100);
 const category = String(req.query.category || '').slice(0,100);
 const products = await prisma.product.findMany({where:{name:{contains:search,mode:'insensitive'},...(category?{category:{name:category}}:{})},include:{category:true},orderBy:{name:'asc'}});
 res.json(products.map(p=>({...p,price:Number(p.price)})));
}));
router.get('/categories', wrap(async (_req,res) => res.json(await prisma.category.findMany({orderBy:{name:'asc'}}))));
router.get('/:id', wrap(async (req,res) => {
 const p=await prisma.product.findUnique({where:{id:req.params.id},include:{category:true}});
 if(!p) return res.status(404).json({error:'Product not found'});
 res.json({...p,price:Number(p.price)});
}));
export default router;

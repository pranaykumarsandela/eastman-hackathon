import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { priceOrder } from '../pricing.js';
const router = Router();
const wrap = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
const schema = z.object({items:z.array(z.object({productId:z.string().uuid(),quantity:z.number().int().min(1).max(100)})).min(1),couponCode:z.string().trim().min(1).max(40)});
router.post('/validate',wrap(async(req,res)=>{
 const input=schema.parse(req.body), ids=input.items.map(x=>x.productId);
 if(new Set(ids).size!==ids.length)return res.status(400).json({error:'Duplicate cart items'});
 const products=await prisma.product.findMany({where:{id:{in:ids}}});
 if(products.length!==ids.length)return res.status(400).json({error:'Some products are unavailable'});
 const lines=input.items.map(item=>({...products.find(p=>p.id===item.productId),quantity:item.quantity}));
 for(const line of lines)if(line.quantity>line.stock)return res.status(409).json({error:`Insufficient stock for ${line.name}`});
 const coupon=await prisma.coupon.findUnique({where:{code:input.couponCode.toUpperCase()}});
 if(!coupon)return res.status(400).json({error:'Invalid coupon code'});
 res.json(priceOrder(lines,coupon));
}));
export default router;

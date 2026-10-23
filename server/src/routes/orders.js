import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { prisma } from '../db.js';
import { priceOrder, toPaise, rupees } from '../pricing.js';
import { requireAuth } from '../auth.js';

const router = Router();
export const checkoutRouter = Router();

const wrap = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
const itemsSchema=z.array(z.object({productId:z.string().uuid(),quantity:z.number().int().min(1).max(100)})).min(1);
const cartSchema=z.object({items:itemsSchema,couponCode:z.string().trim().max(40).optional().default('')});
const orderSchema=cartSchema.extend({idempotencyKey:z.string().uuid()});
async function calculate(tx,input){
 const ids=input.items.map(x=>x.productId);
 if(new Set(ids).size!==ids.length)throw Object.assign(new Error('Duplicate cart item'),{status:400});
 const products=await tx.product.findMany({where:{id:{in:ids}}});
 if(products.length!==ids.length)throw Object.assign(new Error('Some products are unavailable'),{status:400});
 const lines=input.items.map(item=>{const p=products.find(x=>x.id===item.productId);if(item.quantity>p.stock)throw Object.assign(new Error(`Insufficient stock for ${p.name}`),{status:409});return {...p,quantity:item.quantity};});
 const coupon=input.couponCode?await tx.coupon.findUnique({where:{code:input.couponCode.toUpperCase()}}):null;
 if(input.couponCode&&!coupon)throw Object.assign(new Error('Invalid coupon'),{status:400});
 return {lines,coupon,summary:priceOrder(lines,coupon)};
}

checkoutRouter.post('/preview', wrap(async (req, res) => {
  const input = cartSchema.parse(req.body);
  const { summary } = await calculate(prisma, input);
  res.json(summary);
}));

router.post('/',requireAuth,wrap(async(req,res)=>{
 const input=orderSchema.parse(req.body);
 const existing=await prisma.order.findUnique({where:{id:input.idempotencyKey},include:{items:true}});
 if(existing){if(existing.userId!==req.user.id)return res.status(409).json({error:'Order reference already used'});return res.json(existing);}
 try{
 const order=await prisma.$transaction(async tx=>{
  const {lines,coupon,summary}=await calculate(tx,input);
  for(const line of lines){const result=await tx.product.updateMany({where:{id:line.id,stock:{gte:line.quantity}},data:{stock:{decrement:line.quantity}}});if(result.count!==1)throw Object.assign(new Error(`Insufficient stock for ${line.name}`),{status:409});}
  return tx.order.create({data:{id:input.idempotencyKey,orderNumber:'SC-'+randomUUID().slice(0,8).toUpperCase(),userId:req.user.id,customerName:req.user.name,customerEmail:req.user.email,subtotal:summary.subtotal,discount:summary.discount,total:summary.total,couponId:coupon?.id,items:{create:lines.map(p=>({productId:p.id,name:p.name,unitPrice:p.price,quantity:p.quantity,lineTotal:rupees(toPaise(p.price)*p.quantity)}))}},include:{items:true}});
 },{isolationLevel:'Serializable'});
 res.status(201).json(order);
 }catch(e){if(e.code==='P2002'||e.code==='P2034'){const prior=await prisma.order.findUnique({where:{id:input.idempotencyKey},include:{items:true}});if(prior&&prior.userId===req.user.id)return res.json(prior);e.status=409;}throw e;}
}));
router.get('/mine',requireAuth,wrap(async(req,res)=>{
 const orders=await prisma.order.findMany({where:{userId:req.user.id},include:{items:true},orderBy:{createdAt:'desc'}});
 res.json(orders);
}));
router.get('/:orderNumber',requireAuth,wrap(async(req,res)=>{
 const order=await prisma.order.findFirst({where:{orderNumber:req.params.orderNumber,userId:req.user.id},include:{items:true}});
 if(!order)return res.status(404).json({error:'Order not found'});
 res.json(order);
}));

checkoutRouter.post('/best-coupon', wrap(async (req, res) => {
  const input = cartSchema.parse(req.body);

  // Calculate the original cart total without a coupon.
  const { summary: original } = await calculate(prisma, {
    ...input,
    couponCode: ''
  });

  // Fetch available coupon codes from PostgreSQL.
  const coupons = await prisma.coupon.findMany({
    select: { code: true }
  });

  let bestCoupon = null;
  let bestSummary = original;
  let maxSavings = 0;

  for (const coupon of coupons) {
    try {
      // Reuse the existing pricing and coupon validation.
      const { summary } = await calculate(prisma, {
        ...input,
        couponCode: coupon.code
      });

      const savings = Number(summary.discount);

      if (Number.isFinite(savings) && savings > maxSavings) {
        maxSavings = savings;
        bestCoupon = coupon.code;
        bestSummary = summary;
      }
    } catch (error) {
      // Skip coupons that are invalid or ineligible.
      // Unexpected errors should still reach Express.
      if (error.status === 400) continue;
      throw error;
    }
  }

  res.json({
    recommendedCoupon: bestCoupon,
    savings: maxSavings,
    originalTotal: original.total,
    finalTotal: bestSummary.total,
    summary: bestSummary
  });
}));

export default router;

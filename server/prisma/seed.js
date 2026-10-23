import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const entries = [
 ['Electronics','Wireless Mouse',799,'Ergonomic mouse with silent clicks','https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=700'],
 ['Electronics','Mechanical Keyboard',2499,'Tactile keyboard for productivity','https://images.unsplash.com/photo-1595225476474-87563907a212?w=700'],
 ['Electronics','Wireless Headphones',3299,'Comfortable sound for every day','https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700'],
 ['Electronics','Smart Watch',3999,'Fitness and notification companion','https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700'],
 ['Home','Desk Lamp',1299,'Minimal adjustable LED desk light','https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700'],
 ['Home','Ceramic Mug',499,'Everyday ceramic coffee mug','https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=700'],
 ['Accessories','Canvas Backpack',1899,'Versatile everyday travel backpack','https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700'],
 ['Accessories','Sunglasses',999,'Classic lightweight sunglasses','https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=700'],
 ['Home','Water Bottle',699,'Reusable insulated bottle','https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=700'],
 ['Electronics','Laptop Stand',1199,'Elevated ergonomic desk setup','https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=700'],
 ['Accessories','Analog Watch',2799,'Elegant minimal wristwatch','https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=700'],
 ['Home','Indoor Plant',599,'A touch of green for your desk','https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700']
];
for (const [cat,name,price,description,imageUrl] of entries) {
 const category = await prisma.category.upsert({where:{name:cat},update:{},create:{name:cat}});
 const existing = await prisma.product.findFirst({where:{name}});
 if(!existing) await prisma.product.create({data:{name,price,description,imageUrl,stock:20,categoryId:category.id}});
}
for(const data of [
 {code:'SAVE10',type:'PERCENTAGE',value:10,minOrderAmount:1000},
 {code:'FLAT200',type:'FLAT',value:200,minOrderAmount:2000},
 {code:'WELCOME15',type:'PERCENTAGE',value:15,minOrderAmount:3000}
]) await prisma.coupon.upsert({where:{code:data.code},update:data,create:data});
console.log('Seed complete');
await prisma.$disconnect();

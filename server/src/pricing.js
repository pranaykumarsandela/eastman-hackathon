// Prices are converted to integer paise for safe arithmetic.
export const toPaise = value => Math.round(Number(value) * 100);
export const rupees = paise => (paise / 100).toFixed(2);
export class DiscountStrategy { calculate() { throw new Error('Implement calculate'); } }
export class PercentageDiscount extends DiscountStrategy {
 constructor(percent) { super(); this.percent = Number(percent); }
 calculate(subtotal) { return Math.round(subtotal * this.percent / 100); }
}
export class FlatDiscount extends DiscountStrategy {
 constructor(amount) { super(); this.amount = toPaise(amount); }
 calculate(subtotal) { return Math.min(subtotal, this.amount); }
}
export function priceOrder(products, coupon) {
 const subtotal = products.reduce((sum,p)=>sum + toPaise(p.price)*p.quantity,0);
 let discount = 0;
 if(coupon) {
   if(!coupon.active) throw Object.assign(new Error('Coupon is inactive'),{status:400});
   if(subtotal < toPaise(coupon.minOrderAmount)) throw Object.assign(new Error(`Minimum order is ₹${coupon.minOrderAmount}`),{status:400});
   const strategy = coupon.type === 'PERCENTAGE' ? new PercentageDiscount(coupon.value) : new FlatDiscount(coupon.value);
   discount = Math.min(subtotal, Math.max(0, strategy.calculate(subtotal)));
 }
 return {subtotal:rupees(subtotal),discount:rupees(discount),total:rupees(subtotal-discount)};
}

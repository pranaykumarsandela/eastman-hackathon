import test from 'node:test';
import assert from 'node:assert/strict';
import {priceOrder} from './pricing.js';
const lines=[{price:'799.00',quantity:2},{price:'1499.00',quantity:1}];
test('subtotal without coupon',()=>assert.deepEqual(priceOrder(lines,null),{subtotal:'3097.00',discount:'0.00',total:'3097.00'}));
test('percentage discount',()=>assert.equal(priceOrder(lines,{active:true,type:'PERCENTAGE',value:10,minOrderAmount:1000}).total,'2787.30'));
test('flat discount',()=>assert.equal(priceOrder(lines,{active:true,type:'FLAT',value:200,minOrderAmount:0}).total,'2897.00'));
test('minimum order restriction',()=>assert.throws(()=>priceOrder(lines,{active:true,type:'FLAT',value:200,minOrderAmount:4000}),/Minimum order/));

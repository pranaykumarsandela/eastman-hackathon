import React,{createContext,useContext,useEffect,useReducer} from 'react';
const Context=createContext(null);
const reducer=(state,action)=>{
 switch(action.type){
 case 'ADD':{const old=state.find(i=>i.id===action.product.id);return old?state.map(i=>i.id===old.id?{...i,quantity:Math.min(i.stock,i.quantity+1)}:i):[...state,{...action.product,quantity:1}];}
 case 'QTY':return state.map(i=>i.id===action.id?{...i,quantity:Math.max(1,Math.min(i.stock,action.quantity))}:i);
 case 'REMOVE':return state.filter(i=>i.id!==action.id);
 case 'CLEAR':return [];
 default:return state;
 }
};
export function CartProvider({children}){
 const [items,dispatch]=useReducer(reducer,[],()=>{try{return JSON.parse(localStorage.getItem('smartcart-items')||'[]')}catch{return []}});
 useEffect(()=>localStorage.setItem('smartcart-items',JSON.stringify(items)),[items]);
 return <Context.Provider value={{items,dispatch,count:items.reduce((s,i)=>s+i.quantity,0),subtotal:items.reduce((s,i)=>s+i.price*i.quantity,0)}}>{children}</Context.Provider>;
}
export const useCart=()=>useContext(Context);

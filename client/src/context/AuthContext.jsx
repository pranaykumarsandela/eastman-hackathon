import React,{createContext,useContext,useEffect,useState} from 'react';
import {api} from '../services/api.js';
const AuthContext=createContext(null);
export function AuthProvider({children}){
 const [user,setUser]=useState(null),[loading,setLoading]=useState(true);
 useEffect(()=>{api.get('/auth/me').then(r=>setUser(r.data.user)).catch(()=>setUser(null)).finally(()=>setLoading(false));},[]);
 const register=async data=>{const res=await api.post('/auth/register',data);setUser(res.data.user);};
 const login=async data=>{const res=await api.post('/auth/login',data);setUser(res.data.user);};
 const logout=async()=>{await api.post('/auth/logout');setUser(null);};
 return <AuthContext.Provider value={{user,loading,register,login,logout}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);

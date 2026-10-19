import {createContext,useContext,useEffect,useState} from 'react';
import api from '../services/api.js';
const Context=createContext(null);
export function AuthProvider({children}){const[user,setUser]=useState(null);const[loading,setLoading]=useState(true);useEffect(()=>{api.get('/auth/me').then(r=>setUser(r.data.user)).catch(()=>setUser(null)).finally(()=>setLoading(false));},[]);const login=async(data,mode)=>{const r=await api.post('/auth/'+mode,data);setUser(r.data.user);return r.data.user;};const logout=async()=>{try{await api.post('/auth/logout');}finally{setUser(null);}};return <Context.Provider value={{user,loading,login,logout,setUser}}>{children}</Context.Provider>;}
export const useAuth=()=>useContext(Context);

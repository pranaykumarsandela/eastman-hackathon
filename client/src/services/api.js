import axios from 'axios';
export const api=axios.create({baseURL:'/api',withCredentials:true});
export const errorMessage=e=>e.response?.data?.error||e.message||'Something went wrong';

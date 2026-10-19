import axios from 'axios';
const api=axios.create({baseURL:'/api',withCredentials:true});
api.interceptors.request.use(config=>{config.headers['x-easybiz-request']='1';const id=localStorage.getItem('easybiz_business');if(id)config.headers['x-business-id']=id;return config;});
export default api;
export const messageFromError=e=>e.response?.data?.message||e.message||'Request failed';

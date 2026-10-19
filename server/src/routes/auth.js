import {Router} from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {z} from 'zod';
import User from '../models/User.js';
import {requireAuth} from '../middleware/auth.js';
const router=Router();
const credentials=z.object({email:z.string().email().max(254).transform(v=>v.toLowerCase().trim()),password:z.string().min(8).max(128)});
const registration=credentials.extend({name:z.string().trim().min(2).max(100)});
function session(res,user){const token=jwt.sign({ver:user.sessionVersion||0},process.env.JWT_SECRET,{subject:String(user._id),expiresIn:'8h',algorithm:'HS256'});res.cookie('easybiz_session',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:8*60*60*1000,path:'/'});}
const safe=user=>({id:String(user._id),name:user.name,email:user.email,photo:user.photo||''});
router.post('/register',async(req,res,next)=>{try{const parsed=registration.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:'Invalid name, email, or password (minimum 8 characters)'});const {name,email,password}=parsed.data;if(await User.exists({email}))return res.status(409).json({message:'Email is already registered'});const passwordHash=await bcrypt.hash(password,12);const user=await User.create({name,email,passwordHash});session(res,user);res.status(201).json({user:safe(user)});}catch(e){if(e.code===11000)return res.status(409).json({message:'Email is already registered'});next(e);}});
router.post('/login',async(req,res,next)=>{try{const parsed=credentials.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:'Invalid credentials'});const user=await User.findOne({email:parsed.data.email}).select('+passwordHash');if(!user||!(await bcrypt.compare(parsed.data.password,user.passwordHash)))return res.status(401).json({message:'Invalid credentials'});session(res,user);res.json({user:safe(user)});}catch(e){next(e);}});
router.get('/me',requireAuth,(req,res)=>res.json({user:safe(req.user)}));
router.patch('/profile',requireAuth,async(req,res,next)=>{try{const parsed=z.object({name:z.string().trim().min(2).max(100).optional(),photo:z.string().max(350000).refine(v=>!v||/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(v),'Invalid owner photo').optional()}).strict().safeParse(req.body);if(!parsed.success)return res.status(400).json({message:'Name must contain 2–100 characters'});Object.assign(req.user,parsed.data);await req.user.save();res.json({user:safe(req.user)});}catch(e){next(e);}});
router.post('/change-password',requireAuth,async(req,res,next)=>{try{const parsed=z.object({currentPassword:z.string().min(1),newPassword:z.string().min(8).max(128)}).strict().safeParse(req.body);if(!parsed.success)return res.status(400).json({message:'New password must be at least 8 characters'});const user=await User.findById(req.user._id).select('+passwordHash');if(!await bcrypt.compare(parsed.data.currentPassword,user.passwordHash))return res.status(403).json({message:'Current password is incorrect'});user.passwordHash=await bcrypt.hash(parsed.data.newPassword,12);user.sessionVersion=(user.sessionVersion||0)+1;await user.save();res.clearCookie('easybiz_session',{path:'/',sameSite:'lax',secure:process.env.NODE_ENV==='production'});res.json({message:'Password updated. Please sign in again.'});}catch(e){next(e);}});
router.post('/logout',(_req,res)=>{res.clearCookie('easybiz_session',{path:'/',sameSite:'lax',secure:process.env.NODE_ENV==='production'});res.json({message:'Signed out'});});
export default router;

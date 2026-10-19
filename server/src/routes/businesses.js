import {Router} from 'express';
import mongoose from 'mongoose';
import {z} from 'zod';
import Business from '../models/Business.js';
import BusinessMember from '../models/BusinessMember.js';
import {requireAuth} from '../middleware/auth.js';
const router=Router();router.use(requireAuth);
const schema=z.object({name:z.string().trim().min(2).max(120),type:z.enum(['retail','wholesale','service','manufacturing','other']),currency:z.enum(['BDT','USD','CNY'])});
router.get('/',async(req,res,next)=>{try{const memberships=await BusinessMember.find({user:req.user._id}).populate('business','name type currency');res.json({businesses:memberships.filter(x=>x.business).map(x=>({...x.business.toObject(),role:x.role}))});}catch(e){next(e);}});
router.post('/',async(req,res,next)=>{const exists=await Business.findOne({owner:req.user._id});if(exists)return res.status(409).json({message:'Your account already has a shop. Edit its details in Profile.'});const parsed=schema.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:'Invalid business details'});let business;try{business=await Business.create({...parsed.data,owner:req.user._id});await BusinessMember.create({business:business._id,user:req.user._id,role:'owner'});res.status(201).json({business});}catch(e){if(business)await Business.deleteOne({_id:business._id}).catch(()=>{});next(e);}});
router.get('/:id',async(req,res,next)=>{try{if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({message:'Invalid business ID'});const member=await BusinessMember.findOne({business:req.params.id,user:req.user._id});if(!member)return res.status(404).json({message:'Business not found'});const business=await Business.findById(req.params.id);res.json({business,role:member.role});}catch(e){next(e);}});


// Profile is limited to the shop owner; existing records remain accessible.
router.patch('/mine',async(req,res,next)=>{try{const shop=await Business.findOne({owner:req.user._id});if(!shop)return res.status(404).json({message:'Create your shop first'});const parsed=z.object({name:z.string().trim().min(2).max(120).optional(),type:z.enum(['retail','wholesale','service','manufacturing','other']).optional(),photo:z.string().max(350000).refine(v=>!v||/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(v),'Use PNG, JPG or WebP').optional()}).strict().safeParse(req.body);if(!parsed.success)return res.status(400).json({message:'Invalid shop details or image too large'});Object.assign(shop,parsed.data);await shop.save();res.json({business:shop});}catch(e){next(e);}});
router.get('/mine/profile',async(req,res,next)=>{try{const shop=await Business.findOne({owner:req.user._id});res.json({business:shop});}catch(e){next(e);}});
export default router;

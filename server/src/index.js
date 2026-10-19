import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import {connectDB} from './config/db.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import businessRoutes from './routes/businesses.js';
import workspaceRoutes from './routes/workspace.js';
if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32){console.error('Set JWT_SECRET to at least 32 random characters in server/.env');process.exit(1);}
const app=express();app.disable('x-powered-by');app.use(helmet());app.use(cors({origin:process.env.CLIENT_ORIGIN||'http://localhost:5173',credentials:true}));app.use(express.json({limit:'100kb'}));app.use(cookieParser());
// Cookie-based API: block cross-origin state changes even if a cookie is sent.
app.use('/api',(req,res,next)=>{if(['GET','HEAD','OPTIONS'].includes(req.method))return next();const expected=process.env.CLIENT_ORIGIN||'http://localhost:5173';const origin=req.get('origin');if(origin&&origin!==expected)return res.status(403).json({message:'Origin not allowed'});if(req.cookies?.easybiz_session&&req.get('x-easybiz-request')!=='1')return res.status(403).json({message:'Request verification failed'});next();});
app.use('/api/auth',rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:'draft-7',legacyHeaders:false}),authRoutes);
app.use('/api',rateLimit({windowMs:60*1000,limit:120,standardHeaders:'draft-7',legacyHeaders:false}));
app.use('/api/workspace/copilot',rateLimit({windowMs:60*1000,limit:8,standardHeaders:'draft-7',legacyHeaders:false}));app.use('/api/health',healthRoutes);app.use('/api/businesses',businessRoutes);app.use('/api/workspace',workspaceRoutes);
app.use((_req,res)=>res.status(404).json({message:'Route not found'}));app.use((err,_req,res,_next)=>{console.error(err);res.status(err.status||500).json({message:err.status?err.message:(err.code===11000?'Duplicate value: product SKU or email already exists':err.message?.includes('Transaction numbers are only allowed')?'MongoDB transactions require Atlas or a replica set':'Unexpected server error')});});
const port=Number(process.env.PORT)||5001;
try{await connectDB();if(!process.env.MONGODB_URI)throw Error('MONGODB_URI missing');app.listen(port,()=>console.log(`EasyBiz API listening on http://localhost:${port}`));}catch(error){console.error('Database startup failed:',error.message);process.exit(1);}

import mongoose from 'mongoose';
const businessSchema=new mongoose.Schema({name:{type:String,required:true,trim:true,maxlength:120},type:{type:String,enum:['retail','wholesale','service','manufacturing','other'],default:'retail'},currency:{type:String,enum:['BDT','USD','CNY'],default:'BDT'},photo:{type:String,default:''},owner:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true}}, {timestamps:true});
export default mongoose.model('Business',businessSchema);

import mongoose from 'mongoose';
const memberSchema=new mongoose.Schema({business:{type:mongoose.Schema.Types.ObjectId,ref:'Business',required:true},user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},role:{type:String,enum:['owner','admin','staff','viewer'],required:true}}, {timestamps:true});
memberSchema.index({business:1,user:1},{unique:true});
export default mongoose.model('BusinessMember',memberSchema);

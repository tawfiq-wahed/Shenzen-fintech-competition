import mongoose from 'mongoose';
const userSchema=new mongoose.Schema({name:{type:String,required:true,trim:true,maxlength:100},email:{type:String,required:true,lowercase:true,trim:true,unique:true},passwordHash:{type:String,required:true,select:false},photo:{type:String,default:''},sessionVersion:{type:Number,default:0}}, {timestamps:true});
export default mongoose.model('User',userSchema);

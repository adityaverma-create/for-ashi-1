import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { names, type Profile, readPrivate, writePrivate, hasShared, setCookie, sign } from "@/lib";
const attempts=new Map<string,{count:number,until:number}>();
function limited(key:string){const now=Date.now(),x=attempts.get(key);if(x&&x.until>now&&x.count>=8)return true;if(!x||x.until<now)attempts.set(key,{count:1,until:now+900000});else x.count++;return false;}
export async function GET(req:NextRequest){
 if(!(await hasShared()))return NextResponse.json({error:"Sign in first."},{status:401});
 const profile=req.nextUrl.searchParams.get("profile") as Profile;if(!names.includes(profile))return NextResponse.json({error:"Choose a profile."},{status:400});
 const auth=await readPrivate("auth/"+profile+".json");return NextResponse.json({configured:!!auth,question:auth?.question??null});
}
export async function POST(req:NextRequest){
 if(!(await hasShared()))return NextResponse.json({error:"Sign in first."},{status:401});
 const body=await req.json().catch(()=>null),{profile,action,pin,question,answer}=body||{};
 if(!names.includes(profile))return NextResponse.json({error:"Choose a profile."},{status:400});
 const key=profile+":"+(req.headers.get("x-forwarded-for")||"unknown");if(limited(key))return NextResponse.json({error:"Too many attempts. Try again in 15 minutes."},{status:429});
 let auth=await readPrivate("auth/"+profile+".json");
 if(action==="setup"){
  if(auth)return NextResponse.json({error:"This profile is already set up."},{status:409});
  if(typeof pin!=="string"||!/^\d{6}$/.test(pin)||typeof question!=="string"||question.trim().length<5||typeof answer!=="string"||answer.trim().length<2)return NextResponse.json({error:"Use a 6-digit PIN and complete the recovery question and answer."},{status:400});
  auth={pinHash:await bcrypt.hash(pin,12),question:question.trim().slice(0,120),answerHash:await bcrypt.hash(answer.trim().toLowerCase(),12)};await writePrivate("auth/"+profile+".json",auth);
 }else if(action==="login"){
  if(!auth||typeof pin!=="string"||!(await bcrypt.compare(pin,auth.pinHash)))return NextResponse.json({error:"Incorrect PIN."},{status:401});
 }else if(action==="recover"){
  if(!auth||typeof answer!=="string"||!(await bcrypt.compare(answer.trim().toLowerCase(),auth.answerHash)))return NextResponse.json({error:"That recovery answer doesn't match."},{status:401});
  if(typeof pin!=="string"||!/^\d{6}$/.test(pin))return NextResponse.json({error:"Choose a new 6-digit PIN."},{status:400});
  auth.pinHash=await bcrypt.hash(pin,12);await writePrivate("auth/"+profile+".json",auth);
 }else return NextResponse.json({error:"Unknown action."},{status:400});
 attempts.delete(key);const res=NextResponse.json({ok:true,profile});setCookie(res,"profile_session",sign(profile+":"+Date.now()));return res;
}

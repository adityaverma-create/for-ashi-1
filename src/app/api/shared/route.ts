import { NextRequest, NextResponse } from "next/server";
import { setCookie, sign } from "@/lib";
import { timingSafeEqual } from "node:crypto";
export async function POST(req: NextRequest) {
 const {password}=await req.json().catch(()=>({})), expected=process.env.SITE_PASSWORD||"";
 const a=Buffer.from(typeof password==="string"?password:""),b=Buffer.from(expected);
 if(!expected||a.length!==b.length||!timingSafeEqual(a,b)) return NextResponse.json({error:"That password doesn't match."},{status:401});
 const res=NextResponse.json({ok:true});setCookie(res,"site_access",sign("shared"));return res;
}

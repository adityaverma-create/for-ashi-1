import { NextRequest, NextResponse } from "next/server";
import { currentProfile, readPrivate, writePrivate, blank } from "@/lib";
export async function GET(){const p=await currentProfile();if(!p)return NextResponse.json({error:"Profile session required."},{status:401});return NextResponse.json({...((await readPrivate("profiles/"+p+"/data.json"))??blank),profile:p});}
export async function PUT(req:NextRequest){
 const p=await currentProfile();if(!p)return NextResponse.json({error:"Profile session required."},{status:401});
 const body=await req.json().catch(()=>null);if(!body||!Array.isArray(body.photos)||!Array.isArray(body.diary)||!Array.isArray(body.ritual))return NextResponse.json({error:"Invalid scrapbook data."},{status:400});
 if(body.photos.length>500||body.diary.length>500||body.ritual.length>20)return NextResponse.json({error:"Scrapbook limit reached."},{status:413});
 await writePrivate("profiles/"+p+"/data.json",{photos:body.photos,diary:body.diary,ritual:body.ritual});return NextResponse.json({ok:true});
}

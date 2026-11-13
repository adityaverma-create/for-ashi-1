import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { currentProfile } from "@/lib";
export async function POST(req:NextRequest){
 const p=await currentProfile();if(!p)return NextResponse.json({error:"Profile session required."},{status:401});
 const file=(await req.formData()).get("file");if(!(file instanceof File)||!file.type.startsWith("image/"))return NextResponse.json({error:"Choose an image."},{status:400});
 if(file.size>8*1024*1024)return NextResponse.json({error:"Images must be under 8 MB."},{status:413});
 const blob=await put("profiles/"+p+"/photos/"+crypto.randomUUID(),file,{access:"private",addRandomSuffix:true,token:process.env.BLOB_READ_WRITE_TOKEN});return NextResponse.json({path:blob.pathname});
}

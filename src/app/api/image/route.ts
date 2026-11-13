import { NextRequest } from "next/server";
import { get,list } from "@vercel/blob";
import { currentProfile } from "@/lib";
export async function GET(req:NextRequest){
 const p=await currentProfile();if(!p)return new Response("Unauthorized",{status:401});
 const path=req.nextUrl.searchParams.get("path")||"";if(!path.startsWith("profiles/"+p+"/photos/")||path.includes(".."))return new Response("Not found",{status:404});
 const token=process.env.BLOB_READ_WRITE_TOKEN!,blobs=await list({prefix:path,token}),blob=blobs.blobs.find(b=>b.pathname===path);if(!blob)return new Response("Not found",{status:404});
 const result=await get(blob.url,{access:"private",token});if(!result)return new Response("Not found",{status:404});
 return new Response(result.stream,{headers:{"Content-Type":result.blob.contentType||"image/jpeg","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}

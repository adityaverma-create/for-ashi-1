import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"Our Little Forever",description:"A little place for our favourite memories."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}

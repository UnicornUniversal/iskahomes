'use client'
import Image from "next/image";
import Banner from "./components/Ads/Banner";
import Header from "./components/Header";
import HomeProperties from "./components/HomeProperties";
import SideBanner from "./components/Ads/SideBanner";
import DevelopmentHeaders from "./components/developers/DevelopmentHeaders";
import PostHogDebug from "./components/PostHogDebug";
import Layout1 from "./layout/Layout1";
import Nav from "./components/Nav";
export default function Home() {
  return (
   <div className="  w-full h-full flex flex-col items-center justify-center" >
   <Nav />
   <Layout1>

      <Header />
      {/* <Banner /> */}
      {/* <DevelopmentHeaders /> */}

      <div className="flex flex-col md:flex-row gap-4  w-full  mt-[3em]">
  
  <div className="w-full h-full ">
  <HomeProperties />
  </div>
{/*       
        <div className="w-full h-full  md:w-[20%]">
        <SideBanner />
        </div> */}
       
      </div>
      </Layout1>

      {/* <PostHogDebug /> */}
   </div>
  );
}

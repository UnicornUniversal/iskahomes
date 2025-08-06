import Image from "next/image";
import Banner from "./components/Ads/Banner";
import Header from "./components/Header";
import HomeProperties from "./components/HomeProperties";
import SideBanner from "./components/Ads/SideBanner";
import Layout1 from "./layout/Layout1";

export default function Home() {
  return (
   <div className="  w-full h-full flex flex-col items-center justify-center" >
   
      <Header />
      <Banner />

      <div className="flex flex-col md:flex-row gap-4  w-full  mt-[3em]">
  
  <div className="w-full h-full md:w-[75%]">
  <HomeProperties />
  </div>
      
        <div className="w-full h-full  md:w-[20%]">
        <SideBanner />
        </div>
       
      </div>

   </div>
  );
}

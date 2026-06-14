"use client";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardHref, getUserDisplayName } from "@/lib/dashboardRoutes";
import { 
  FaHome, 
  FaCogs, 
  FaSearch, 
  FaHandshake, 
  FaBuilding, 
  FaCity,
  FaUsers, 
  FaSitemap,
  FaInfoCircle, 
  FaUserPlus, 
  FaSignInAlt, 
  FaEnvelope,
  FaBars,
  FaTimes,
  FaUser,
  FaSignOutAlt
} from "react-icons/fa";

const Nav = () => {
  const [show_nav, set_show_nav] = useState(false);
  const [sub_menu, set_sub_menu] =  useState("");
  const { user, loading, logout } = useAuth();
  const dashboardHref = user ? getDashboardHref(user) : null;
  const displayName = user ? getUserDisplayName(user) : '';

  const nav_options = useMemo(() => [
    { nav_name: "Home", nav_icon: FaHome, nav_link: "/" },
   
    { nav_name: "All Services", nav_icon: FaCogs, nav_link: "/home/allServices", sub_menu:[
      {"sub_link_name":"Virtual Tour", "sub_link_link":"/home/allServices"  },
      {"sub_link_name":"3D Visualization", "sub_link_link":"/home/allServices"  },
      {"sub_link_name":"Interior Design", "sub_link_link":"/home/allServices"  },
      {"sub_link_name":"Smart Home Installation", "sub_link_link":"/home/allServices"  },
      {"sub_link_name":"Space Planning Consultation", "sub_link_link":"/home/allServices"  },
    ] },  
    { nav_name: "Explore Properties", nav_icon: FaSearch, nav_link: "/home/exploreProperties" },
    // { nav_name: "Sell A Property", nav_icon: FaHandshake, nav_link: "/projects" },
    { nav_name: "Developers", nav_icon: FaBuilding, nav_link: "/home/allDevelopers" },
    { nav_name: "All Developments", nav_icon: FaCity, nav_link: "/home/allDevelopments" },
    { nav_name: "Agencies", nav_icon: FaSitemap, nav_link: "/home/allAgencies" },
    {
      nav_name: "Agents",
      nav_icon: FaUsers,
      nav_link:
        user?.user_type === "agent" && dashboardHref
          ? dashboardHref
          : "/home/allAgents",
    },
    { nav_name: "About Us", nav_icon: FaInfoCircle, nav_link: "/home/aboutUs" },
    { nav_name: "Contact Us", nav_icon: FaEnvelope, nav_link: "/home/contactUs" },


  
  ], [user?.user_type, dashboardHref]);


const button_options = [
  { nav_name: "Sign Up", nav_icon: FaUserPlus, nav_link: "/home/signup", isButton: true },
  { nav_name: "Login", nav_icon: FaSignInAlt, nav_link: "/home/signin", isButton: true },
];

const handleLogout = () => {
  logout();
  set_show_nav(false);
};

  return (
    <div className="fixed top-0 w-full left-1/2 -translate-x-1/2 z-[2000] backdrop-blur-md">
      {/* Toggle button for small + medium screens */}
      <div
        className="absolute top-4 right-4 lg:hidden bg-secondary_color p-2 rounded-sm z-[200] cursor-pointer"
        onClick={() => set_show_nav(!show_nav)}
      >
        {show_nav ? (
          <FaTimes size={24} className="text-white" />
        ) : (
          <FaBars size={24} className="text-white" />
        )}
      </div>

      {/* Navigation menu */}
      <div
        className={`${
          show_nav ? "block pt-20" : "hidden"
        } lg:flex py-[2em] lg:py-4 px-4  items-center lg:justify-between lg:gap-0 lg:p-2 lg:px-8 lg:shadow-lg lg:bg-white/90 lg:backdrop-blur-lg w-[90%] lg:w-full h-screen lg:h-auto max-h-screen lg:min-h-[30px] overflow-y-auto lg:overflow-visible bg-white/90 shadow-xl backdrop-blur-lg`}
      >
        {/* Logo (left) */}
        <Link href="/">
        <img
          src="/iska-dark.png"
          alt="Company Logo"
          className="hidden lg:block max-w-[150px] lg:max-w-[100px] w-[12em] lg:w-[4em] lg:mr-8" />
        <img
          src="/iska-dark.png"
          alt="Company Logo"
          className="block   lg:hidden w-[12em] max-w-[150px] mb-8 " />
</Link>
        {/* Nav items (centered on md+) */}
        <div className="flex flex-col lg:flex-row gap-2 lg:gap-2 h-auto items-start lg:items-center justify-start lg:justify-center w-full lg:w-auto flex-1">
          {nav_options.map((each_value) => {
            const IconComponent = each_value.nav_icon;
            return (
              <div key={each_value.nav_name} className="relative w-full lg:w-auto" onMouseEnter={()=>{each_value?.sub_menu ? set_sub_menu( each_value.nav_name) :set_sub_menu ("") }}  onMouseLeave={()=>{ set_sub_menu ("") }}  > 
                <Link href={each_value.nav_link} >
                  <div 
                    onClick={()=>{ set_show_nav(false)}}
                    className={`flex items-center gap-3 text-left lg:text-center text-[1.2em] lg:text-xs cursor-pointer transition-all duration-500 px-2 py-3 lg:px-3 lg:py-2 rounded-lg w-full lg:w-auto ${
                      each_value.isButton 
                        ? "bg-primary_color text-white px-4 py-2 lg:px-0 lg:py-0 rounded-md hover:bg-opacity-90" 
                        : "text-primary_color lg:hover:text-[1.1em] lg:hover:font-semibold hover:bg-primary_color/10"
                    }`}
                  >
                    <IconComponent size={22} className="lg:hidden" />
                    <span>{each_value.nav_name}</span>
                  </div>
                </Link>  

                <div className="bg-white-200 bg-[rgba(255,255,255,1)]"> 
                {each_value?.sub_menu && sub_menu === each_value.nav_name  ? <div className=" bg-white-200 bg-[rgba(255,255,255,1)] px-10 lg:absolute lg:shadow-xl lg:rounded-sm lg:top-[2em] lg:w-[15em] lg:h-[14em] flex flex-col justify-around items-start px-4" >
                  {each_value?.sub_menu.map((each_sublink, index)=> {
                    return <Link href={each_sublink.sub_link_link} key={index}> <p className="text-primary_color lg:hover:text-[1.1em] lg:hover:font-semibold transition-all duration-500 text-[1em] lg:text-xs cursor-pointer">{each_sublink.sub_link_name} </p> </Link>
                  })}
                </div> : "" }
                </div>


                </div>
            );
          })}
        </div>

        {/* Buttons (right on lg+) */}
        <div className="flex flex-col gap-4 w-full lg:flex-row lg:gap-4 lg:w-auto lg:ml-8 lg:justify-end mt-4 lg:mt-0">
          {loading ? (
            <div className="flex items-center justify-center px-4 py-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary_color"></div>
            </div>
          ) : user ? (
            <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto relative z-10">
              {dashboardHref ? (
                <Link href={dashboardHref} className="w-full lg:w-auto">
                  <div
                    onClick={() => set_show_nav(false)}
                    className="flex items-center gap-3 justify-center text-left lg:text-center text-[1.1em] lg:text-sm cursor-pointer transition-all duration-500 bg-primary_color text-white px-4 py-3 lg:px-6 lg:py-2 rounded-lg hover:bg-opacity-90 w-full lg:w-auto shadow-md hover:shadow-lg"
                  >
                    <FaUser size={22} className="lg:hidden" />
                    <span className="text-xs font-medium">
                      Welcome, {displayName}
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-3 justify-center text-left lg:text-center text-[1.1em] lg:text-sm bg-primary_color text-white px-4 py-3 lg:px-6 lg:py-2 rounded-lg w-full lg:w-auto">
                  <FaUser size={22} className="lg:hidden" />
                  <span className="text-xs font-medium">
                    Welcome, {displayName}
                  </span>
                </div>
              )}
              
              {/* Logout button - commented out for now */}
              {/* <button
                onClick={handleLogout}
                className="flex items-center gap-3 justify-center text-left md:text-center text-[1.1em] md:text-sm cursor-pointer transition-all duration-500 bg-red-600 text-white px-4 py-3 md:px-6 md:py-2 rounded-lg hover:bg-opacity-90 w-full md:w-auto"
              >
                <FaSignOutAlt size={22} className="md:hidden" />
                <span className="text-xs">Logout</span>
              </button> */}
            </div>
          ) : (
            button_options.map((each_value) => {
              const IconComponent = each_value.nav_icon;
              return (
                <Link href={each_value.nav_link} key={each_value.nav_name} className="w-full lg:w-auto">
                  <div 
                    onClick={() => set_show_nav(false)}
                    className="flex items-center gap-3 justify-center text-left lg:text-center text-[1.1em] lg:text-sm cursor-pointer transition-all duration-500 bg-primary_color text-white px-4 py-3 lg:px-6 lg:py-2 rounded-lg hover:bg-opacity-90 w-full lg:w-auto"
                  >
                    <IconComponent size={22} className="lg:hidden" />
                    <span className="text-xs ">{each_value.nav_name}</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Nav;

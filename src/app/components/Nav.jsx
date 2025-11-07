"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { 
  FaHome, 
  FaCogs, 
  FaSearch, 
  FaHandshake, 
  FaBuilding, 
  FaUsers, 
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

    const nav_options = [
    { nav_name: "Home", nav_icon: FaHome, nav_link: "/" },
   
    { nav_name: "All Services", nav_icon: FaCogs, nav_link: "/", sub_menu:[
      {"sub_link_name":"Virtual Tour", "sub_link_link":"/virtual-tour"  },
      {"sub_link_name":"3D Visualization", "sub_link_link":"/3d-visualization"  },
      {"sub_link_name":"Interior Design", "sub_link_link":"/interior-design"  },
      {"sub_link_name":"Smart Home Installation", "sub_link_link":"/smart-home-installation"  },
      {"sub_link_name":"Space Planning Consultation", "sub_link_link":"/space-planning-consultation"  },
    ] },  
    { nav_name: "Explore Properties", nav_icon: FaSearch, nav_link: "/exploreProperties" },
    // { nav_name: "Sell A Property", nav_icon: FaHandshake, nav_link: "/projects" },
    { nav_name: "Developers", nav_icon: FaBuilding, nav_link: "/allDevelopers" },
    { nav_name: "Agents", nav_icon: FaUsers, nav_link: "/allAgents" },
    { nav_name: "About Us", nav_icon: FaInfoCircle, nav_link: "/aboutUs" },
    { nav_name: "Contact Us", nav_icon: FaEnvelope, nav_link: "/contactUs" },


  
];


const button_options = [
  { nav_name: "Sign Up", nav_icon: FaUserPlus, nav_link: "/signup", isButton: true },
  { nav_name: "Login", nav_icon: FaSignInAlt, nav_link: "/signin", isButton: true },
];

const handleLogout = () => {
  logout();
  set_show_nav(false);
};

  return (
    <div className="fixed top-0   w-full  left-1/2 -translate-x-1/2    overflow-y z-100 backdrop-blur-md ">
      {/* Toggle button for small screens */}
      <div
        className="absolute top-4 right-4 md:hidden bg-secondary_color p-2 rounded-sm z-[200] cursor-pointer"
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
        } md:flex py-[2em] md:py-4 px-4  items-center md:justify-between md:gap-0 md:p-2 md:px-8 md:shadow-lg md:bg-white/90 md:backdrop-blur-lg w-[90%] md:w-full h-screen md:h-auto max-h-screen md:min-h-[30px] overflow-y-auto md:overflow-visible bg-white/90 shadow-xl backdrop-blur-lg`}
      >
        {/* Logo (left) */}
        <img
          src="/iska-dark.png"
          alt="Company Logo"
          className="hidden md:block max-w-[150px] md:max-w-[100px] w-[12em] md:w-[4em] md:mr-8" />
        <img
          src="/iska-dark.png"
          alt="Company Logo"
          className="block   md:hidden w-[12em] max-w-[150px] mb-8 " />

        {/* Nav items (centered on md+) */}
        <div className="flex flex-col md:flex-row gap-2 md:gap-2 h-auto items-start md:items-center justify-start md:justify-center w-full md:w-auto flex-1">
          {nav_options.map((each_value) => {
            const IconComponent = each_value.nav_icon;
            return (
              <div key={each_value.nav_name} className="relative w-full md:w-auto" onMouseEnter={()=>{each_value?.sub_menu ? set_sub_menu( each_value.nav_name) :set_sub_menu ("") }}  onMouseLeave={()=>{ set_sub_menu ("") }}  > 
                <Link href={each_value.nav_link} >
                  <div 
                    onClick={()=>{ set_show_nav(false)}}
                    className={`flex items-center gap-3 text-left md:text-center text-[1.2em] md:text-xs cursor-pointer transition-all duration-500 px-2 py-3 md:px-3 md:py-2 rounded-lg w-full md:w-auto ${
                      each_value.isButton 
                        ? "bg-primary_color text-white px-4 py-2 md:px-0 md:py-0 rounded-md hover:bg-opacity-90" 
                        : "text-primary_color md:hover:text-[1.1em] md:hover:font-semibold hover:bg-primary_color/10"
                    }`}
                  >
                    <IconComponent size={22} className="md:hidden" />
                    <span>{each_value.nav_name}</span>
                  </div>
                </Link>  

                <div className="bg-white-200 bg-[rgba(255,255,255,1)]"> 
                {each_value?.sub_menu && sub_menu === each_value.nav_name  ? <div className=" bg-white-200 bg-[rgba(255,255,255,1)] px-10 md:absolute md:shadow-xl md:rounded-sm md:top-[2em] md:w-[15em] md:h-[14em] flex flex-col justify-around items-start px-4" >
                  {each_value?.sub_menu.map((each_sublink, index)=> {
                    return <Link href={each_sublink.sub_link_link} key={index}> <p className="text-primary_color md:hover:text-[1.1em] md:hover:font-semibold transition-all duration-500 text-[1em] md:text-xs cursor-pointer">{each_sublink.sub_link_name} </p> </Link>
                  })}
                </div> : "" }
                </div>


                </div>
            );
          })}
        </div>

        {/* Buttons (right on md+) */}
        <div className="flex flex-col gap-4 w-full md:flex-row md:gap-4 md:w-auto md:ml-8 md:justify-end mt-4 md:mt-0">
          {loading ? (
            <div className="flex items-center justify-center px-4 py-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary_color"></div>
            </div>
          ) : user ? (
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              {/* Welcome message with link to appropriate dashboard */}
              {user.user_type === 'developer' ? (
                <Link href={`/developer/${user.profile?.slug || user.id}/dashboard`} className="w-full md:w-auto">
                  <div 
                    onClick={() => set_show_nav(false)}
                    className="flex items-center gap-3 justify-center text-left md:text-center text-[1.1em] md:text-sm cursor-pointer transition-all duration-500 bg-primary_color text-white px-4 py-3 md:px-6 md:py-2 rounded-lg hover:bg-opacity-90 w-full md:w-auto shadow-md hover:shadow-lg"
                  >
                    <FaUser size={22} className="md:hidden" />
                    <span className="text-xs font-medium">Welcome, {user.profile?.name || user.email}</span>
                  </div>
                </Link>
              ) : user.user_type === 'property_seeker' ? (
                <Link href={`/propertySeeker/${user.profile?.slug || user.id}/dashboard`} className="w-full md:w-auto">
                  <div 
                    onClick={() => set_show_nav(false)}
                    className="flex items-center gap-3 justify-center text-left md:text-center text-[1.1em] md:text-sm cursor-pointer transition-all duration-500 bg-primary_color text-white px-4 py-3 md:px-6 md:py-2 rounded-lg hover:bg-opacity-90 w-full md:w-auto shadow-md hover:shadow-lg"
                  >
                    <FaUser size={22} className="md:hidden" />
                    <span className="text-xs font-medium">Welcome, {user.profile?.name || user.email}</span>
                  </div>
                </Link>
              ) : user.user_type === 'agent' ? (
                <Link href={`/agents/${user.profile?.slug || user.id}/dashboard`} className="w-full md:w-auto">
                  <div 
                    onClick={() => set_show_nav(false)}
                    className="flex items-center gap-3 justify-center text-left md:text-center text-[1.1em] md:text-sm cursor-pointer transition-all duration-500 bg-primary_color text-white px-4 py-3 md:px-6 md:py-2 rounded-lg hover:bg-opacity-90 w-full md:w-auto shadow-md hover:shadow-lg"
                  >
                    <FaUser size={22} className="md:hidden" />
                    <span className="text-xs font-medium">Welcome, {user.profile?.name || user.email}</span>
                  </div>
                </Link>
              ) : (
                // Fallback for any other user types
                <div className="flex items-center gap-3 justify-center text-left md:text-center text-[1.1em] md:text-sm bg-primary_color text-white px-4 py-3 md:px-6 md:py-2 rounded-lg w-full md:w-auto">
                  <FaUser size={22} className="md:hidden" />
                  <span className="text-xs font-medium">Welcome, {user.profile?.name || user.email}</span>
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
                <Link href={each_value.nav_link} key={each_value.nav_name} className="w-full md:w-auto">
                  <div 
                    onClick={() => set_show_nav(false)}
                    className="flex items-center gap-3 justify-center text-left md:text-center text-[1.1em] md:text-sm cursor-pointer transition-all duration-500 bg-primary_color text-white px-4 py-3 md:px-6 md:py-2 rounded-lg hover:bg-opacity-90 w-full md:w-auto"
                  >
                    <IconComponent size={22} className="md:hidden" />
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

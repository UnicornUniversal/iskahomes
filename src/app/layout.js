import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Poppins } from "next/font/google";
import Layout1 from "./layout/Layout1";
import { AuthProvider } from "@/contexts/AuthContext";
import { PostHogProvider } from "./providers";
import DisableNumberInputScroll from "./components/DisableNumberInputScroll";

import Nav from "./components/Nav";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Iska Homes",
  description: "Your Dream Property Awaits You",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={` ${poppins.variable} antialiased text-primary_color`}
      >
        <PostHogProvider>
          <AuthProvider>
            <DisableNumberInputScroll />
            {/* <Nav /> */}
            {/* <Layout1> */}
              {children}
            {/* </Layout1> */}
            {/* <Footer /> */}
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}

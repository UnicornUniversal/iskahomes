import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Poppins, Playfair_Display } from "next/font/google";
import { Suspense } from "react";

import { AuthProvider } from "@/contexts/AuthContext";
import { PostHogProvider } from "./providers";
import DisableNumberInputScroll from "./components/DisableNumberInputScroll";
import ToastProvider from "./components/ToastProvider";
import AuthHashRedirect from "./components/AuthHashRedirect";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair_display = Playfair_Display({
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair-display",
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
  icons: {
    icon: "/ISKA Logo.png",
    shortcut: "/ISKA Logo.png",
    apple: "/ISKA Logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={` ${poppins.variable} ${playfair_display.variable} antialiased text-primary_color`}
      >
        <PostHogProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <AuthHashRedirect />
            </Suspense>
            <DisableNumberInputScroll />
            <ToastProvider />
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

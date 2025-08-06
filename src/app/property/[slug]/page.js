import React from 'react'
import properties from '../../components/Data/Data'
import { notFound } from 'next/navigation'
import Layout1 from '@/app/layout/Layout1'
import ScheduleATour from '@/app/components/ScheduleATour'
import { FiMapPin, FiHome, FiGrid, FiRuler, FiCheckCircle } from 'react-icons/fi'
import { BsHouseDoor, BsCupHot, BsDroplet, BsStarFill } from 'react-icons/bs'
import SideBanner from '@/app/components/Ads/SideBanner'
const Page = async ({ params }) => {
  const { slug } = await params;
  const property = properties.find(p => p.slug === slug);

  if (!property) {
    notFound();
  }

  // Example agent info (replace with real data if available)
  const agent = {
    name: 'Andy Leboru Schimtz',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    phone: '+233 24 789 32 07',
    email: 'andy.agent@email.com',
  };

  return (

      
 <>
       <div className="bg-white    flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h1 className="font-bold text-primary_color mb-1">{property.propertyName}</h1>
                <span className="text-2xl font-bold text-primary_color block mb-1">Gh {property.price.toLocaleString()}</span>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <span>{property.categorization.purpose}</span>
                  <span>•</span>
                  <span>8 hours ago</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex gap-2 mt-2">
                  <button className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"><FiHome /></button>
                  <button className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"><FiMapPin /></button>
                  <button className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"><FiGrid /></button>
                </div>
              </div>
            </div>
            {/* Gallery - full width grid */}
            <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {property.projectImages && property.projectImages.map((img, idx) => (
                <div key={idx} className="aspect-[4/3] w-full overflow-hidden rounded-lg">
                  <img src={img} alt={property.propertyName + ' image'} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            {/* Features */}
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded"><BsHouseDoor /> Bedroom: {property.details.bedrooms}</div>
              <div className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded"><BsDroplet /> Bathroom: {property.details.washrooms}</div>
              <div className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded"><FiHome /> Type: {property.categorization.type}</div>
              {property.details.areaSqFt && <div className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded"><FiRuler /> SqFt: {property.details.areaSqFt}</div>}
              {property.details.condition && <div className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded"><FiCheckCircle /> Condition: {property.details.condition}</div>}
              {property.details.furnished && <div className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded"><BsCupHot /> Furnished</div>}
            </div>
            {/* Virtual Tour/3D */}
            <div className="flex gap-4 mt-4">
              <button className="bg-primary_color text-white px-4 py-2 rounded font-medium">View Virtual Tour</button>
              <button className="bg-white border border-primary_color text-primary_color px-4 py-2 rounded font-medium">View 3D</button>
            </div>
          </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-8">
         

          {/* Description & Details */}
          <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-primary_color">Property Description</h3>
            <p className="text-gray-700">{property.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <h4 className="font-semibold mb-2">Property Details</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><b>Property ID:</b> RT48</li>
                  <li><b>Price:</b> Gh {property.price.toLocaleString()}</li>
                  <li><b>Property Size:</b> {property.details.areaSqFt || 'N/A'}</li>
                  <li><b>Bathrooms:</b> {property.details.washrooms}</li>
                  <li><b>Bedrooms:</b> {property.details.bedrooms}</li>
                  <li><b>Property Type:</b> {property.categorization.type}</li>
                  <li><b>Condition:</b> {property.details.condition || 'N/A'}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Garage</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><b>Garage:</b> {property.details.garage ? 'Yes' : 'No'}</li>
                  <li><b>Garage Size:</b> {property.details.garageSize || 'N/A'}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Address & Map */}
          <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-primary_color">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="mb-2"><b>Address:</b> {property.address.city}, {property.address.state}</div>
                <div className="mb-2"><b>Country:</b> {property.address.country}</div>
                <div className="mb-2"><b>Additional Info:</b> Lorem ipsum is simply dummy text of the printing and typesetting industry.</div>
              </div>
              <div>
                {/* Map Placeholder */}
                <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center text-gray-500">Map Placeholder</div>
              </div>
            </div>
          </div>

          {/* Features and Amenities */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-primary_color mb-2">Features and Amenities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {property.amenities && property.amenities.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-orange-500">•</span> {a}
                </div>
              ))}
            </div>
          </div>

          {/* Video */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-primary_color mb-2">Video</h3>
            <div className="w-full aspect-video bg-gray-200 rounded flex items-center justify-center">
              {/* Video Placeholder */}
              <video controls className="w-full h-full rounded">
                <source src={property.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-primary_color mb-4">Reviews</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {property.reviews && property.reviews.map((review, idx) => (
                <div key={idx} className="bg-gray-50 rounded p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <img src={agent.image} alt={review.user} className="w-10 h-10 rounded-full" />
                    <div>
                      <div className="font-semibold">{review.user}</div>
                      <div className="flex gap-1 text-orange-400">
                        {[...Array(review.rating)].map((_, i) => <BsStarFill key={i} />)}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">{review.comment}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-8">
          {/* Schedule a Tour */}
          <ScheduleATour />
          {/* Agent Info */}
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <img src={agent.image} alt={agent.name} className="w-16 h-16 rounded-full mb-2" />
            <div className="font-semibold">{agent.name}</div>
            <div className="text-sm text-gray-500 mb-2">Agent</div>
            <div className="text-sm"><b>Phone:</b> {agent.phone}</div>
            <div className="text-sm"><b>Email:</b> {agent.email}</div>
            <button className="mt-3 px-4 py-2 bg-primary_color text-white rounded">View Listings</button>
          </div>
          <SideBanner></SideBanner>
        </div>
      </div>

      </>


  )
}

export default Page

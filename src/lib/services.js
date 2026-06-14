import { Box, Camera, Home, Palette, Ruler } from 'lucide-react'

export const ISKA_SERVICES = [
  {
    id: 'virtual-tour',
    name: 'Virtual Tour',
    shortDescription: 'Immersive 360° virtual tours for remote property viewing.',
    description:
      'Experience properties from anywhere with our immersive 360° virtual tours. Perfect for remote viewing and showcasing properties to international clients.',
    image:
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0',
    icon: Camera,
    features: [
      '360° panoramic views',
      'Interactive property exploration',
      'HD quality imaging',
      'Mobile-friendly experience',
      'Shareable tour links'
    ]
  },
  {
    id: '3d-visualization',
    name: '3D Visualization',
    shortDescription: 'Photorealistic 3D renders and architectural visualizations.',
    description:
      'Bring your property visions to life with stunning 3D renderings and architectural visualizations. Perfect for pre-construction marketing and design presentations.',
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0',
    icon: Box,
    features: [
      'Photorealistic 3D renders',
      'Interior and exterior visualization',
      'Multiple design options',
      'Virtual staging capabilities',
      'Animation and walkthroughs'
    ]
  },
  {
    id: 'interior-design',
    name: 'Interior Design',
    shortDescription: 'Professional interior design from concept to completion.',
    description:
      'Transform your spaces with professional interior design services. From concept to completion, we create beautiful, functional living environments.',
    image:
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0',
    icon: Palette,
    features: [
      'Custom design concepts',
      'Color scheme selection',
      'Furniture and decor sourcing',
      'Space optimization',
      'Style consultation'
    ]
  },
  {
    id: 'smart-home-installation',
    name: 'Smart Home Installation',
    shortDescription: 'Smart lighting, security, and climate control installation.',
    description:
      'Upgrade your property with cutting-edge smart home technology. Control lighting, security, climate, and more from your smartphone.',
    image:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0',
    icon: Home,
    features: [
      'Smart lighting systems',
      'Home security integration',
      'Climate control automation',
      'Voice assistant compatibility',
      'Professional installation'
    ]
  },
  {
    id: 'space-planning-consultation',
    name: 'Space Planning Consultation',
    shortDescription: 'Expert layout planning to maximize your property potential.',
    description:
      "Maximize your property's potential with expert space planning. Optimize layouts for functionality, flow, and aesthetic appeal.",
    image:
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0',
    icon: Ruler,
    features: [
      'Layout optimization',
      'Furniture placement',
      'Traffic flow analysis',
      'Storage solutions',
      'Multi-purpose space design'
    ]
  }
]

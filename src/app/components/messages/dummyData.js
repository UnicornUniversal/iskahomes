export const dummyChats = [
  {
    id: 1,
    name: "Sarah Johnson",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    lastMessage: "Thanks for the property details!",
    timestamp: "2:30 PM",
    unreadCount: 2,
    isOnline: true
  },
  {
    id: 2,
    name: "Michael Chen",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    lastMessage: "When can we schedule a viewing?",
    timestamp: "1:45 PM",
    unreadCount: 0,
    isOnline: false
  },
  {
    id: 3,
    name: "Emma Rodriguez",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    lastMessage: "The apartment looks perfect!",
    timestamp: "11:20 AM",
    unreadCount: 1,
    isOnline: true
  },
  {
    id: 4,
    name: "David Thompson",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    lastMessage: "Do you have any 2-bedroom units available?",
    timestamp: "Yesterday",
    unreadCount: 0,
    isOnline: false
  },
  {
    id: 5,
    name: "Lisa Wang",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    lastMessage: "I'm interested in the penthouse suite",
    timestamp: "Yesterday",
    unreadCount: 3,
    isOnline: true
  },
  {
    id: 6,
    name: "James Wilson",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    lastMessage: "What are the parking options?",
    timestamp: "2 days ago",
    unreadCount: 0,
    isOnline: false
  }
];

export const dummyConversations = {
  1: [
    {
      id: 1,
      senderId: 1,
      message: "Hi! I'm interested in the 3-bedroom apartment you have listed.",
      timestamp: "10:30 AM",
      isRead: true
    },
    {
      id: 2,
      senderId: "me",
      message: "Hello Sarah! Thanks for your interest. The 3-bedroom apartment is still available. Would you like to know more details?",
      timestamp: "10:32 AM",
      isRead: true
    },
    {
      id: 3,
      senderId: 1,
      message: "Yes, please! What's the monthly rent and what utilities are included?",
      timestamp: "10:35 AM",
      isRead: true
    },
    {
      id: 4,
      senderId: "me",
      message: "The monthly rent is $2,800. It includes water, trash, and basic internet. Electricity and gas are separate. The apartment comes with in-unit laundry and a parking spot.",
      timestamp: "10:37 AM",
      isRead: true
    },
    {
      id: 5,
      senderId: 1,
      message: "That sounds great! Can you send me some more photos of the kitchen and bathroom?",
      timestamp: "10:40 AM",
      isRead: true
    },
    {
      id: 6,
      senderId: "me",
      message: "Absolutely! I'll send you additional photos right away. The kitchen was recently renovated with granite countertops and stainless steel appliances.",
      timestamp: "10:42 AM",
      isRead: true
    },
    {
      id: 7,
      senderId: 1,
      message: "Thanks for the property details!",
      timestamp: "2:30 PM",
      isRead: false
    }
  ],
  2: [
    {
      id: 1,
      senderId: 2,
      message: "Hello! I saw your listing for the 2-bedroom apartment. Is it still available?",
      timestamp: "9:15 AM",
      isRead: true
    },
    {
      id: 2,
      senderId: "me",
      message: "Hi Michael! Yes, the 2-bedroom apartment is still available. Are you looking to move in soon?",
      timestamp: "9:20 AM",
      isRead: true
    },
    {
      id: 3,
      senderId: 2,
      message: "Yes, I'm looking to move in next month. When can we schedule a viewing?",
      timestamp: "1:45 PM",
      isRead: true
    }
  ],
  3: [
    {
      id: 1,
      senderId: 3,
      message: "Hi there! I'm Emma and I'm very interested in your studio apartment.",
      timestamp: "8:30 AM",
      isRead: true
    },
    {
      id: 2,
      senderId: "me",
      message: "Hello Emma! Great to hear from you. The studio apartment is perfect for singles or couples. What questions do you have?",
      timestamp: "8:35 AM",
      isRead: true
    },
    {
      id: 3,
      senderId: 3,
      message: "I love the location and the price is perfect for my budget. Can you tell me about the neighborhood?",
      timestamp: "8:40 AM",
      isRead: true
    },
    {
      id: 4,
      senderId: "me",
      message: "The neighborhood is very safe and family-friendly. There are great restaurants, coffee shops, and a grocery store within walking distance. The subway is also just 2 blocks away.",
      timestamp: "8:45 AM",
      isRead: true
    },
    {
      id: 5,
      senderId: 3,
      message: "The apartment looks perfect!",
      timestamp: "11:20 AM",
      isRead: false
    }
  ],
  4: [
    {
      id: 1,
      senderId: 4,
      message: "Good morning! I'm looking for a 2-bedroom apartment. Do you have any available?",
      timestamp: "Yesterday 10:00 AM",
      isRead: true
    },
    {
      id: 2,
      senderId: "me",
      message: "Good morning David! Yes, we have a beautiful 2-bedroom apartment available. It's on the 3rd floor with great natural light.",
      timestamp: "Yesterday 10:05 AM",
      isRead: true
    },
    {
      id: 3,
      senderId: 4,
      message: "That sounds promising. What's the rent and when is it available?",
      timestamp: "Yesterday 10:10 AM",
      isRead: true
    },
    {
      id: 4,
      senderId: "me",
      message: "The rent is $2,200/month and it's available immediately. It includes one parking spot and access to the building's gym.",
      timestamp: "Yesterday 10:15 AM",
      isRead: true
    },
    {
      id: 5,
      senderId: 4,
      message: "Do you have any 2-bedroom units available?",
      timestamp: "Yesterday 3:00 PM",
      isRead: true
    }
  ],
  5: [
    {
      id: 1,
      senderId: 5,
      message: "Hello! I'm interested in the penthouse suite you have listed. It looks absolutely stunning!",
      timestamp: "Yesterday 2:00 PM",
      isRead: true
    },
    {
      id: 2,
      senderId: "me",
      message: "Hi Lisa! Thank you for your interest. The penthouse suite is truly spectacular with panoramic city views. Would you like to schedule a private viewing?",
      timestamp: "Yesterday 2:05 PM",
      isRead: true
    },
    {
      id: 3,
      senderId: 5,
      message: "Yes, I'd love to see it in person! What's the best time for you this week?",
      timestamp: "Yesterday 2:10 PM",
      isRead: true
    },
    {
      id: 4,
      senderId: "me",
      message: "I'm available Tuesday and Thursday afternoons, or Saturday morning. What works best for you?",
      timestamp: "Yesterday 2:15 PM",
      isRead: true
    },
    {
      id: 5,
      senderId: 5,
      message: "I'm interested in the penthouse suite",
      timestamp: "Yesterday 4:30 PM",
      isRead: false
    }
  ],
  6: [
    {
      id: 1,
      senderId: 6,
      message: "Hi! I'm James and I'm interested in your 1-bedroom apartment. I have a question about parking.",
      timestamp: "2 days ago 11:00 AM",
      isRead: true
    },
    {
      id: 2,
      senderId: "me",
      message: "Hello James! I'd be happy to help with any parking questions. What would you like to know?",
      timestamp: "2 days ago 11:05 AM",
      isRead: true
    },
    {
      id: 3,
      senderId: 6,
      message: "What are the parking options?",
      timestamp: "2 days ago 11:10 AM",
      isRead: true
    }
  ]
}; 
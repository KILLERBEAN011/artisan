export const categories = [
  {
    title: "Plumbing",
    description: "Leaks, installations & repairs",
    href: "/search?category=plumbing",
  },
  {
    title: "Electrical",
    description: "Wiring, fixtures & troubleshooting",
    href: "/search?category=electrical",
  },
  {
    title: "Carpentry",
    description: "Custom furniture & repairs",
    href: "/search?category=carpentry",
  },
  {
    title: "Painting",
    description: "Interior & exterior finishes",
    href: "/search?category=painting",
  },
  {
    title: "Appliances",
    description: "Repairs & installations",
    href: "/search?category=appliances",
  },
  {
    title: "General Handyman",
    description: "Small jobs & odd tasks",
    href: "/search?category=handyman",
  },
] as const;

export const testimonials = [
  {
    name: "Amina Okafor",
    location: "Lagos",
    quote:
      "Quick, professional and fair pricing. The electrician fixed our fault within an hour.",
    rating: 5,
  },
  {
    name: "Chinedu Eze",
    location: "Abuja",
    quote:
      "Great communication and clear pricing. I'll use NaijaCraft again for office repairs.",
    rating: 5,
  },
  {
    name: "Kemi Abiola",
    location: "Port Harcourt",
    quote:
      "Fantastic handyman — punctual and skilled. In-app chat made coordination easy.",
    rating: 5,
  },
] as const;

export const faqs = [
  {
    question: "How do payments work?",
    answer:
      "We hold funds in escrow until the job is marked complete, protecting both customers and artisans.",
  },
  {
    question: "Are artisans verified?",
    answer:
      "Yes — ID checks, portfolio reviews and community ratings help maintain quality across the platform.",
  },
  {
    question: "What if I'm not satisfied?",
    answer:
      "Our guarantees cover remedy and refunds for eligible disputes, reviewed case by case.",
  },
] as const;

export const trustFeatures = [
  {
    title: "Screened Artisans",
    description: "All professionals verified with ID and portfolio checks.",
  },
  {
    title: "Insurance & Guarantees",
    description:
      "Job protection and satisfaction guarantees for every booking.",
  },
  {
    title: "Secure Chat & Payments",
    description:
      "In-app messaging and escrow-style payments keep work on track.",
  },
] as const;

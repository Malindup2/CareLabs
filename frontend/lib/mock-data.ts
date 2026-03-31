export interface IReview {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ITimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
}

export interface IAvailableDay {
  date: string; // e.g. "2026-04-01"
  dayName: string; // e.g. "Monday"
  slots: ITimeSlot[];
}

export interface IDoctorProfile {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  bio: string;
  experienceYears: number;
  education: string[];
  reviews: IReview[];
  availability: IAvailableDay[];
  consultationFee: number;
  featured?: boolean;
}

// Generate some high-quality mock data focusing on the Sri Lankan context requested earlier.
export const MOCK_DOCTORS: IDoctorProfile[] = [
  {
    id: "doc-001",
    name: "Dr. Anil Perera",
    specialty: "Cardiology",
    hospital: "Asiri Surgical Hospital, Colombo",
    rating: 4.9,
    reviewCount: 128,
    imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300",
    bio: "Dr. Anil Perera is a senior Consultant Cardiologist with over 15 years of experience in diagnosing and treating cardiovascular diseases. He specializes in interventional cardiology and preventive heart care, dedicated to providing compassionate, patient-centered treatment.",
    experienceYears: 18,
    education: [
      "MBBS - University of Colombo",
      "MD (Medicine) - PGIM, Sri Lanka",
      "MRCP - UK",
      "Fellowship in Interventional Cardiology - Australia"
    ],
    consultationFee: 3500,
    featured: true,
    reviews: [
      { id: "r1", patientName: "Ashan K.", rating: 5, comment: "Incredibly attentive. Explained my ECG results clearly and put my mind at ease.", date: "2026-03-15" },
      { id: "r2", patientName: "Dilini S.", rating: 5, comment: "Highly professional and methodical. The video consultation felt just like being in the clinic.", date: "2026-03-10" },
      { id: "r3", patientName: "Nuwan M.", rating: 4, comment: "Great doctor, though slightly delayed in starting the session. Very thorough.", date: "2026-02-28" }
    ],
    availability: [
      {
        date: "2026-04-01", dayName: "Today", 
        slots: [
          { id: "s1", time: "09:00 AM", isAvailable: false },
          { id: "s2", time: "09:30 AM", isAvailable: true },
          { id: "s3", time: "10:00 AM", isAvailable: true },
          { id: "s4", time: "10:30 AM", isAvailable: true }
        ]
      },
      {
        date: "2026-04-02", dayName: "Tomorrow",
        slots: [
          { id: "s5", time: "04:00 PM", isAvailable: true },
          { id: "s6", time: "04:30 PM", isAvailable: false },
          { id: "s7", time: "05:00 PM", isAvailable: true }
        ]
      }
    ]
  },
  {
    id: "doc-002",
    name: "Dr. Nimali Fernando",
    specialty: "Neurology",
    hospital: "Lanka Hospitals, Colombo",
    rating: 4.8,
    reviewCount: 94,
    imageUrl: "https://images.unsplash.com/photo-1594824436998-05220c355ed3?auto=format&fit=crop&q=80&w=300&h=300",
    bio: "Dr. Nimali Fernando specializes in neurological disorders, including migraines, epilepsy, and stroke management. She is known for her meticulous diagnostic approach and comprehensive care plans tailored to individual patient needs.",
    experienceYears: 12,
    education: [
      "MBBS - University of Peradeniya",
      "MD (Neurology) - PGIM, Sri Lanka"
    ],
    consultationFee: 3000,
    featured: true,
    reviews: [
      { id: "r4", patientName: "Saman Gunasekara", rating: 5, comment: "Helped me manage my chronic migraines perfectly. She listens.", date: "2026-03-20" },
      { id: "r5", patientName: "Kavindi R.", rating: 5, comment: "Excellent service. Very clear instructions.", date: "2026-03-12" }
    ],
    availability: [
      {
        date: "2026-04-01", dayName: "Today",
        slots: [
          { id: "s8", time: "05:30 PM", isAvailable: true },
          { id: "s9", time: "06:00 PM", isAvailable: true }
        ]
      }
    ]
  },
  {
    id: "doc-003",
    name: "Dr. Harsha De Silva",
    specialty: "General Physician",
    hospital: "Nawaloka Hospital, Colombo",
    rating: 4.7,
    reviewCount: 205,
    imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300&h=300",
    bio: "An experienced General Physician handling a wide spectrum of adult diseases. Dr. De Silva focuses on holistic preventative care, chronic disease management like Diabetes and Hypertension, and accurate initial diagnosis.",
    experienceYears: 22,
    education: [
      "MBBS - University of Kelaniya",
      "MD (Medicine) - PGIM, Sri Lanka"
    ],
    consultationFee: 2500,
    featured: false,
    reviews: [
      { id: "r6", patientName: "Priyanka T.", rating: 4, comment: "Very practical advice for diabetes management.", date: "2026-03-01" }
    ],
    availability: [
      {
        date: "2026-04-02", dayName: "Tomorrow",
        slots: [
           { id: "s10", time: "08:00 AM", isAvailable: true },
           { id: "s11", time: "08:15 AM", isAvailable: true },
           { id: "s12", time: "08:30 AM", isAvailable: false }
        ]
      }
    ]
  },
  {
    id: "doc-004",
    name: "Dr. Chamari Wijesinghe",
    specialty: "Dermatology",
    hospital: "Hemas Hospital, Wattala",
    rating: 4.9,
    reviewCount: 160,
    imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300",
    bio: "Consultant Dermatologist providing comprehensive care for all skin, hair, and nail conditions. Dr. Wijesinghe utilizes the latest dermatological techniques for both clinical and aesthetic dermatology.",
    experienceYears: 10,
    education: [
      "MBBS - University of Sri Jayewardenepura",
      "MD (Dermatology) - PGIM, Sri Lanka",
      "Member of the Sri Lanka College of Dermatologists"
    ],
    consultationFee: 3000,
    featured: false,
    reviews: [
       { id: "r7", patientName: "Taniya M.", rating: 5, comment: "Cleared my severe acne within 3 months. Highly recommend her tele-consults.", date: "2026-03-25" }
    ],
    availability: [
      {
         date: "2026-04-01", dayName: "Today",
         slots: [
            { id: "s13", time: "02:00 PM", isAvailable: true },
            { id: "s14", time: "02:30 PM", isAvailable: true }
         ]
      }
    ]
  }
];

export const SPECIALTIES = [
  "All Specialties",
  "Cardiology",
  "Neurology",
  "General Physician",
  "Dermatology",
  "Pediatrics",
  "Orthopedics",
  "Psychiatry",
  "Gynecology"
];

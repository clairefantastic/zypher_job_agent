import 'https://deno.land/std@0.224.0/dotenv/load.ts';
import { storeQuestions } from './rag-advanced.ts';  

const interviewDatabase = {
  "Google": {
    "Software Engineer": [
      { question: "Tell me about a time you solved a complex technical problem with limited resources", category: "behavioral" },
      { question: "How do you handle disagreement with teammates about technical decisions?", category: "behavioral" },
      { question: "Design a system to handle 1 million requests per second", category: "system-design" },
      { question: "Explain how you would optimize a slow database query", category: "technical" },
      { question: "Walk me through your debugging process", category: "technical" },
      { question: "How do you stay updated with new technologies?", category: "general" },
      { question: "Describe a time you had to learn a new technology quickly", category: "behavioral" },
      { question: "How would you design YouTube?", category: "system-design" },
      { question: "What's your approach to code reviews?", category: "collaboration" },
      { question: "Tell me about a time you improved team productivity", category: "behavioral" }
    ],
    "Product Manager": [
      { question: "How do you prioritize features when everything is urgent?", category: "product" },
      { question: "Walk me through launching a product from idea to release", category: "product" },
      { question: "How do you handle conflicting stakeholder requirements?", category: "behavioral" },
      { question: "Design a feature for Google Maps for elderly users", category: "product-design" },
      { question: "How do you measure product success?", category: "metrics" }
    ]
  },
  "Meta": {
    "Software Engineer": [
      { question: "Tell me about your most impactful project", category: "behavioral" },
      { question: "How do you handle tight deadlines?", category: "behavioral" },
      { question: "Design Instagram's feed ranking algorithm", category: "system-design" },
      { question: "How would you detect fake accounts at scale?", category: "technical" },
      { question: "Explain a time you disagreed with your manager", category: "behavioral" },
      { question: "How do you approach performance optimization?", category: "technical" },
      { question: "Design a rate limiter", category: "system-design" },
      { question: "Tell me about a time you failed and what you learned", category: "behavioral" }
    ]
  },
  "Amazon": {
    "Software Engineer": [
      { question: "Tell me about a time you dealt with a difficult customer (external or internal)", category: "leadership" },
      { question: "Describe a time you had to make a decision with incomplete information", category: "leadership" },
      { question: "How do you handle conflicting priorities?", category: "behavioral" },
      { question: "Design an e-commerce recommendation system", category: "system-design" },
      { question: "Tell me about a time you went above and beyond", category: "leadership" },
      { question: "How would you reduce latency in a distributed system?", category: "technical" }
    ]
  },
  "Startup": {
    "Full Stack Engineer": [
      { question: "How do you decide between building vs buying a solution?", category: "technical" },
      { question: "Tell me about a time you wore multiple hats", category: "behavioral" },
      { question: "How do you handle ambiguity in requirements?", category: "behavioral" },
      { question: "Design an MVP for a [specific product]", category: "product" },
      { question: "How do you balance speed vs quality?", category: "judgment" },
      { question: "What's your experience with our tech stack?", category: "technical" }
    ]
  },
  "Microsoft": {
    "Software Engineer": [
      { question: "Tell me about a time you improved an existing system", category: "behavioral" },
      { question: "How do you ensure code quality in a large codebase?", category: "technical" },
      { question: "Design a cloud storage system like OneDrive", category: "system-design" },
      { question: "How do you approach legacy code?", category: "technical" },
      { question: "Tell me about a time you mentored someone", category: "leadership" }
    ]
  }
};

// Seed the database
async function seedDatabase() {
  console.log("Seeding interview questions database...\n");
  
  let totalQuestions = 0;
  
  for (const [company, roles] of Object.entries(interviewDatabase)) {
    for (const [role, questions] of Object.entries(roles)) {
      await storeQuestions(company, role, questions);
      totalQuestions += questions.length;
    }
  }
  
  console.log(`\nSeeding complete! Added ${totalQuestions} questions across ${Object.keys(interviewDatabase).length} companies`);
}

// Run if executed directly
if (import.meta.main) {
  await seedDatabase();
}
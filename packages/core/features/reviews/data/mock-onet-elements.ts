/**
 * Mock O*NET Elements for Reviews UI Development
 * Based on O*NET 30.0 Database structure
 */

export interface OnetElement {
  id: string;
  type: "ability" | "skill" | "work_value" | "work_activity";
  name: string;
  description: string;
  category: string;
}

export interface OnetElementRating {
  elementId: string;
  elementType: OnetElement["type"];
  rating: number; // 1-5
  isStrength: boolean;
  notes?: string;
}

export interface ReviewCategory {
  id: string;
  name: string;
  description: string;
  elements: OnetElement[];
}

// Mock O*NET Elements organized by review category
export const MOCK_ONET_ELEMENTS: Record<string, OnetElement> = {
  // Communication & Teamwork
  "2.A.1.a": {
    id: "2.A.1.a",
    type: "skill",
    name: "Active Listening",
    description:
      "Giving full attention to what other people are saying, taking time to understand the points being made, asking questions as appropriate, and not interrupting at inappropriate times.",
    category: "communication_teamwork",
  },
  "2.A.1.b": {
    id: "2.A.1.b",
    type: "skill",
    name: "Speaking",
    description: "Talking to others to convey information effectively.",
    category: "communication_teamwork",
  },
  "1.A.1.a.4": {
    id: "1.A.1.a.4",
    type: "ability",
    name: "Written Expression",
    description:
      "The ability to communicate information and ideas in writing so others will understand.",
    category: "communication_teamwork",
  },
  "2.B.1.a": {
    id: "2.B.1.a",
    type: "skill",
    name: "Social Perceptiveness",
    description:
      "Being aware of others' reactions and understanding why they react as they do.",
    category: "communication_teamwork",
  },
  "2.B.1.b": {
    id: "2.B.1.b",
    type: "skill",
    name: "Coordination",
    description: "Adjusting actions in relation to others' actions.",
    category: "communication_teamwork",
  },
  "2.B.1.e": {
    id: "2.B.1.e",
    type: "skill",
    name: "Instructing",
    description: "Teaching others how to do something.",
    category: "communication_teamwork",
  },

  // Work Ethic & Reliability
  "1.B.2.a.1": {
    id: "1.B.2.a.1",
    type: "work_value",
    name: "Dependability",
    description:
      "Being reliable, responsible, and dependable in fulfilling obligations.",
    category: "work_ethic_reliability",
  },
  "1.A.1.b.5": {
    id: "1.A.1.b.5",
    type: "ability",
    name: "Selective Attention",
    description:
      "The ability to concentrate on a task over a period of time without being distracted.",
    category: "work_ethic_reliability",
  },
  "1.A.4.a.1": {
    id: "1.A.4.a.1",
    type: "ability",
    name: "Stress Tolerance",
    description:
      "The ability to accept criticism and deal calmly and effectively with high stress situations.",
    category: "work_ethic_reliability",
  },
  "1.A.4.a.2": {
    id: "1.A.4.a.2",
    type: "ability",
    name: "Self Control",
    description:
      "The ability to maintain composure, keep emotions in check, control anger, and avoid aggressive behavior.",
    category: "work_ethic_reliability",
  },
  "1.B.2.a.2": {
    id: "1.B.2.a.2",
    type: "work_value",
    name: "Initiative",
    description: "Willingness to take on responsibilities and challenges.",
    category: "work_ethic_reliability",
  },
  "2.C.1.a": {
    id: "2.C.1.a",
    type: "skill",
    name: "Time Management",
    description: "Managing one's own time and the time of others.",
    category: "work_ethic_reliability",
  },

  // Problem Solving & Adaptability
  "1.A.1.a.3": {
    id: "1.A.1.a.3",
    type: "ability",
    name: "Problem Sensitivity",
    description:
      "The ability to tell when something is wrong or is likely to go wrong.",
    category: "problem_solving_adaptability",
  },
  "1.A.1.b.1": {
    id: "1.A.1.b.1",
    type: "ability",
    name: "Deductive Reasoning",
    description:
      "The ability to apply general rules to specific problems to produce answers that make sense.",
    category: "problem_solving_adaptability",
  },
  "2.A.3.a": {
    id: "2.A.3.a",
    type: "skill",
    name: "Critical Thinking",
    description:
      "Using logic and reasoning to identify the strengths and weaknesses of alternative solutions, conclusions or approaches to problems.",
    category: "problem_solving_adaptability",
  },
  "2.A.3.b": {
    id: "2.A.3.b",
    type: "skill",
    name: "Complex Problem Solving",
    description:
      "Identifying complex problems and reviewing related information to develop and evaluate options and implement solutions.",
    category: "problem_solving_adaptability",
  },
  "1.A.4.a.3": {
    id: "1.A.4.a.3",
    type: "ability",
    name: "Adaptability/Flexibility",
    description:
      "The ability to change what one is doing in response to the situation.",
    category: "problem_solving_adaptability",
  },
  "1.A.1.a.2": {
    id: "1.A.1.a.2",
    type: "ability",
    name: "Learning Ability",
    description:
      "The ability to combine pieces of information to form general rules or conclusions.",
    category: "problem_solving_adaptability",
  },

  // Professionalism & Safety
  "4.C.2.d.1.i": {
    id: "4.C.2.d.1.i",
    type: "work_activity",
    name: "Safety Consciousness",
    description:
      "Being careful about safety and security; following rules and procedures.",
    category: "professionalism_safety",
  },
  "1.B.2.a": {
    id: "1.B.2.a",
    type: "work_value",
    name: "Achievement",
    description:
      "Occupations that satisfy this work value are results oriented and allow employees to use their strongest abilities.",
    category: "professionalism_safety",
  },
  "1.B.2.d.1": {
    id: "1.B.2.d.1",
    type: "work_value",
    name: "Integrity",
    description: "Being honest and ethical.",
    category: "professionalism_safety",
  },
  "1.B.2.a.3": {
    id: "1.B.2.a.3",
    type: "work_value",
    name: "Quality Focus",
    description:
      "Workers on this job do their work alone with little or no supervision.",
    category: "professionalism_safety",
  },
  "1.B.2.d.2": {
    id: "1.B.2.d.2",
    type: "work_value",
    name: "Respect for Others",
    description:
      "Being sensitive to others' needs and feelings and being understanding and helpful.",
    category: "professionalism_safety",
  },
  "1.B.2.b": {
    id: "1.B.2.b",
    type: "work_value",
    name: "Independence",
    description:
      "Occupations that satisfy this work value allow employees to work on their own and make decisions.",
    category: "professionalism_safety",
  },
};

// Curated review categories with their O*NET elements
export const REVIEW_CATEGORIES: ReviewCategory[] = [
  {
    id: "communication_teamwork",
    name: "Communication & Teamwork",
    description: "How well does this person communicate and work with others?",
    elements: [
      MOCK_ONET_ELEMENTS["2.A.1.a"],
      MOCK_ONET_ELEMENTS["2.A.1.b"],
      MOCK_ONET_ELEMENTS["1.A.1.a.4"],
      MOCK_ONET_ELEMENTS["2.B.1.a"],
      MOCK_ONET_ELEMENTS["2.B.1.b"],
      MOCK_ONET_ELEMENTS["2.B.1.e"],
    ],
  },
  {
    id: "work_ethic_reliability",
    name: "Work Ethic & Reliability",
    description: "How dependable and focused is this person?",
    elements: [
      MOCK_ONET_ELEMENTS["1.B.2.a.1"],
      MOCK_ONET_ELEMENTS["1.A.1.b.5"],
      MOCK_ONET_ELEMENTS["1.A.4.a.1"],
      MOCK_ONET_ELEMENTS["1.A.4.a.2"],
      MOCK_ONET_ELEMENTS["1.B.2.a.2"],
      MOCK_ONET_ELEMENTS["2.C.1.a"],
    ],
  },
  {
    id: "problem_solving_adaptability",
    name: "Problem Solving & Adaptability",
    description:
      "How well does this person think critically and adapt to change?",
    elements: [
      MOCK_ONET_ELEMENTS["1.A.1.a.3"],
      MOCK_ONET_ELEMENTS["1.A.1.b.1"],
      MOCK_ONET_ELEMENTS["2.A.3.a"],
      MOCK_ONET_ELEMENTS["2.A.3.b"],
      MOCK_ONET_ELEMENTS["1.A.4.a.3"],
      MOCK_ONET_ELEMENTS["1.A.1.a.2"],
    ],
  },
  {
    id: "professionalism_safety",
    name: "Professionalism & Safety",
    description: "How professional and safety-conscious is this person?",
    elements: [
      MOCK_ONET_ELEMENTS["4.C.2.d.1.i"],
      MOCK_ONET_ELEMENTS["1.B.2.a"],
      MOCK_ONET_ELEMENTS["1.B.2.d.1"],
      MOCK_ONET_ELEMENTS["1.B.2.a.3"],
      MOCK_ONET_ELEMENTS["1.B.2.d.2"],
      MOCK_ONET_ELEMENTS["1.B.2.b"],
    ],
  },
];

// Helper to get element by ID
export function getOnetElement(elementId: string): OnetElement | undefined {
  return MOCK_ONET_ELEMENTS[elementId];
}

// Helper to get category by ID
export function getReviewCategory(
  categoryId: string,
): ReviewCategory | undefined {
  return REVIEW_CATEGORIES.find((cat) => cat.id === categoryId);
}

// Mock review data for testing
export const MOCK_REVIEW_DATA: OnetElementRating[] = [
  { elementId: "2.A.1.a", elementType: "skill", rating: 5, isStrength: true },
  {
    elementId: "1.A.1.b.5",
    elementType: "ability",
    rating: 4,
    isStrength: true,
  },
  { elementId: "2.A.3.a", elementType: "skill", rating: 3, isStrength: false },
  {
    elementId: "1.B.2.a.1",
    elementType: "work_value",
    rating: 5,
    isStrength: true,
  },
  {
    elementId: "1.A.4.a.1",
    elementType: "ability",
    rating: 4,
    isStrength: true,
  },
];

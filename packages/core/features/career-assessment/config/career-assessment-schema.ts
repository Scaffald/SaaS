import { z } from "zod";

/**
 * RIASEC Scores Schema
 * Each dimension scored 1-5
 */
export const riasecScoresSchema = z.object({
  realistic: z.number().min(1).max(5),
  investigative: z.number().min(1).max(5),
  artistic: z.number().min(1).max(5),
  social: z.number().min(1).max(5),
  enterprising: z.number().min(1).max(5),
  conventional: z.number().min(1).max(5),
});

export type RiasecScores = z.infer<typeof riasecScoresSchema>;

/**
 * RIASEC dimension definitions
 * Holland Code interest areas
 */
export const RIASEC_DIMENSIONS = [
  {
    key: "realistic" as const,
    label: "Realistic",
    description: "I enjoy working with tools, machines, or building things",
    detailedDescription:
      "Realistic people like work activities that include practical, hands-on problems and solutions. They like working with plants, animals, and physical materials like wood, tools, and machinery.",
    color: "$blue9",
  },
  {
    key: "investigative" as const,
    label: "Investigative",
    description: "I like solving puzzles and analyzing complex problems",
    detailedDescription:
      "Investigative people like work activities that have to do with ideas and thinking rather than physical activity. They like to search for facts and figure out problems mentally.",
    color: "$purple9",
  },
  {
    key: "artistic" as const,
    label: "Artistic",
    description:
      "I express myself through creative work and artistic activities",
    detailedDescription:
      "Artistic people like work activities that deal with the artistic side of things, such as forms, designs, and patterns. They like self-expression and prefer situations where work can be done without following a clear set of rules.",
    color: "$pink9",
  },
  {
    key: "social" as const,
    label: "Social",
    description: "I prefer working with people and helping others",
    detailedDescription:
      "Social people like work activities that involve helping people, teaching, or providing service to others. They prefer to talk through problems rather than working alone.",
    color: "$green9",
  },
  {
    key: "enterprising" as const,
    label: "Enterprising",
    description: "I enjoy leading projects and influencing others",
    detailedDescription:
      "Enterprising people like work activities that involve starting up and carrying out projects, especially in business. They like persuading and leading people and making decisions.",
    color: "$orange9",
  },
  {
    key: "conventional" as const,
    label: "Conventional",
    description:
      "I like organizing information and following detailed procedures",
    detailedDescription:
      "Conventional people like work activities that follow set procedures and routines. They prefer working with data and detail rather than with ideas.",
    color: "$yellow9",
  },
] as const;

/**
 * Career Assessment Form Schema
 */
export const careerAssessmentSchema = z.object({
  riasec_scores: riasecScoresSchema,
  current_occupation_code: z.string().optional(),
  target_occupation_codes: z.array(z.string()).optional(),
});

export type CareerAssessmentFormData = z.infer<typeof careerAssessmentSchema>;

/**
 * Default values for career assessment
 */
export const careerAssessmentDefaults: CareerAssessmentFormData = {
  riasec_scores: {
    realistic: 3,
    investigative: 3,
    artistic: 3,
    social: 3,
    enterprising: 3,
    conventional: 3,
  },
  current_occupation_code: undefined,
  target_occupation_codes: [],
};

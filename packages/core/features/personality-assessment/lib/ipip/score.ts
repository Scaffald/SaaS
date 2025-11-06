import type { IPIPResults, IPIPScoreOptions, IPIPScores } from "./types";
import type { IPIPAnswer, IPIPDomain, IPIPFacet } from "./types";
import results from "./data/en.results.json";

function _calcHandler(score: number, count: number): string {
  const average = score / count;
  let result = "neutral";
  if (average > 3) {
    result = "high";
  } else if (average < 3) {
    result = "low";
  }
  return result;
}

export function getScore(
  { answers, calcHandler }: IPIPScoreOptions,
): IPIPScores {
  const calculateResult = calcHandler || _calcHandler;

  const reduceFactors = (
    a: Record<
      string,
      {
        score: number;
        count: number;
        result: string;
        facet: Record<string, { score: number; count: number; result: string }>;
      }
    >,
    b: IPIPAnswer,
  ) => {
    const domain = b.domain;
    if (!a[domain]) {
      a[domain] = { score: 0, count: 0, result: "neutral", facet: {} };
    }

    a[domain].score += b.score;
    a[domain].count += 1;
    a[domain].result = calculateResult(a[domain].score, a[domain].count);

    if (b.facet) {
      const facetKey = String(b.facet) as IPIPFacet;
      if (!a[domain].facet[facetKey]) {
        a[domain].facet[facetKey] = { score: 0, count: 0, result: "neutral" };
      }
      a[domain].facet[facetKey].score += b.score;
      a[domain].facet[facetKey].count += 1;
      a[domain].facet[facetKey].result = calculateResult(
        a[domain].facet[facetKey].score,
        a[domain].facet[facetKey].count,
      );
    }

    return a;
  };

  return answers.reduce(reduceFactors, {}) as IPIPScores;
}

export function getResults(): IPIPResults {
  return results as unknown as IPIPResults;
}

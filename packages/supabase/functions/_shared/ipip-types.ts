// @ts-nocheck
export type IPIPKeyed = 'plus' | 'minus'
export type IPIPDomain = 'A' | 'E' | 'N' | 'C' | 'O'
export type IPIPFacet = '1' | '2' | '3' | '4' | '5' | '6'

export interface IPIPChoice {
  text: string
  score: 1 | 2 | 3 | 4 | 5
  color: 1 | 2 | 3 | 4 | 5
}

export interface IPIPChoices {
  plus: IPIPChoice[]
  minus: IPIPChoice[]
}

export interface IPIPQuestion {
  id: string
  text: string
  keyed: IPIPKeyed
  domain: IPIPDomain
  facet: IPIPFacet
}

export interface IPIPItem extends IPIPQuestion {
  num: number
  score: number
}

export interface IPIPAnswer {
  id: string
  domain: IPIPDomain
  facet: number
  score: number
}

export interface IPIPAnswers {
  language: string
  answers: IPIPAnswer[]
}

export interface IPIPFacetScore {
  score: number
  count: number
  result: 'low' | 'neutral' | 'high'
}

export interface IPIPScore {
  score: number
  count: number
  result: 'low' | 'neutral' | 'high'
  facet: {
    [key in IPIPFacet]: IPIPFacetScore
  }
}

export type IPIPScores = {
  [key in IPIPDomain]: IPIPScore
}

export interface IPIPScoreOptions {
  answers: IPIPAnswer[]
  calcHandler?: (score: number, count: number) => string
}

export interface IPIPResultItem {
  title?: string
  text: string
}

export type IPIPResultFacets = {
  [key in IPIPFacet]: IPIPResultItem
}

export interface IPIPResult {
  title: string
  summary: string
  description: string
  results: {
    low: IPIPResultItem
    neutral: IPIPResultItem
    high: IPIPResultItem
  }
  facets: IPIPResultFacets
}

export type IPIPResults = {
  [key in IPIPDomain]: IPIPResult
}

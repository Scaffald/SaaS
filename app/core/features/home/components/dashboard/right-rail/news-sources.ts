export type NewsSource = {
  id: string
  label: string
  feedUrl: string
  siteUrl?: string
}

export const NEWS_SOURCES: NewsSource[] = [
  {
    id: 'articles',
    label: 'Top Stories',
    feedUrl: 'https://www.enr.com/rss/articles',
    siteUrl: 'https://www.enr.com/articles',
  },
  {
    id: '1',
    label: 'ENR National',
    feedUrl: 'https://www.enr.com/rss/1',
    siteUrl: 'https://www.enr.com/',
  },
  {
    id: '2',
    label: 'ENR California',
    feedUrl: 'https://www.enr.com/rss/2',
    siteUrl: 'https://www.enr.com/california',
  },
  {
    id: '3',
    label: 'ENR Mid-Atlantic',
    feedUrl: 'https://www.enr.com/rss/3',
    siteUrl: 'https://www.enr.com/midatlantic',
  },
  {
    id: '4',
    label: 'ENR Midwest',
    feedUrl: 'https://www.enr.com/rss/4',
    siteUrl: 'https://www.enr.com/midwest',
  },
  {
    id: '5',
    label: 'ENR Mountain States',
    feedUrl: 'https://www.enr.com/rss/5',
    siteUrl: 'https://www.enr.com/mountainstates',
  },
  {
    id: '6',
    label: 'ENR New York',
    feedUrl: 'https://www.enr.com/rss/6',
    siteUrl: 'https://www.enr.com/newyork',
  },
  {
    id: '7',
    label: 'ENR New England',
    feedUrl: 'https://www.enr.com/rss/7',
    siteUrl: 'https://www.enr.com/newengland',
  },
  {
    id: '8',
    label: 'ENR Northwest',
    feedUrl: 'https://www.enr.com/rss/8',
    siteUrl: 'https://www.enr.com/northwest',
  },
  {
    id: '9',
    label: 'ENR Southeast',
    feedUrl: 'https://www.enr.com/rss/9',
    siteUrl: 'https://www.enr.com/southeast',
  },
  {
    id: '10',
    label: 'ENR Southwest',
    feedUrl: 'https://www.enr.com/rss/10',
    siteUrl: 'https://www.enr.com/southwest',
  },
  {
    id: '11',
    label: 'ENR Texas & Louisiana',
    feedUrl: 'https://www.enr.com/rss/11',
    siteUrl: 'https://www.enr.com/texas-louisiana',
  },
]

export const DEFAULT_NEWS_SOURCE_ID = NEWS_SOURCES[0]?.id ?? ''

export const NEWS_SOURCE_LOOKUP = NEWS_SOURCES.reduce<Record<string, NewsSource>>(
  (accumulator, source) => {
    accumulator[source.id] = source
    return accumulator
  },
  {}
)

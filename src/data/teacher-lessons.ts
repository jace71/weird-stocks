/**
 * Classroom lesson cards for /teachers.
 *
 * Add a card by appending to `teacherLessons`. `slug` must be the stock
 * profile id, lowercase, as in /stocks/msb/. Set `pdfHref` only when the
 * file is in `public/`. Leave `slidesHref` unset until a deck exists:
 * the page shows "Coming soon" and does not link it.
 */

export const teachersPageDescription =
  'Free one-page lessons that use real, strange public companies to teach how money and businesses actually work.';

export const lessonConcepts = [
  { id: 'royalties', label: 'Royalties & commodities' },
  { id: 'land', label: 'Land as an asset' },
  { id: 'conglomerates', label: 'Conglomerates' },
  { id: 'brands', label: 'Brands & competition' },
] as const;

export type LessonConceptId = (typeof lessonConcepts)[number]['id'];

export interface TeacherLesson {
  ticker: string;
  exchange: string;
  company: string;
  /** Lowercase content-collection id. Becomes /stocks/<slug>/. */
  slug: string;
  title: string;
  hook: string;
  concept: LessonConceptId;
  /** Full label in the meta row, also used for A–Z sort. */
  conceptName: string;
  conceptBadge: string;
  grades: string;
  time: string;
  /** Ready lessons sort first and are not drawn as placeholders. */
  ready: boolean;
  order: number;
  /** Public path, for example /teachers/lesson-card-msb.pdf */
  pdfHref?: string;
  /** Absolute URL of a Google Slides deck. Omit while the deck is unwritten. */
  slidesHref?: string;
}

export interface TickerPrompt {
  ticker: string;
  company: string;
  detail: string;
  open?: boolean;
}

export const teacherLessons: TeacherLesson[] = [
  {
    ticker: 'MSB',
    exchange: 'NYSE',
    company: 'Mesabi Trust',
    slug: 'msb',
    title: 'What is a royalty?',
    hook: "A NYSE-listed trust with no employees that collects royalties on Minnesota iron ore shipped by Cleveland-Cliffs' Northshore Mining.",
    concept: 'royalties',
    conceptName: 'Royalties & commodity cycles',
    conceptBadge: 'Royalties',
    grades: '9–12',
    time: '1 class (10-min activity)',
    ready: true,
    order: 1,
    pdfHref: '/teachers/lesson-card-msb.pdf',
  },
  {
    ticker: 'TPL',
    exchange: 'NYSE',
    company: 'Texas Pacific Land',
    slug: 'tpl',
    title: '[TPL lesson title TBD]',
    hook: '[Hook TBD. Based on the TPL profile: land as an asset.]',
    concept: 'land',
    conceptName: 'Land as an asset',
    conceptBadge: 'Land',
    grades: '9–12',
    time: '[TBD]',
    ready: false,
    order: 2,
  },
  {
    ticker: 'SEB',
    exchange: 'NYSE American',
    company: 'Seaboard Corporation',
    slug: 'seb',
    title: '[SEB lesson title TBD]',
    hook: '[Hook TBD. Based on the SEB profile: what a conglomerate is.]',
    concept: 'conglomerates',
    conceptName: 'Conglomerates',
    conceptBadge: 'Conglomerates',
    grades: '9–12',
    time: '[TBD]',
    ready: false,
    order: 3,
  },
  {
    ticker: 'FIZZ',
    exchange: 'NASDAQ',
    company: 'National Beverage Corp.',
    slug: 'fizz',
    title: '[FIZZ lesson title TBD]',
    hook: '[Hook TBD. Based on the FIZZ profile: brands and competition.]',
    concept: 'brands',
    conceptName: 'Brands & competition',
    conceptBadge: 'Brands',
    grades: '9–12',
    time: '[TBD]',
    ready: false,
    order: 4,
  },
];

export const tickerGame: TickerPrompt[] = [
  {
    ticker: 'FIZZ',
    company: 'National Beverage Corp.',
    detail: 'The LaCroix company',
    open: true,
  },
  {
    ticker: 'WOOF',
    company: 'Petco',
    detail: 'Pet supplies and care',
  },
  {
    ticker: 'TUSK',
    company: 'Mammoth Energy Services',
    detail: 'Mammoth → tusk',
  },
  {
    ticker: 'LUNR',
    company: 'Intuitive Machines',
    detail: 'Builds landers for the moon',
  },
];

const conceptIds = new Set<string>(lessonConcepts.map((concept) => concept.id));

for (const lesson of teacherLessons) {
  if (!conceptIds.has(lesson.concept)) {
    throw new Error(`Teacher lesson ${lesson.ticker} uses unknown concept "${lesson.concept}".`);
  }
  if (lesson.slug !== lesson.slug.toLowerCase()) {
    throw new Error(`Teacher lesson ${lesson.ticker} slug must be lowercase. Received "${lesson.slug}".`);
  }
}

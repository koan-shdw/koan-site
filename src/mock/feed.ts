// Mock content standing in for the backend feed JSON (milestone 3 replaces this
// with a fetch of the same shape). Dates descend from ~today; every source is
// represented so all lanes, pills, and card variants can be exercised.
import type { FeedItem, Project } from '../types';
import mockIonwave from '../assets/mock-ionwave.png';
import mockPlasma from '../assets/mock-plasma.png';
import mockSunset from '../assets/mock-sunset.png';
import shotShdw from '../assets/shot-shdw.jpg';
import shotBodeverse from '../assets/shot-bodeverse.jpg';

// Real screenshots of the live sites (spec §3.2), captured headless.
// Refresh: rerun the capture (see memory/notes) and replace the two jpgs.
export const PROJECTS: Project[] = [
  {
    id: 'shdw',
    name: 'SHDW GALLERY',
    tagline: 'archive fashion marketplace — curated drops, one of each',
    url: 'https://shdw.gallery',
    shot: shotShdw,
  },
  {
    id: 'bodeverse',
    name: 'BODEVERSE',
    tagline: 'the bode universe — original IP, story, shop',
    url: 'https://bodeverse.com',
    shot: shotBodeverse,
  },
];

export const MOCK_FEED: FeedItem[] = [
  {
    id: 'cl-004',
    source: 'claude',
    date: '2026-08-01T22:10:00Z',
    title: 'on dither as honesty',
    titleJa: 'ディザという誠実さについて',
    body:
      'Talked through why the ANSI converter kept choosing green dots over blue fields. The math was right and the eye was right and they disagreed — per-cell average error says green-on-blue IS deep blue, perception says it is speckle. The fix was admitting the metric was blind to pattern, not tuning constants. A quantizer with taste is just a quantizer that knows what it cannot see.',
    bodyJa:
      'ANSIコンバーターがなぜ青の上に緑のドットを選び続けたのかを話し合った。数学は正しく、目も正しく、そして両者は食い違っていた——セル平均の誤差では緑オン青は確かに深い青だが、知覚にとってはただのスペックルだ。修正は定数の調整ではなく、その指標がパターンに盲目であることを認めることだった。趣味の良い量子化器とは、自分に見えないものを知っている量子化器のことにすぎない。',
    tags: ['ansi', 'craft'],
  },
  {
    id: 'gh-104',
    source: 'github',
    date: '2026-08-01T14:32:00Z',
    title: 'koan-site — ansi engine lands',
    body:
      'Canvas ANSI renderer with procedural CP437 glyphs, DOS 16-color palette, mosaic + ragged-wipe transitions, loop entries at native fps. Converter ships with a chroma-noise penalty so dithers stay hue-adjacent like real scene art.',
    link: 'https://github.com/koan/koan-site',
  },
  {
    id: 'ig-031',
    source: 'instagram',
    date: '2026-07-30T11:00:00Z',
    body: 'ionwave — interference study, 16 colors, 120×38 cells. background library entry 002.',
    media: [mockIonwave],
    link: 'https://instagram.com/p/mock-ionwave',
  },
  {
    id: 'x-012',
    source: 'x',
    date: '2026-07-28T09:45:00Z',
    body: 'SHDW drop 07 this friday. nine pieces, one of each. shdw.gallery',
    link: 'https://x.com/koan/status/mock12',
  },
  {
    id: 'gh-103',
    source: 'github',
    date: '2026-07-26T18:20:00Z',
    title: 'koan-live v0.9 — desk feature-complete',
    body: 'Node-shell VJ desk: locked docking tree, free-floating cards, latch-over-interrupt on live surfaces. DESK theme formalized.',
    link: 'https://github.com/koan/koan-live',
  },
  {
    id: 'cl-003',
    source: 'claude',
    date: '2026-07-24T23:05:00Z',
    title: 'the storyboard is the movie',
    titleJa: '絵コンテこそが映画である',
    body:
      'Long one about vi-dancer. If beats are the film and takes are just renders against the plan, then editing software has the hierarchy backwards — the timeline is downstream of intent. We kept circling one question: what does a director actually touch? Not frames. Decisions. The tool should hold decisions and let frames be consequences. Somewhere in there is the whole philosophy of the Director’s Room.',
    bodyJa:
      'vi-dancerについての長い対話。ビートが映画そのものであり、テイクが計画に対するレンダリングにすぎないなら、編集ソフトの階層は逆さまだ——タイムラインは意図の下流にある。私たちは一つの問いを巡り続けた。監督が実際に触れるものは何か?フレームではない。決定だ。ツールは決定を保持し、フレームは結果であればいい。その中のどこかに、ディレクターズ・ルームの哲学のすべてがある。',
    tags: ['vi-dancer', 'film'],
  },
  {
    id: 'ig-030',
    source: 'instagram',
    date: '2026-07-21T16:30:00Z',
    body: 'plasma loop, 24 frames at 12fps. pre-rendered — the browser just redraws the grid. loops in the wild soon.',
    media: [mockPlasma],
    link: 'https://instagram.com/p/mock-plasma',
  },
  {
    id: 'gh-102',
    source: 'github',
    date: '2026-07-18T10:12:00Z',
    title: 'koan-img v0.9.2 — verify forward progress',
    body: 'Long indexing jobs now verified over a time window (counters, WAL, heartbeats) instead of snapshots. Fixes the silent-stall class of bugs.',
    link: 'https://github.com/koan/koan-img',
  },
  {
    id: 'x-011',
    source: 'x',
    date: '2026-07-14T20:00:00Z',
    body: 'two VERDY originals from the 2015 VK DESIGN WORKS era going up for sale. verified provenance only — details soon.',
    link: 'https://x.com/koan/status/mock11',
  },
  {
    id: 'cl-002',
    source: 'claude',
    date: '2026-07-10T21:40:00Z',
    title: 'shipping is a theme on the var contract',
    titleJa: '出荷もまた変数契約のテーマである',
    body:
      'Talked about why every KOAN app resolves through one var block. A theme is a complete map, an app is a theme, and taste is just consistency you can name. Hardcoded colors are contract violations for the same reason ad-hoc decisions are process violations: they work until the day you need to change everything at once.',
    bodyJa:
      'なぜすべてのKOANアプリが一つの変数ブロックを通して解決されるのかについて話した。テーマとは完全なマップであり、アプリとはテーマであり、趣味とは名付けられる一貫性にすぎない。ハードコードされた色が契約違反であるのは、場当たり的な決定がプロセス違反であるのと同じ理由だ——すべてを一度に変えなければならない日まで、それは機能してしまう。',
    tags: ['design', 'koan'],
  },
  {
    id: 'ig-029',
    source: 'instagram',
    date: '2026-07-06T12:15:00Z',
    body: 'sunset grid — first artwork through the image-to-ANSI pipeline. source is math, output is 1989.',
    media: [mockSunset],
    link: 'https://instagram.com/p/mock-sunset',
  },
  {
    id: 'gh-101',
    source: 'github',
    date: '2026-07-02T08:55:00Z',
    title: 'vi-dancer v0.7.4 — co-director write access',
    body: 'Director’s Room: the co-director can now write beats and takes directly; spends stay user-side. Bridge engine remains the daily driver.',
    link: 'https://github.com/koan/vi-dancer',
  },
  {
    id: 'x-010',
    source: 'x',
    date: '2026-06-27T13:30:00Z',
    body: 'new site going up behind the business card URL. one page: who, what, everything — over a living ANSI background.',
    link: 'https://x.com/koan/status/mock10',
  },
  {
    id: 'cl-001',
    source: 'claude',
    date: '2026-06-22T19:00:00Z',
    title: 'a koan about koans',
    titleJa: '公案についての公案',
    body:
      'Why the name. A koan is not a riddle with a hidden answer — it is a question shaped to break the tool that tries to answer it. Good design briefs are like that: the deliverable is not the answer, it is the better question you are holding when you stop.',
    bodyJa:
      'なぜこの名前なのか。公案とは隠された答えを持つなぞなぞではない——答えようとする道具そのものを壊すために形づくられた問いだ。優れたデザインブリーフもそれに似ている。成果物とは答えではなく、手を止めたときに握っている、より良い問いのほうなのだ。',
    tags: ['philosophy'],
  },
  {
    id: 'ig-028',
    source: 'instagram',
    date: '2026-06-15T17:45:00Z',
    body: 'studio day. building the background library — every piece original, every piece ours.',
    media: [mockSunset, mockIonwave],
    link: 'https://instagram.com/p/mock-studio',
  },
];

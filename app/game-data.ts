export type Nation = 'south' | 'north';
export type Role = 'GK' | 'CB' | 'FB' | 'CM' | 'CAM' | 'WG' | 'ST';
export type Line = 'goalkeeper' | 'defense' | 'midfield' | 'attack';

export type OutfieldStats = {
  speed: number;
  agility: number;
  stamina: number;
  dribble: number;
  finishing: number;
  defense: number;
};

export type GoalkeeperStats = {
  saving: number;
  agility: number;
  positioning: number;
  reactions: number;
  aerial: number;
  leadership: number;
};

export type Player = {
  id: string;
  name: string;
  nation: Nation;
  card: number;
  sourcePosition: string;
  roles: Role[];
  stats?: OutfieldStats;
  gkStats?: GoalkeeperStats;
};

export const statLabels: Record<keyof OutfieldStats, string> = {
  speed: '스피드',
  agility: '민첩성',
  stamina: '체력',
  dribble: '드리블',
  finishing: '결정력',
  defense: '수비력',
};

export const gkStatLabels: Record<keyof GoalkeeperStats, string> = {
  saving: '막아내기',
  agility: '민첩성',
  positioning: '위치선정',
  reactions: '반응속도',
  aerial: '공중볼',
  leadership: '리더십',
};

export const players: Player[] = [
  {
    id: 'kim-minjae', name: '김민재', nation: 'south', card: 3, sourcePosition: 'DF', roles: ['CB', 'FB'],
    stats: { speed: 70, agility: 60, stamina: 80, dribble: 65, finishing: 45, defense: 100 },
  },
  {
    id: 'park-jisung', name: '박지성', nation: 'south', card: 4, sourcePosition: 'MF', roles: ['CM', 'CAM', 'WG'],
    stats: { speed: 80, agility: 70, stamina: 90, dribble: 75, finishing: 65, defense: 90 },
  },
  {
    id: 'son-heungmin', name: '손흥민', nation: 'south', card: 5, sourcePosition: 'RW', roles: ['WG', 'ST'],
    stats: { speed: 90, agility: 85, stamina: 90, dribble: 85, finishing: 90, defense: 45 },
  },
  {
    id: 'hwang-heechang', name: '황희찬', nation: 'south', card: 6, sourcePosition: 'FW', roles: ['WG', 'ST'],
    stats: { speed: 85, agility: 80, stamina: 80, dribble: 75, finishing: 70, defense: 65 },
  },
  {
    id: 'lee-kangin', name: '이강인', nation: 'south', card: 7, sourcePosition: 'MF', roles: ['CAM', 'CM', 'WG'],
    stats: { speed: 90, agility: 85, stamina: 60, dribble: 95, finishing: 90, defense: 40 },
  },
  {
    id: 'jung-wooyoung', name: '정우영', nation: 'south', card: 8, sourcePosition: 'MF', roles: ['CM', 'CAM'],
    stats: { speed: 75, agility: 75, stamina: 75, dribble: 75, finishing: 40, defense: 10 },
  },
  {
    id: 'hong-chul', name: '홍철', nation: 'south', card: 9, sourcePosition: 'MF', roles: ['FB', 'CM'],
    stats: { speed: 60, agility: 90, stamina: 45, dribble: 70, finishing: 60, defense: 90 },
  },
  {
    id: 'lee-seungwoo', name: '이승우', nation: 'south', card: 10, sourcePosition: 'MF', roles: ['WG', 'CAM'],
    stats: { speed: 90, agility: 90, stamina: 75, dribble: 90, finishing: 20, defense: 10 },
  },
  {
    id: 'cho-guesung', name: '조규성', nation: 'south', card: 11, sourcePosition: 'MF', roles: ['ST'],
    stats: { speed: 65, agility: 75, stamina: 90, dribble: 95, finishing: 90, defense: 15 },
  },
  {
    id: 'kim-younggwon', name: '김영권', nation: 'south', card: 12, sourcePosition: 'MF', roles: ['CB', 'FB'],
    stats: { speed: 40, agility: 75, stamina: 75, dribble: 15, finishing: 10, defense: 90 },
  },
  {
    id: 'jo-hyeonwoo', name: '조현우', nation: 'south', card: 13, sourcePosition: 'GK', roles: ['GK'],
    gkStats: { saving: 70, agility: 90, positioning: 90, reactions: 60, aerial: 70, leadership: 60 },
  },
  {
    id: 'han-kwangsong', name: '한광성', nation: 'north', card: 14, sourcePosition: 'MF', roles: ['ST', 'CAM', 'WG'],
    stats: { speed: 85, agility: 90, stamina: 70, dribble: 90, finishing: 95, defense: 10 },
  },
  {
    id: 'pak-dooik', name: '박두익', nation: 'north', card: 15, sourcePosition: 'FW', roles: ['ST', 'CAM'],
    stats: { speed: 85, agility: 65, stamina: 80, dribble: 55, finishing: 100, defense: 5 },
  },
  {
    id: 'ri-kwangchon', name: '리광천', nation: 'north', card: 16, sourcePosition: 'CF', roles: ['CM', 'CB'],
    stats: { speed: 30, agility: 40, stamina: 95, dribble: 40, finishing: 20, defense: 70 },
  },
  {
    id: 'pak-kwangryong', name: '박광룡', nation: 'north', card: 17, sourcePosition: 'FW', roles: ['ST', 'WG'],
    stats: { speed: 40, agility: 75, stamina: 95, dribble: 90, finishing: 35, defense: 5 },
  },
  {
    id: 'jong-ilgwan', name: '정일관', nation: 'north', card: 18, sourcePosition: 'FW', roles: ['WG', 'ST'],
    stats: { speed: 40, agility: 60, stamina: 95, dribble: 70, finishing: 90, defense: 15 },
  },
  {
    id: 'ri-joguk', name: '리조국', nation: 'north', card: 19, sourcePosition: 'FW', roles: ['WG', 'ST'],
    stats: { speed: 100, agility: 10, stamina: 5, dribble: 100, finishing: 10, defense: 15 },
  },
  {
    id: 'jang-kukchol', name: '장국철', nation: 'north', card: 20, sourcePosition: 'CB', roles: ['CB', 'FB'],
    stats: { speed: 75, agility: 45, stamina: 35, dribble: 35, finishing: 80, defense: 90 },
  },
  {
    id: 'kim-yusong', name: '김유성', nation: 'north', card: 21, sourcePosition: 'CB', roles: ['CB', 'FB'],
    stats: { speed: 10, agility: 10, stamina: 90, dribble: 90, finishing: 10, defense: 90 },
  },
  {
    id: 'jong-taese', name: '정대세', nation: 'north', card: 22, sourcePosition: 'FW', roles: ['ST', 'WG'],
    stats: { speed: 90, agility: 90, stamina: 40, dribble: 90, finishing: 10, defense: 10 },
  },
  {
    id: 'kang-kukchol', name: '강국철', nation: 'north', card: 23, sourcePosition: 'FW', roles: ['WG', 'ST'],
    stats: { speed: 90, agility: 10, stamina: 40, dribble: 90, finishing: 90, defense: 10 },
  },
  {
    id: 'ri-myongguk', name: '리명국', nation: 'north', card: 24, sourcePosition: 'GK', roles: ['GK'],
    gkStats: { saving: 60, agility: 70, positioning: 90, reactions: 40, aerial: 80, leadership: 90 },
  },
];

export const playerById = new Map(players.map((player) => [player.id, player]));

export const slots = [
  { id: 'GK', label: 'GK', role: 'GK', line: 'goalkeeper', x: 50, y: 89 },
  { id: 'RB', label: 'RB', role: 'FB', line: 'defense', x: 82, y: 72 },
  { id: 'RCB', label: 'CB', role: 'CB', line: 'defense', x: 62, y: 78 },
  { id: 'LCB', label: 'CB', role: 'CB', line: 'defense', x: 38, y: 78 },
  { id: 'LB', label: 'LB', role: 'FB', line: 'defense', x: 18, y: 72 },
  { id: 'RCM', label: 'CM', role: 'CM', line: 'midfield', x: 63, y: 55 },
  { id: 'LCM', label: 'CM', role: 'CM', line: 'midfield', x: 37, y: 55 },
  { id: 'CAM', label: 'CAM', role: 'CAM', line: 'midfield', x: 50, y: 38 },
  { id: 'RW', label: 'RW', role: 'WG', line: 'attack', x: 79, y: 23 },
  { id: 'ST', label: 'ST', role: 'ST', line: 'attack', x: 50, y: 13 },
  { id: 'LW', label: 'LW', role: 'WG', line: 'attack', x: 21, y: 23 },
] as const;

export type SlotId = (typeof slots)[number]['id'];

export const unitedLineup: Record<SlotId, string> = {
  GK: 'ri-myongguk',
  RB: 'jang-kukchol',
  RCB: 'kim-minjae',
  LCB: 'kim-younggwon',
  LB: 'hong-chul',
  RCM: 'park-jisung',
  LCM: 'ri-kwangchon',
  CAM: 'han-kwangsong',
  RW: 'son-heungmin',
  ST: 'pak-dooik',
  LW: 'hwang-heechang',
};

export const powerLineup: Record<SlotId, string> = {
  GK: 'jo-hyeonwoo',
  RB: 'jang-kukchol',
  RCB: 'kim-minjae',
  LCB: 'kim-younggwon',
  LB: 'hong-chul',
  RCM: 'park-jisung',
  LCM: 'jung-wooyoung',
  CAM: 'lee-kangin',
  RW: 'son-heungmin',
  ST: 'cho-guesung',
  LW: 'hwang-heechang',
};

export type TacticId = 'counter' | 'possession' | 'press' | 'lowBlock' | 'wingPlay';

export const tactics: Array<{ id: TacticId; label: string; short: string; description: string }> = [
  { id: 'counter', label: '번개 역습', short: '역습', description: '수비 뒤 공간을 빠르게 찌르는 직선적인 전환' },
  { id: 'possession', label: '점유 전개', short: '점유', description: '기술 좋은 미드필더가 템포를 장악하는 방식' },
  { id: 'press', label: '전방 압박', short: '압박', description: '체력과 활동량으로 상대 빌드업을 끊는 방식' },
  { id: 'lowBlock', label: '콤팩트 수비', short: '수비', description: '포백과 골키퍼를 중심으로 공간을 닫는 방식' },
  { id: 'wingPlay', label: '측면 오버로드', short: '측면', description: '윙과 풀백의 속도·드리블로 폭을 넓히는 방식' },
];

export type Opponent = {
  id: string;
  name: string;
  flag: string;
  nickname: string;
  style: string;
  description: string;
  attack: number;
  defense: number;
  power: number;
  counterBonus: Record<TacticId, number>;
  strengths: string[];
  weakPoint: string;
  accent: string;
};

export const opponents: Opponent[] = [
  {
    id: 'brazil', name: '브라질', flag: '🇧🇷', nickname: '삼바의 창의성', style: '개인기·공격 전개',
    description: '일대일과 변칙적인 공격 루트가 강한 가상 프로필', attack: 88, defense: 73, power: 83,
    counterBonus: { counter: 1, possession: -4, press: 8, lowBlock: 4, wingPlay: 2 },
    strengths: ['개인기', '박스 침투', '변칙 전개'], weakPoint: '후방 빌드업에 강한 압박을 걸면 실수가 늘어납니다.', accent: '#f1c93b',
  },
  {
    id: 'argentina', name: '아르헨티나', flag: '🇦🇷', nickname: '중앙의 승부사', style: '중원 압박·결정력',
    description: '중앙에서 볼을 탈취한 뒤 날카롭게 마무리하는 가상 프로필', attack: 86, defense: 77, power: 84,
    counterBonus: { counter: 3, possession: -5, press: 4, lowBlock: 7, wingPlay: 5 },
    strengths: ['중앙 압박', '결정력', '경기 운영'], weakPoint: '중앙을 좁히고 측면에서 수적 우위를 만들면 흔들립니다.', accent: '#72c7e7',
  },
  {
    id: 'france', name: '프랑스', flag: '🇫🇷', nickname: '폭발적인 전환', style: '피지컬·고속 역습',
    description: '강한 피지컬과 빠른 전환을 앞세우는 가상 프로필', attack: 88, defense: 81, power: 86,
    counterBonus: { counter: -3, possession: 5, press: -5, lowBlock: 8, wingPlay: 2 },
    strengths: ['스피드', '피지컬', '역습'], weakPoint: '라인 간격을 좁히고 템포를 늦추면 폭발력이 줄어듭니다.', accent: '#3157a7',
  },
  {
    id: 'germany', name: '독일', flag: '🇩🇪', nickname: '게겐프레싱', style: '전방 압박·조직력',
    description: '공을 잃은 즉시 집단 압박으로 되찾는 가상 프로필', attack: 82, defense: 82, power: 84,
    counterBonus: { counter: 9, possession: -6, press: -2, lowBlock: 4, wingPlay: 3 },
    strengths: ['전방 압박', '조직력', '세트피스'], weakPoint: '높아진 수비 라인 뒤 공간을 빠르게 공략해야 합니다.', accent: '#d4a72c',
  },
  {
    id: 'spain', name: '스페인', flag: '🇪🇸', nickname: '패스의 지배자', style: '점유·짧은 패스',
    description: '짧은 패스로 상대를 끌어내고 공간을 만드는 가상 프로필', attack: 81, defense: 79, power: 83,
    counterBonus: { counter: 6, possession: -4, press: 9, lowBlock: -5, wingPlay: 2 },
    strengths: ['점유율', '패스', '하프스페이스'], weakPoint: '첫 패스부터 강하게 압박하면 전진 속도를 낮출 수 있습니다.', accent: '#e04c3f',
  },
  {
    id: 'england', name: '잉글랜드', flag: '🏴', nickname: '측면과 세트피스', style: '크로스·세트피스',
    description: '측면 전개와 박스 안 경합에 강한 가상 프로필', attack: 84, defense: 81, power: 84,
    counterBonus: { counter: 2, possession: 8, press: 4, lowBlock: 1, wingPlay: -4 },
    strengths: ['측면 전개', '공중볼', '세트피스'], weakPoint: '볼을 오래 소유하며 크로스 시도 자체를 줄이는 편이 유리합니다.', accent: '#c84652',
  },
  {
    id: 'japan', name: '일본', flag: '🇯🇵', nickname: '빠른 조직 축구', style: '기동력·패스워크',
    description: '빠른 패스 교환과 촘촘한 간격을 활용하는 가상 프로필', attack: 79, defense: 79, power: 81,
    counterBonus: { counter: 4, possession: -2, press: 8, lowBlock: -4, wingPlay: 5 },
    strengths: ['기동력', '패스워크', '조직력'], weakPoint: '체력과 피지컬을 앞세운 지속 압박으로 리듬을 깨야 합니다.', accent: '#d8535c',
  },
];

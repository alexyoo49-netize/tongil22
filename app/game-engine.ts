import {
  type Opponent,
  type OutfieldStats,
  type Player,
  type Role,
  type SlotId,
  type TacticId,
  playerById,
  slots,
  tactics,
} from './game-data';

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);

const roleWeights: Record<Exclude<Role, 'GK'>, Partial<Record<keyof OutfieldStats, number>>> = {
  CB: { defense: 0.45, stamina: 0.2, agility: 0.15, speed: 0.1, dribble: 0.05, finishing: 0.05 },
  FB: { speed: 0.25, stamina: 0.25, defense: 0.25, dribble: 0.15, agility: 0.1 },
  CM: { stamina: 0.25, dribble: 0.25, defense: 0.2, agility: 0.15, speed: 0.1, finishing: 0.05 },
  CAM: { dribble: 0.3, agility: 0.25, finishing: 0.2, speed: 0.15, stamina: 0.1 },
  WG: { speed: 0.3, dribble: 0.25, agility: 0.2, finishing: 0.2, stamina: 0.05 },
  ST: { finishing: 0.4, speed: 0.2, agility: 0.15, stamina: 0.15, dribble: 0.1 },
};

const roleLine: Record<Role, string> = {
  GK: 'goalkeeper',
  CB: 'defense',
  FB: 'defense',
  CM: 'midfield',
  CAM: 'midfield',
  WG: 'attack',
  ST: 'attack',
};

const adjacentRolePairs: Array<[Role, Role, number]> = [
  ['CB', 'FB', 0.9],
  ['CM', 'CAM', 0.9],
  ['WG', 'ST', 0.9],
  ['CAM', 'WG', 0.84],
  ['CAM', 'ST', 0.84],
  ['CM', 'FB', 0.74],
  ['CM', 'CB', 0.7],
  ['FB', 'WG', 0.72],
];

const tacticMatchProfile: Record<TacticId, { attack: number; defense: number; tempo: number }> = {
  counter: { attack: 5, defense: -2, tempo: 0.08 },
  possession: { attack: 1, defense: 4, tempo: -0.06 },
  press: { attack: 3, defense: 1, tempo: 0.14 },
  lowBlock: { attack: -5, defense: 7, tempo: -0.18 },
  wingPlay: { attack: 6, defense: -2, tempo: 0.06 },
};

function goalkeeperRating(player: Player) {
  if (!player.gkStats) return 20;
  const stats = player.gkStats;
  return (
    stats.saving * 0.2 +
    stats.agility * 0.15 +
    stats.positioning * 0.2 +
    stats.reactions * 0.25 +
    stats.aerial * 0.12 +
    stats.leadership * 0.08
  );
}

export function playerOverall(player: Player) {
  if (player.gkStats) return Math.round(goalkeeperRating(player));
  if (!player.stats) return 0;
  return Math.round(mean(Object.values(player.stats)));
}

function compatibility(player: Player, targetRole: Role) {
  if (player.roles.includes(targetRole)) return 1;
  if (targetRole === 'GK' || player.roles.includes('GK')) return 0.25;

  let best = 0;
  for (const sourceRole of player.roles) {
    const pair = adjacentRolePairs.find(
      ([a, b]) => (a === sourceRole && b === targetRole) || (b === sourceRole && a === targetRole),
    );
    if (pair) best = Math.max(best, pair[2]);
    else if (roleLine[sourceRole] === roleLine[targetRole]) best = Math.max(best, 0.8);
    else best = Math.max(best, 0.58);
  }
  return best || 0.58;
}

export function positionScore(player: Player, role: Role) {
  if (role === 'GK') return Math.round(goalkeeperRating(player) * compatibility(player, role));
  if (!player.stats) return 20;
  const weights = roleWeights[role];
  const raw = Object.entries(weights).reduce(
    (score, [key, weight]) => score + player.stats![key as keyof OutfieldStats] * (weight ?? 0),
    0,
  );
  return Math.round(clamp(raw * compatibility(player, role)));
}

function getPlayer(lineup: Record<SlotId, string>, slotId: SlotId) {
  const player = playerById.get(lineup[slotId]);
  if (!player) throw new Error(`Missing player for slot ${slotId}`);
  return player;
}

function getStats(player: Player): OutfieldStats {
  if (player.stats) return player.stats;
  const keeper = goalkeeperRating(player);
  return { speed: 30, agility: 50, stamina: 50, dribble: 15, finishing: 10, defense: keeper };
}

function statAverage(lineup: Record<SlotId, string>, slotIds: SlotId[], stat: keyof OutfieldStats) {
  return mean(slotIds.map((slotId) => getStats(getPlayer(lineup, slotId))[stat]));
}

function poissonPmf(lambda: number, goals: number) {
  let factorial = 1;
  for (let i = 2; i <= goals; i += 1) factorial *= i;
  return (Math.exp(-lambda) * lambda ** goals) / factorial;
}

function outcomeProbabilities(ourLambda: number, theirLambda: number) {
  let win = 0;
  let draw = 0;
  let loss = 0;
  for (let ours = 0; ours <= 9; ours += 1) {
    for (let theirs = 0; theirs <= 9; theirs += 1) {
      const chance = poissonPmf(ourLambda, ours) * poissonPmf(theirLambda, theirs);
      if (ours > theirs) win += chance;
      else if (ours === theirs) draw += chance;
      else loss += chance;
    }
  }
  const total = win + draw + loss;
  return {
    win: (win / total) * 100,
    draw: (draw / total) * 100,
    loss: (loss / total) * 100,
  };
}

export type TacticScore = {
  id: TacticId;
  label: string;
  short: string;
  description: string;
  base: number;
  bonus: number;
  adjusted: number;
  teamRating: number;
  effectiveAttack: number;
  effectiveDefense: number;
  expectedFor: number;
  expectedAgainst: number;
  winProbability: number;
  drawProbability: number;
  lossProbability: number;
};

export type LineupAnalysis = {
  slotScores: Record<SlotId, number>;
  positionFit: number;
  attack: number;
  defense: number;
  effectiveAttack: number;
  effectiveDefense: number;
  control: number;
  integration: number;
  chemistry: number;
  teamRating: number;
  southCount: number;
  northCount: number;
  mixedLines: number;
  tactics: TacticScore[];
  recommended: TacticScore;
  secondBest: TacticScore;
  applied: TacticScore;
  winProbability: number;
  drawProbability: number;
  lossProbability: number;
  expectedFor: number;
  expectedAgainst: number;
  reasons: string[];
  weakSpot: { slotId: SlotId; player: Player; score: number };
};

export function analyzeLineup(
  lineup: Record<SlotId, string>,
  opponent: Opponent,
  chosenTactic?: TacticId | null,
): LineupAnalysis {
  const slotScores = Object.fromEntries(
    slots.map((slot) => [slot.id, positionScore(getPlayer(lineup, slot.id), slot.role)]),
  ) as Record<SlotId, number>;

  const positionFit = mean(Object.values(slotScores));
  const lineupPlayers = slots.map((slot) => getPlayer(lineup, slot.id));
  const southCount = lineupPlayers.filter((player) => player.nation === 'south').length;
  const northCount = lineupPlayers.length - southCount;
  const mixedLineGroups: SlotId[][] = [
    ['RB', 'RCB', 'LCB', 'LB'],
    ['RCM', 'LCM', 'CAM'],
    ['RW', 'ST', 'LW'],
  ];
  const mixedLines = mixedLineGroups.filter((group) => {
    const nations = new Set(group.map((slotId) => getPlayer(lineup, slotId).nation));
    return nations.size > 1;
  }).length;
  const balance = Math.min(100, Math.min(southCount, northCount) * 20);
  const integration = balance * 0.6 + (mixedLines / 3) * 100 * 0.4;
  const chemistry = positionFit * 0.65 + integration * 0.35;

  const frontFour: SlotId[] = ['CAM', 'RW', 'ST', 'LW'];
  const frontThree: SlotId[] = ['RW', 'ST', 'LW'];
  const midfield: SlotId[] = ['RCM', 'LCM', 'CAM'];
  const centralMidfield: SlotId[] = ['RCM', 'LCM'];
  const backFour: SlotId[] = ['RB', 'RCB', 'LCB', 'LB'];
  const defenseAndMidfield: SlotId[] = [...backFour, ...centralMidfield];
  const fieldPlayers: SlotId[] = slots.filter((slot) => slot.id !== 'GK').map((slot) => slot.id);
  const wingUnits: SlotId[] = ['RB', 'LB', 'RW', 'LW'];

  const attack = clamp(
    statAverage(lineup, frontFour, 'finishing') * 0.5 +
      statAverage(lineup, frontThree, 'speed') * 0.25 +
      statAverage(lineup, frontFour, 'dribble') * 0.25,
  );
  const keeper = goalkeeperRating(getPlayer(lineup, 'GK'));
  const centralCover = mean(
    centralMidfield.map((slotId) => {
      const stats = getStats(getPlayer(lineup, slotId));
      return stats.defense * 0.6 + stats.stamina * 0.4;
    }),
  );
  const defense = clamp(statAverage(lineup, backFour, 'defense') * 0.55 + centralCover * 0.2 + keeper * 0.25);
  const control = clamp(
    statAverage(lineup, midfield, 'dribble') * 0.4 +
      statAverage(lineup, midfield, 'agility') * 0.3 +
      statAverage(lineup, midfield, 'stamina') * 0.3,
  );

  const tacticBase: Record<TacticId, number> = {
    counter:
      statAverage(lineup, frontThree, 'speed') * 0.45 +
      statAverage(lineup, frontThree, 'finishing') * 0.3 +
      statAverage(lineup, defenseAndMidfield, 'defense') * 0.25,
    possession:
      statAverage(lineup, midfield, 'dribble') * 0.45 +
      statAverage(lineup, midfield, 'agility') * 0.3 +
      statAverage(lineup, midfield, 'stamina') * 0.25,
    press:
      statAverage(lineup, fieldPlayers, 'stamina') * 0.45 +
      statAverage(lineup, [...midfield, ...frontThree], 'speed') * 0.3 +
      statAverage(lineup, fieldPlayers, 'defense') * 0.25,
    lowBlock:
      statAverage(lineup, backFour, 'defense') * 0.6 +
      statAverage(lineup, defenseAndMidfield, 'stamina') * 0.25 +
      keeper * 0.15,
    wingPlay:
      statAverage(lineup, wingUnits, 'speed') * 0.35 +
      statAverage(lineup, wingUnits, 'dribble') * 0.3 +
      statAverage(lineup, wingUnits, 'stamina') * 0.2 +
      mean([
        statAverage(lineup, ['RW', 'LW'], 'finishing'),
        statAverage(lineup, ['RB', 'LB'], 'defense'),
      ]) * 0.15,
  };

  const tacticScores = tactics
    .map((tactic): TacticScore => {
      const base = clamp(tacticBase[tactic.id]);
      const bonus = opponent.counterBonus[tactic.id];
      const adjusted = clamp(base + bonus);
      const teamRating = clamp(positionFit * 0.45 + chemistry * 0.25 + adjusted * 0.3);
      const matchProfile = tacticMatchProfile[tactic.id];
      const tacticExecution = (adjusted - 50) * 0.16;
      const effectiveAttack = clamp(attack + matchProfile.attack + tacticExecution);
      const effectiveDefense = clamp(defense + matchProfile.defense + tacticExecution * 0.6);
      const expectedFor = clamp(
        1.25 +
          (effectiveAttack - opponent.defense) / 32 +
          (teamRating - opponent.power) / 42 +
          matchProfile.tempo,
        0.25,
        3.8,
      );
      const expectedAgainst = clamp(
        1.1 +
          (opponent.attack - effectiveDefense) / 32 +
          (opponent.power - teamRating) / 42 +
          matchProfile.tempo,
        0.25,
        3.8,
      );
      const probabilities = outcomeProbabilities(expectedFor, expectedAgainst);
      return {
        ...tactic,
        base,
        bonus,
        adjusted,
        teamRating,
        effectiveAttack,
        effectiveDefense,
        expectedFor,
        expectedAgainst,
        winProbability: probabilities.win,
        drawProbability: probabilities.draw,
        lossProbability: probabilities.loss,
      };
    })
    .sort((a, b) => b.winProbability - a.winProbability);

  const recommended = tacticScores[0];
  const secondBest = tacticScores[1];
  const applied = tacticScores.find((tactic) => tactic.id === chosenTactic) ?? recommended;
  const teamRating = applied.teamRating;
  const effectiveAttack = applied.effectiveAttack;
  const effectiveDefense = applied.effectiveDefense;
  const expectedFor = applied.expectedFor;
  const expectedAgainst = applied.expectedAgainst;

  const weakSlot = slots.reduce((worst, slot) =>
    slotScores[slot.id] < slotScores[worst.id] ? slot : worst,
  );
  const weakSpot = {
    slotId: weakSlot.id,
    player: getPlayer(lineup, weakSlot.id),
    score: slotScores[weakSlot.id],
  };
  const bonusText = recommended.bonus >= 0 ? `+${recommended.bonus}` : `${recommended.bonus}`;
  const reasons = [
    `${opponent.name}전 보정 ${bonusText}: ${recommended.label}이 가장 효율적입니다.`,
    `남북 혼합 라인 ${mixedLines}개, 통합도 ${Math.round(integration)}점으로 연계가 계산됩니다.`,
    weakSpot.score < 72
      ? `${weakSpot.player.name}의 ${weakSlot.label} 적합도 ${weakSpot.score}점이 현재 약점입니다.`
      : `전 포지션 평균 적합도 ${Math.round(positionFit)}점으로 큰 구멍이 없습니다.`,
  ];

  return {
    slotScores,
    positionFit,
    attack,
    defense,
    effectiveAttack,
    effectiveDefense,
    control,
    integration,
    chemistry,
    teamRating,
    southCount,
    northCount,
    mixedLines,
    tactics: tacticScores,
    recommended,
    secondBest,
    applied,
    winProbability: applied.winProbability,
    drawProbability: applied.drawProbability,
    lossProbability: applied.lossProbability,
    expectedFor,
    expectedAgainst,
    reasons,
    weakSpot,
  };
}

export function samplePoisson(lambda: number) {
  const threshold = Math.exp(-lambda);
  let product = 1;
  let count = 0;
  do {
    count += 1;
    product *= Math.random();
  } while (product > threshold && count < 10);
  return Math.max(0, count - 1);
}

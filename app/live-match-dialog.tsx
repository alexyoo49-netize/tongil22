'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { FastForward, Pause, Play, RotateCcw, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  type Opponent,
  type SlotId,
  type TacticId,
  playerById,
  slots,
} from './game-data';

export type MatchPlaybackResult = {
  ours: number;
  theirs: number;
  label: string;
  tone: 'win' | 'draw' | 'loss';
  highlights: string[];
};

export type MatchPlaybackSession = {
  id: number;
  lineup: Record<SlotId, string>;
  opponent: Opponent;
  tacticId: TacticId;
  tacticLabel: string;
  winProbability: number;
  result: MatchPlaybackResult;
};

type TeamFocus = 'ours' | 'theirs' | 'neutral';

type MatchScene = {
  id: string;
  minute: number;
  eyebrow: string;
  commentary: string;
  score: { ours: number; theirs: number };
  ball: { x: number; y: number };
  focus: TeamFocus;
  activeSlot?: SlotId;
  flash?: 'goal' | 'save' | 'fulltime' | 'chance';
  scoreChanged?: boolean;
  goalSide?: 'top' | 'bottom';
};

const scoringStages = {
  ours: [2, 4, 6],
  theirs: [3, 5, 6],
} as const;

const assetBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const tacticRoutes: Record<TacticId, SlotId[]> = {
  counter: ['RCB', 'CAM', 'RW', 'ST'],
  possession: ['LCM', 'RCM', 'CAM', 'ST'],
  press: ['ST', 'CAM', 'RW', 'ST'],
  lowBlock: ['GK', 'LCB', 'LCM', 'ST'],
  wingPlay: ['LB', 'LW', 'CAM', 'ST'],
};

function scoreAtStage(total: number, stage: number, side: keyof typeof scoringStages) {
  if (total <= 0) return 0;
  const assignedStages = scoringStages[side];
  if (total === 1) return stage >= assignedStages[0] ? 1 : 0;
  if (total === 2) {
    return Number(stage >= assignedStages[0]) + Number(stage >= assignedStages[1]);
  }
  if (stage < assignedStages[0]) return 0;
  if (stage < assignedStages[1]) return 1;
  if (stage < assignedStages[2]) return 2;
  return total;
}

function playerName(lineup: Record<SlotId, string>, slot: SlotId) {
  return playerById.get(lineup[slot])?.name ?? slot;
}

function buildScenes(session: MatchPlaybackSession): MatchScene[] {
  const { lineup, opponent, result, tacticId, tacticLabel } = session;
  const route = tacticRoutes[tacticId];
  const striker = playerName(lineup, route.at(-1) ?? 'ST');
  const creator = playerName(lineup, route[1] ?? 'CAM');
  const carrier = playerName(lineup, route[2] ?? 'RW');
  const keeper = playerName(lineup, 'GK');

  const sceneBlueprints: Array<Omit<MatchScene, 'score' | 'commentary'> & { fallback: string }> = [
    {
      id: 'intro', minute: 0, eyebrow: 'MATCH DAY', focus: 'neutral', ball: { x: 50, y: 50 },
      fallback: `${tacticLabel} 전술을 확인한 두 팀이 입장합니다.`,
    },
    {
      id: 'kickoff', minute: 1, eyebrow: 'KICK OFF', focus: 'ours', activeSlot: route[0], ball: { x: 50, y: 50 },
      fallback: `${playerName(lineup, route[0])}의 첫 패스. 통일 XI가 ${tacticLabel} 전술로 경기를 시작합니다.`,
    },
    {
      id: 'first-attack', minute: 24, eyebrow: 'BUILD UP', focus: 'ours', activeSlot: route[2], ball: { x: 66, y: 12 },
      fallback: `${creator}에서 ${carrier}, 그리고 ${striker}에게 연결! 첫 슈팅이 골문을 향합니다.`,
    },
    {
      id: 'opponent-reply', minute: 38, eyebrow: 'COUNTER ATTACK', focus: 'theirs', ball: { x: 31, y: 88 },
      fallback: `${opponent.name}가 ${opponent.style}로 반격합니다. ${keeper}가 골문 앞에서 각을 좁힙니다.`,
    },
    {
      id: 'tactical-move', minute: 56, eyebrow: 'TACTICAL MOVE', focus: 'ours', activeSlot: route[3], ball: { x: 28, y: 10 },
      fallback: `${creator}의 전진 패스가 ${striker}에게 닿습니다. 준비한 ${tacticLabel} 패턴이 다시 열립니다.`,
    },
    {
      id: 'late-pressure', minute: 72, eyebrow: 'LATE PRESSURE', focus: 'theirs', ball: { x: 70, y: 90 },
      fallback: `${opponent.name}의 막판 공세. ${keeper}와 수비진이 마지막 공간을 지킵니다.`,
    },
    {
      id: 'decisive', minute: 86, eyebrow: 'DECISIVE MOMENT', focus: result.tone === 'loss' ? 'theirs' : 'ours', activeSlot: route[3],
      ball: result.tone === 'loss' ? { x: 48, y: 92 } : { x: 52, y: 8 },
      fallback: result.tone === 'win'
        ? `${striker}가 승부를 결정짓는 마지막 공격을 완성합니다!`
        : result.tone === 'draw'
          ? `양 팀이 마지막까지 골문을 두드리지만 균형은 깨지지 않습니다.`
          : `${opponent.name}가 막판 결정적인 기회를 놓치지 않습니다.`,
    },
    {
      id: 'fulltime', minute: 90, eyebrow: 'FULL TIME', focus: 'neutral', ball: { x: 50, y: 50 }, flash: 'fulltime',
      fallback: `경기 종료. 통일 XI ${result.ours}, ${opponent.name} ${result.theirs}. ${result.label}`,
    },
  ];

  let previous = { ours: 0, theirs: 0 };
  return sceneBlueprints.map((blueprint, stage) => {
    const score = {
      ours: scoreAtStage(result.ours, stage, 'ours'),
      theirs: scoreAtStage(result.theirs, stage, 'theirs'),
    };
    const ourGoals = score.ours - previous.ours;
    const theirGoals = score.theirs - previous.theirs;
    const scoreChanged = ourGoals > 0 || theirGoals > 0;
    const goalSide = ourGoals > 0 && theirGoals > 0
      ? result.tone === 'loss' ? 'bottom' : 'top'
      : ourGoals > 0 ? 'top' : theirGoals > 0 ? 'bottom' : undefined;
    const ball = goalSide === 'top'
      ? { x: 50, y: 2 }
      : goalSide === 'bottom'
        ? { x: 50, y: 98 }
        : blueprint.ball;
    let commentary = blueprint.fallback;
    let flash = blueprint.flash;

    if (ourGoals > 0 && theirGoals > 0) {
      commentary = `후반 막판 골 공방! 통일 XI와 ${opponent.name}가 연속 득점을 주고받습니다.`;
      flash = 'goal';
    } else if (ourGoals > 0) {
      commentary = ourGoals > 1
        ? `${striker}가 공격을 이끈 통일 XI, 순식간에 ${ourGoals}골을 몰아칩니다!`
        : `${striker}의 마무리! 준비한 ${tacticLabel} 공격이 골로 이어집니다.`;
      flash = 'goal';
    } else if (theirGoals > 0) {
      commentary = theirGoals > 1
        ? `${opponent.name}가 막판 공세에서 ${theirGoals}골을 연달아 추가합니다.`
        : `${opponent.name}의 ${opponent.style} 공격이 통일 XI의 골문을 엽니다.`;
      flash = 'goal';
    } else if (stage === 2 || stage === 4) {
      commentary = `${striker}의 날카로운 슈팅! ${opponent.name} 골키퍼가 가까스로 막아냅니다.`;
      flash = 'chance';
    } else if (stage === 3 || stage === 5) {
      commentary = `${opponent.name}의 결정적인 슈팅, ${keeper}가 몸을 날려 선방합니다!`;
      flash = 'save';
    }

    previous = score;
    return { ...blueprint, ball, score, commentary, flash, scoreChanged, goalSide };
  });
}

function playerPosition(
  slot: (typeof slots)[number],
  scene: MatchScene,
  index: number,
  side: 'ours' | 'theirs',
) {
  const baseX = side === 'ours' ? slot.x : 100 - slot.x;
  const baseY = side === 'ours' ? 52 + slot.y * 0.43 : 48 - slot.y * 0.43;
  const isOurControl = scene.focus === 'ours';
  const isTheirControl = scene.focus === 'theirs';
  const hasControl = side === 'ours' ? isOurControl : isTheirControl;
  const isActive = side === 'ours'
    ? scene.activeSlot === slot.id && scene.focus === 'ours'
    : scene.focus === 'theirs' && (index === 8 || index === 9);
  const linePull = slot.line === 'attack' ? 0.43 : slot.line === 'midfield' ? 0.24 : slot.line === 'defense' ? 0.13 : 0.05;
  const controlPull = isActive ? 0.78 : hasControl ? linePull : linePull * 0.38;
  const jitter = (((index * 7) + scene.minute) % 5 - 2) * 0.55;
  const x = baseX + (scene.ball.x - baseX) * controlPull + jitter;
  const y = baseY + (scene.ball.y - baseY) * controlPull;
  return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
}

function minuteLabel(minute: number) {
  return minute === 0 ? '00:00' : minute === 90 ? '90:00' : `${String(minute).padStart(2, '0')}:${minute % 2 ? '18' : '42'}`;
}

export function LiveMatchDialog({
  session,
  onCancel,
  onFinish,
  onReplay,
}: {
  session: MatchPlaybackSession;
  onCancel: () => void;
  onFinish: () => void;
  onReplay: () => void;
}) {
  const scenes = useMemo(() => buildScenes(session), [session]);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const fullTimeHeadingRef = useRef<HTMLHeadingElement>(null);
  const scene = scenes[sceneIndex];
  const isFullTime = sceneIndex === scenes.length - 1;
  const progress = (sceneIndex / (scenes.length - 1)) * 100;

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (paused || isFullTime) return;
    const timer = window.setTimeout(
      () => setSceneIndex((current) => Math.min(current + 1, scenes.length - 1)),
      reducedMotion ? 3000 : 2450,
    );
    return () => window.clearTimeout(timer);
  }, [isFullTime, paused, reducedMotion, sceneIndex, scenes.length]);

  useEffect(() => {
    if (!isFullTime) return;
    window.requestAnimationFrame(() => fullTimeHeadingRef.current?.focus());
  }, [isFullTime]);

  const scoreFlash = scene.flash === 'goal';

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (open) return;
        if (isFullTime) onFinish();
        else onCancel();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="live-match-dialog max-w-[calc(100%-0.75rem)] gap-0 overflow-hidden border-0 bg-[#03110d] p-0 text-white shadow-2xl sm:max-w-[1480px]"
      >
        <DialogTitle className="sr-only">통일 XI와 {session.opponent.name}의 라이브 경기</DialogTitle>
        <DialogDescription className="sr-only">
          선택한 선수와 전술을 반영한 경기 하이라이트가 자동 재생됩니다.
        </DialogDescription>

        <div className="live-match-shell">
          <header className="live-scoreboard">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300">Live simulation</p>
              <p className="truncate text-xs font-bold text-white/55">{session.tacticLabel} · 예상 승률 {Math.round(session.winProbability)}%</p>
            </div>

            <div className="scoreboard-center" aria-label={`현재 스코어 통일 XI ${scene.score.ours} 대 ${session.opponent.name} ${scene.score.theirs}`}>
              <span className="score-team"><span aria-hidden="true">🇰🇷</span><strong>통일 XI</strong></span>
              <strong className={`score-digits ${scoreFlash ? 'is-flashing' : ''}`} key={`${scene.id}-${scene.score.ours}-${scene.score.theirs}`}>
                {scene.score.ours}<span>:</span>{scene.score.theirs}
              </strong>
              <span className="score-team is-away"><span aria-hidden="true">{session.opponent.flag}</span><strong>{session.opponent.name}</strong></span>
            </div>

            <div className="flex items-center justify-end gap-1.5">
              {!isFullTime && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="spring-press h-11 w-11 text-white hover:bg-white/10 hover:text-white"
                  aria-label={paused ? '경기 재생' : '경기 일시정지'}
                  onClick={() => setPaused((current) => !current)}
                >
                  {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="spring-press h-11 w-11 text-white hover:bg-white/10 hover:text-white"
                aria-label={isFullTime ? '경기 결과 닫기' : '경기 중계 취소하고 닫기'}
                onClick={isFullTime ? onFinish : onCancel}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          </header>

          <div className="match-progress" aria-hidden="true">
            <div style={{ '--match-progress': progress / 100 } as CSSProperties} />
          </div>

          <div className={`live-match-stage ${isFullTime ? 'is-fulltime' : ''}`}>
            <section className="live-pitch-frame" aria-label="경기 장면 시각화">
              <div className="live-pitch" aria-hidden="true">
                <span className="live-halfway" />
                <span className="live-center-circle" />
                <span className="live-box live-box-top" />
                <span className="live-box live-box-bottom" />
                <span className="live-goal live-goal-top" />
                <span className="live-goal live-goal-bottom" />

                {slots.map((slot, index) => {
                  const player = playerById.get(session.lineup[slot.id]);
                  if (!player) return null;
                  const position = playerPosition(slot, scene, index, 'ours');
                  const isActive = scene.focus === 'ours' && scene.activeSlot === slot.id;
                  return (
                    <span
                      key={slot.id}
                      className={`live-player ours ${player.nation} ${isActive ? 'is-active' : ''}`}
                      style={{
                        '--move-x': `${position.x - 50}cqw`,
                        '--move-y': `${position.y - 50}cqh`,
                        '--move-delay': `${index * 15}ms`,
                      } as CSSProperties}
                    >
                      <img src={`${assetBasePath}/players/card-${player.card}.webp`} alt="" />
                      <strong>{player.name}</strong>
                    </span>
                  );
                })}

                {slots.map((slot, index) => {
                  const position = playerPosition(slot, scene, index, 'theirs');
                  const isActive = scene.focus === 'theirs' && (index === 8 || index === 9);
                  return (
                    <span
                      key={`opponent-${slot.id}`}
                      className={`live-player opponent ${isActive ? 'is-active' : ''}`}
                      style={{
                        '--move-x': `${position.x - 50}cqw`,
                        '--move-y': `${position.y - 50}cqh`,
                        '--opponent-accent': session.opponent.accent,
                        '--move-delay': `${index * 15}ms`,
                      } as CSSProperties}
                    >
                      <span className="opponent-shirt">{index + 1}</span>
                      <strong>{session.opponent.name} {slot.label}</strong>
                    </span>
                  );
                })}

                <span
                  className={`match-ball ${scene.goalSide ? `is-goal-${scene.goalSide}` : ''}`}
                  style={{
                    '--ball-x': `${scene.ball.x - 50}cqw`,
                    '--ball-y': scene.goalSide === 'top'
                      ? 'calc(-50cqh + 11px)'
                      : scene.goalSide === 'bottom'
                        ? 'calc(50cqh - 11px)'
                        : `${scene.ball.y - 50}cqh`,
                  } as CSSProperties}
                >
                  ⚽
                </span>

                {scene.flash && scene.flash !== 'fulltime' && (
                  <span className={`match-flash ${scene.flash}`} key={`${scene.id}-${scene.flash}`}>
                    {scene.flash === 'goal' ? 'GOAL!' : scene.flash === 'save' ? 'SUPER SAVE' : 'BIG CHANCE'}
                  </span>
                )}
              </div>

              <div className="match-commentary" aria-live="polite" aria-atomic="true">
                <div>
                  <span className="match-clock">{minuteLabel(scene.minute)}</span>
                  <span className="match-event-label">{scene.eyebrow}</span>
                </div>
                <p>
                  {scene.commentary}
                  {(scene.scoreChanged || isFullTime) && (
                    <span className="sr-only"> 현재 스코어 통일 XI {scene.score.ours} 대 {session.opponent.name} {scene.score.theirs}.</span>
                  )}
                </p>
              </div>
            </section>

            <aside className="match-side-panel">
              {isFullTime ? (
                <div className="fulltime-panel">
                  <h2 ref={fullTimeHeadingRef} tabIndex={-1} className="sr-only">경기 종료 결과</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">Full time report</p>
                  <div className="my-4 flex items-end justify-center gap-4">
                    <span className="text-center text-xs font-black"><span className="mb-1 block text-2xl">🇰🇷</span>통일 XI</span>
                    <strong className="text-5xl font-black tracking-[-0.08em]">{session.result.ours}:{session.result.theirs}</strong>
                    <span className="text-center text-xs font-black"><span className="mb-1 block text-2xl">{session.opponent.flag}</span>{session.opponent.name}</span>
                  </div>
                  <p className={`result-banner ${session.result.tone}`}>{session.result.label}</p>
                  <ul className="mt-4 space-y-2">
                    {session.result.highlights.map((highlight) => (
                      <li key={highlight} className="rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2 text-[11px] leading-relaxed text-white/70">
                        {highlight}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                    <Button onClick={onReplay} className="spring-press h-11 bg-amber-300 font-black text-[#13251f] hover:bg-amber-200">
                      <RotateCcw aria-hidden="true" /> 같은 전술로 재경기
                    </Button>
                    <Button onClick={onFinish} variant="outline" className="spring-press h-11 border-white/20 bg-transparent font-black text-white hover:bg-white/10 hover:text-white">
                      선수·전술로 돌아가기
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Tactical feed</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight">선택이 경기로 이어집니다</h2>
                  <p className="mt-2 text-xs leading-relaxed text-white/50">
                    선수들이 {session.tacticLabel} 움직임으로 공간을 만들고 있습니다. 경기 장면은 최종 결과와 정확히 맞춰 재생됩니다.
                  </p>
                  <div className="mt-5 space-y-2">
                    {scenes.slice(0, -1).map((item, index) => (
                      <div key={item.id} className={`timeline-row ${index === sceneIndex ? 'is-current' : ''} ${index < sceneIndex ? 'is-done' : ''}`}>
                        <span>{String(item.minute).padStart(2, '0')}′</span>
                        <strong>{item.eyebrow}</strong>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setPaused(false); setSceneIndex(scenes.length - 1); }}
                    className="spring-press mt-5 h-11 w-full border-white/20 bg-transparent font-black text-white hover:bg-white/10 hover:text-white"
                  >
                    <FastForward aria-hidden="true" /> 결과로 건너뛰기
                  </Button>
                </div>
              )}
            </aside>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

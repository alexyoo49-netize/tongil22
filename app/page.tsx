'use client';

import { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  type GoalkeeperStats,
  type Nation,
  type Opponent,
  type OutfieldStats,
  type SlotId,
  type TacticId,
  gkStatLabels,
  opponents,
  playerById,
  players,
  powerLineup,
  slots,
  statLabels,
  unitedLineup,
} from './game-data';
import { analyzeLineup, playerOverall, samplePoisson } from './game-engine';
import {
  LiveMatchDialog,
  type MatchPlaybackResult,
  type MatchPlaybackSession,
} from './live-match-dialog';

type Filter = 'all' | Nation;
type MatchResult = MatchPlaybackResult;

const nationLabel: Record<Nation, string> = { south: '남한', north: '북한' };

function scoreTone(score: number) {
  if (score >= 80) return 'fit-good';
  if (score >= 65) return 'fit-ok';
  return 'fit-bad';
}

function OpponentSelection({
  selected,
  onSelect,
  onContinue,
}: {
  selected: Opponent | null;
  onSelect: (opponent: Opponent) => void;
  onContinue: () => void;
}) {
  return (
    <main className="opponent-screen min-h-screen text-white">
      <div className="mx-auto max-w-[1400px] px-4 py-7 sm:px-6 sm:py-10">
        <header className="mb-7 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-full border border-white/15 bg-white/10">
              <Swords className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">
                One Korea · One XI
              </p>
              <p className="font-black">통일 대표팀 메이커</p>
            </div>
          </div>
          <Badge className="border-white/10 bg-white/10 text-white">WORLD 7</Badge>
        </header>

        <section className="mb-7 max-w-3xl">
          <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-amber-300">
            <span className="grid size-6 place-items-center rounded-full bg-amber-300 text-[11px] text-[#10251f]">1</span>
            첫 번째 결정
          </p>
          <h1 className="text-balance text-3xl font-black tracking-[-0.045em] sm:text-5xl">
            어느 강호와 먼저 맞붙을까요?
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emerald-50/65 sm:text-base">
            상대의 축구 스타일을 먼저 읽고, 그 약점을 공략할 선수 11명과 전술을 설계하세요.
            선택에 따라 승률이 실시간으로 바뀝니다.
          </p>
        </section>

        <section aria-label="상대 국가 7개" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {opponents.map((opponent, index) => {
            const isSelected = selected?.id === opponent.id;
            return (
              <button
                type="button"
                key={opponent.id}
                aria-pressed={isSelected}
                onClick={() => onSelect(opponent)}
                className={`country-card group ${isSelected ? 'is-selected' : ''} ${index === opponents.length - 1 ? 'lg:col-start-2' : ''}`}
                style={isSelected ? { borderColor: opponent.accent } : undefined}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-4xl leading-none sm:text-5xl" aria-hidden="true">{opponent.flag}</span>
                  <span className="rounded-full border border-white/10 bg-black/15 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white/55">
                    전력 {opponent.power}
                  </span>
                </div>
                <div className="mt-5 text-left">
                  <p className="text-[10px] font-bold text-white/45">{opponent.nickname}</p>
                  <h2 className="mt-0.5 text-xl font-black tracking-tight sm:text-2xl">{opponent.name}</h2>
                  <p className="mt-1 text-xs font-bold text-emerald-200/80">{opponent.style}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] font-bold text-white/45">
                  <span>공격 {opponent.attack}</span>
                  <span>수비 {opponent.defense}</span>
                  {isSelected && <Check className="size-4 text-amber-300" aria-hidden="true" />}
                </div>
              </button>
            );
          })}
        </section>

        <section className="mt-5 grid gap-3 rounded-[24px] border border-white/10 bg-white/[0.055] p-4 backdrop-blur sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
          {selected ? (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">{selected.flag}</span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Scouting brief</p>
                  <h3 className="font-black">{selected.name}의 약점</h3>
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{selected.weakPoint}</p>
            </div>
          ) : (
            <div>
              <p className="font-black">상대 국가를 하나 선택하세요.</p>
              <p className="mt-1 text-sm text-white/50">선택하면 맞춤 스카우팅 정보가 열립니다.</p>
            </div>
          )}
          <Button
            disabled={!selected}
            onClick={onContinue}
            className="h-12 min-w-52 bg-amber-300 px-5 font-black text-[#12231e] hover:bg-amber-200"
          >
            이 상대와 경기 준비
            <ArrowRight aria-hidden="true" />
          </Button>
        </section>

        <p className="mt-4 text-center text-[10px] leading-relaxed text-white/35">
          국가별 수치는 실제 순위가 아닌 게임 밸런스를 위한 가상 전력 프로필입니다.
        </p>
      </div>
    </main>
  );
}

export default function Home() {
  const [phase, setPhase] = useState<'opponent' | 'builder'>('opponent');
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [lineup, setLineup] = useState<Record<SlotId, string>>({ ...unitedLineup });
  const [filter, setFilter] = useState<Filter>('all');
  const [activeSlot, setActiveSlot] = useState<SlotId | null>(null);
  const [pendingPlayerId, setPendingPlayerId] = useState<string | null>(null);
  const [focusedPlayerId, setFocusedPlayerId] = useState('son-heungmin');
  const [chosenTactic, setChosenTactic] = useState<TacticId | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchSession, setMatchSession] = useState<MatchPlaybackSession | null>(null);
  const [notice, setNotice] = useState('교체할 포지션이나 선수 카드를 선택하세요.');
  const matchSessionCounter = useRef(0);
  const matchLaunchLocked = useRef(false);

  const selectedOpponent = opponents.find((opponent) => opponent.id === opponentId) ?? null;
  const autoAnalysis = useMemo(
    () => (selectedOpponent ? analyzeLineup(lineup, selectedOpponent, null) : null),
    [lineup, selectedOpponent],
  );
  const analysis = useMemo(
    () => (selectedOpponent ? analyzeLineup(lineup, selectedOpponent, chosenTactic) : null),
    [lineup, selectedOpponent, chosenTactic],
  );

  const focusedPlayer = playerById.get(focusedPlayerId) ?? players[0];
  const focusedSlot = slots.find((slot) => lineup[slot.id] === focusedPlayer.id);
  const focusedStats = focusedPlayer.gkStats
    ? Object.entries(focusedPlayer.gkStats).map(([key, value]) => ({
        label: gkStatLabels[key as keyof GoalkeeperStats], value,
      }))
    : Object.entries(focusedPlayer.stats ?? {}).map(([key, value]) => ({
        label: statLabels[key as keyof OutfieldStats], value,
      }));
  const filteredPlayers = players.filter((player) => filter === 'all' || player.nation === filter);

  function clearMatch() {
    matchLaunchLocked.current = false;
    setMatchSession(null);
    setMatchResult(null);
  }

  function chooseOpponent(opponent: Opponent) {
    setOpponentId(opponent.id);
    setChosenTactic(null);
    clearMatch();
  }

  function startBuilder() {
    if (!selectedOpponent) return;
    setActiveSlot(null);
    setPendingPlayerId(null);
    clearMatch();
    setPhase('builder');
    setNotice(`${selectedOpponent.name}의 ${selectedOpponent.style}에 맞설 11명을 구성하세요.`);
  }

  function returnToOpponent() {
    setActiveSlot(null);
    setPendingPlayerId(null);
    clearMatch();
    setNotice('교체할 포지션이나 선수 카드를 선택하세요.');
    setPhase('opponent');
  }

  function resetInteraction(message: string) {
    setActiveSlot(null);
    setPendingPlayerId(null);
    clearMatch();
    setNotice(message);
  }

  function applyPreset(preset: 'united' | 'power') {
    setLineup({ ...(preset === 'united' ? unitedLineup : powerLineup) });
    setChosenTactic(null);
    resetInteraction(preset === 'united' ? '남북 6:5 통합 조합을 불러왔습니다.' : '포지션 전력을 우선한 조합을 불러왔습니다.');
  }

  function swapPlayerIntoSlot(playerId: string, targetSlotId: SlotId) {
    const player = playerById.get(playerId);
    const targetSlot = slots.find((slot) => slot.id === targetSlotId);
    if (!player || !targetSlot) return;

    const playerIsKeeper = player.roles.includes('GK');
    const slotIsKeeper = targetSlot.role === 'GK';
    if (playerIsKeeper !== slotIsKeeper) {
      setNotice(slotIsKeeper ? 'GK 자리에는 골키퍼 카드만 배치할 수 있습니다.' : '골키퍼는 필드 포지션에 배치할 수 없습니다.');
      return;
    }

    const sourceSlot = slots.find((slot) => lineup[slot.id] === playerId);
    const displacedPlayer = lineup[targetSlotId];
    setLineup((current) => {
      const next = { ...current, [targetSlotId]: playerId };
      if (sourceSlot && sourceSlot.id !== targetSlotId) next[sourceSlot.id] = displacedPlayer;
      return next;
    });
    setFocusedPlayerId(playerId);
    setChosenTactic(null);
    resetInteraction(`${player.name} 선수를 ${targetSlot.label}에 배치했습니다. 추천 전술과 승률이 갱신됐습니다.`);
  }

  function handleRosterPlayer(playerId: string) {
    setFocusedPlayerId(playerId);
    if (activeSlot) {
      swapPlayerIntoSlot(playerId, activeSlot);
      return;
    }
    setPendingPlayerId(playerId);
    const player = playerById.get(playerId);
    setNotice(`${player?.name ?? '선수'}를 배치할 경기장 포지션을 선택하세요.`);
  }

  function handleSlot(slotId: SlotId) {
    if (pendingPlayerId) {
      swapPlayerIntoSlot(pendingPlayerId, slotId);
      return;
    }
    setActiveSlot(slotId);
    setFocusedPlayerId(lineup[slotId]);
    const slot = slots.find((item) => item.id === slotId);
    setNotice(`${slot?.label ?? slotId} 자리와 교체할 후보 카드를 선택하세요.`);
  }

  function selectTactic(tacticId: TacticId | null) {
    setChosenTactic(tacticId);
    clearMatch();
    setNotice(tacticId ? '선택 전술을 반영해 승률을 다시 계산했습니다.' : '상대와 선수 조합에 맞는 추천 전술을 자동 적용했습니다.');
  }

  function simulateMatch() {
    if (!analysis || !selectedOpponent || matchLaunchLocked.current) return;
    matchLaunchLocked.current = true;
    const ours = samplePoisson(analysis.expectedFor);
    const theirs = samplePoisson(analysis.expectedAgainst);
    const tone: MatchResult['tone'] = ours > theirs ? 'win' : ours === theirs ? 'draw' : 'loss';
    const label = tone === 'win' ? '전술 적중 — 승리!' : tone === 'draw' ? '팽팽한 무승부' : '전술 재정비가 필요합니다';
    const attackPlayers = ['ST', 'RW', 'LW', 'CAM']
      .map((slotId) => playerById.get(lineup[slotId as SlotId]))
      .filter((player): player is NonNullable<typeof player> => Boolean(player))
      .sort((a, b) => (b.stats?.finishing ?? 0) - (a.stats?.finishing ?? 0));
    const result: MatchResult = {
      ours,
      theirs,
      label,
      tone,
      highlights: [
        `${analysis.applied.label} 전술 적합도 ${Math.round(analysis.applied.adjusted)}점이 경기력에 반영됐습니다.`,
        `${attackPlayers[0]?.name ?? '공격진'}의 결정력이 주 공격 루트를 이끌었습니다.`,
        analysis.mixedLines >= 2
          ? `남북 혼합 ${analysis.mixedLines}개 라인에서 연계 보너스를 얻었습니다.`
          : `${analysis.weakSpot.player.name}의 ${analysis.weakSpot.score}점 포지션 적합도를 보완해 보세요.`,
      ],
    };
    setMatchResult(null);
    setMatchSession({
      id: ++matchSessionCounter.current,
      lineup: { ...lineup },
      opponent: selectedOpponent,
      tacticId: analysis.applied.id,
      tacticLabel: analysis.applied.label,
      winProbability: analysis.winProbability,
      result,
    });
    window.setTimeout(() => { matchLaunchLocked.current = false; }, 350);
  }

  function closeMatchPlayback() {
    matchLaunchLocked.current = false;
    setMatchSession(null);
  }

  function finishMatchPlayback() {
    if (matchSession) setMatchResult(matchSession.result);
    closeMatchPlayback();
  }

  function replayMatch() {
    matchLaunchLocked.current = false;
    simulateMatch();
  }

  if (phase === 'opponent') {
    return (
      <OpponentSelection
        selected={selectedOpponent}
        onSelect={chooseOpponent}
        onContinue={startBuilder}
      />
    );
  }

  if (!selectedOpponent || !analysis || !autoAnalysis) return null;

  const recommendedGain = autoAnalysis.winProbability - analysis.winProbability;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#071a16]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1580px] items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10">
              <Users className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300">One Korea · One XI</p>
              <h1 className="truncate text-sm font-black tracking-tight sm:text-base">통일 대표팀 메이커</h1>
            </div>
          </div>

          <div className="hidden items-center gap-1 text-[10px] font-black sm:flex">
            <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-emerald-200">1 상대 선택 ✓</span>
            <ArrowRight className="size-3 text-white/25" aria-hidden="true" />
            <span className="rounded-full bg-amber-300 px-3 py-1.5 text-[#17231f]">2 선수·전술</span>
            <ArrowRight className="size-3 text-white/25" aria-hidden="true" />
            <span className="rounded-full px-3 py-1.5 text-white/45">3 경기</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={returnToOpponent}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-black transition hover:bg-white/15"
            >
              <span className="text-base" aria-hidden="true">{selectedOpponent.flag}</span>
              <span className="hidden sm:inline">vs {selectedOpponent.name}</span>
              <span className="text-white/45">변경</span>
            </button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="통합 추천 조합으로 초기화"
              onClick={() => applyPreset('united')}
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <RotateCcw aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1580px] gap-4 px-4 py-4 sm:px-6 xl:grid-cols-[300px_minmax(420px,1fr)_340px]">
        <aside className="order-1 rounded-[22px] border bg-card shadow-sm xl:sticky xl:top-20 xl:max-h-[calc(100vh-96px)] xl:overflow-hidden">
          <div className="border-b p-4">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="eyebrow">Step 2 · 선수 선택</p>
                <h2 className="section-title">22인 선수 풀</h2>
              </div>
              <span className="text-xs font-black text-muted-foreground">11 / 11</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => applyPreset('united')} className="text-xs font-black">
                <Users aria-hidden="true" /> 통합 우선
              </Button>
              <Button variant="outline" size="sm" onClick={() => applyPreset('power')} className="text-xs font-black">
                <Zap aria-hidden="true" /> 전력 우선
              </Button>
            </div>
            <div className="mt-3 flex rounded-xl bg-muted p-1" aria-label="선수 국적 필터">
              {([
                ['all', '전체'],
                ['south', '남한'],
                ['north', '북한'],
              ] as Array<[Filter, string]>).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-black transition ${filter === value ? 'bg-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="roster-scroll grid grid-cols-3 gap-2 p-3 sm:grid-cols-4 xl:grid-cols-2">
            {filteredPlayers.map((player) => {
              const assignedSlot = slots.find((slot) => lineup[slot.id] === player.id);
              const isPending = pendingPlayerId === player.id;
              const activeSlotData = slots.find((slot) => slot.id === activeSlot);
              const incompatible = Boolean(
                activeSlotData && (activeSlotData.role === 'GK') !== player.roles.includes('GK'),
              );
              return (
                <button
                  type="button"
                  key={player.id}
                  disabled={incompatible}
                  aria-pressed={isPending}
                  onClick={() => handleRosterPlayer(player.id)}
                  className={`roster-card group ${assignedSlot ? 'is-selected' : ''} ${isPending ? 'is-pending' : ''}`}
                >
                  <div className="relative">
                    <img
                      src={`/players/card-${player.card}.webp`}
                      alt={`${player.name} 선수 카드`}
                      width={300}
                      height={450}
                      loading="lazy"
                      className="mx-auto aspect-[2/3] w-full max-w-[92px] object-contain transition group-hover:scale-[1.03]"
                    />
                    <span className="absolute left-0 top-0 rounded-full bg-[#071a16] px-1.5 py-1 text-[9px] font-black text-white shadow">
                      {playerOverall(player)}
                    </span>
                    {assignedSlot && (
                      <span className="absolute right-0 top-0 grid size-5 place-items-center rounded-full bg-emerald-600 text-white shadow" title={`${assignedSlot.label} 배치 중`}>
                        <Check className="size-3" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-1 text-left">
                    <strong className="truncate text-[11px]">{player.name}</strong>
                    <span className={`nation-mini ${player.nation}`} aria-label={nationLabel[player.nation]}>
                      {player.nation === 'south' ? '남' : '북'}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-[9px] font-bold text-muted-foreground">
                    <span>{player.sourcePosition}</span>
                    <span>{assignedSlot?.label ?? '후보'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="order-2 min-w-0">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">4-2-3-1 · Starting XI</p>
              <h2 className="section-title">{selectedOpponent.name} 맞춤 라인업</h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-rose-500/20 bg-rose-50 text-rose-700">남한 {analysis.southCount}</Badge>
              <Badge variant="outline" className="border-sky-500/20 bg-sky-50 text-sky-700">북한 {analysis.northCount}</Badge>
              <Badge variant="outline" className="border-emerald-600/20 bg-emerald-50 text-emerald-800">통합 {Math.round(analysis.integration)}</Badge>
            </div>
          </div>

          <div className="mb-3 flex min-h-10 items-center gap-2 rounded-xl border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950" aria-live="polite">
            <Target className="size-4 shrink-0 text-amber-700" aria-hidden="true" />
            <span>{notice}</span>
          </div>

          <div className="pitch-shell">
            <div className="pitch" aria-label="4-2-3-1 포메이션 경기장">
              <div className="pitch-half" />
              <div className="pitch-circle" />
              <div className="pitch-box pitch-box-top" />
              <div className="pitch-box pitch-box-bottom" />
              {slots.map((slot) => {
                const player = playerById.get(lineup[slot.id]);
                if (!player) return null;
                const fit = analysis.slotScores[slot.id];
                return (
                  <button
                    type="button"
                    key={slot.id}
                    onClick={() => handleSlot(slot.id)}
                    className={`player-token ${scoreTone(fit)} ${activeSlot === slot.id ? 'is-active' : ''}`}
                    style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                    aria-label={`${slot.label} ${player.name}, ${nationLabel[player.nation]}, 적합도 ${fit}점`}
                  >
                    <span className={`player-role ${player.nation}`}>{slot.label}</span>
                    <span className="fit-score">{fit}</span>
                    <img src={`/players/card-${player.card}.webp`} width={300} height={450} alt="" aria-hidden="true" />
                    <strong>{player.name}</strong>
                  </button>
                );
              })}
            </div>
          </div>

          <section className="mt-4 grid gap-3 rounded-[22px] border bg-card p-3 shadow-sm sm:grid-cols-[96px_1fr] sm:p-4" aria-label="선택 선수 능력치">
            <div className="flex items-center gap-3 sm:block">
              <img
                src={`/players/card-${focusedPlayer.card}.webp`}
                alt={`${focusedPlayer.name} 선수 카드`}
                width={300}
                height={450}
                className="h-28 w-[74px] object-contain sm:mx-auto sm:h-auto sm:w-full"
              />
              <div className="sm:mt-1 sm:text-center">
                <p className="text-sm font-black">{focusedPlayer.name}</p>
                <p className="text-[10px] font-bold text-muted-foreground">
                  {nationLabel[focusedPlayer.nation]} · {focusedSlot?.label ?? '후보'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {focusedStats.map((stat) => (
                <div key={stat.label}>
                  <div className="mb-1 flex items-center justify-between text-[10px] font-bold">
                    <span className="text-muted-foreground">{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${stat.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>

        <aside className="order-3 space-y-3 xl:sticky xl:top-20 xl:max-h-[calc(100vh-96px)] xl:overflow-y-auto xl:pr-1">
          <section className="rounded-[22px] border bg-[#0c211c] p-4 text-white shadow-xl shadow-emerald-950/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow text-emerald-300">Live win chance</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <strong className="text-4xl font-black tracking-[-0.05em]">{Math.round(analysis.winProbability)}%</strong>
                  <span className="text-xs font-bold text-emerald-100/55">vs {selectedOpponent.name}</span>
                </div>
              </div>
              <div className="grid size-10 place-items-center rounded-full bg-amber-300 text-[#14221e]">
                <Trophy className="size-5" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                ['공격', analysis.effectiveAttack],
                ['수비', analysis.effectiveDefense],
                ['조직', analysis.chemistry],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
                  <span className="block text-[9px] font-black text-emerald-100/50">{label}</span>
                  <strong className="mt-1 block text-lg font-black">{Math.round(value as number)}</strong>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 text-[10px] font-black">
              <div className="flex overflow-hidden rounded-full bg-white/10">
                <span className="bg-emerald-400 py-1 text-center text-[#10231d]" style={{ width: `${analysis.winProbability}%` }}>승</span>
                <span className="bg-amber-300 py-1 text-center text-[#30260b]" style={{ width: `${analysis.drawProbability}%` }}>무</span>
                <span className="bg-rose-400 py-1 text-center text-[#321015]" style={{ width: `${analysis.lossProbability}%` }}>패</span>
              </div>
              <div className="flex justify-between text-white/45">
                <span>승 {Math.round(analysis.winProbability)}%</span>
                <span>무 {Math.round(analysis.drawProbability)}%</span>
                <span>패 {Math.round(analysis.lossProbability)}%</span>
              </div>
            </div>
          </section>

          <section className="rounded-[22px] border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="eyebrow">Step 2 · 전술 선택</p>
                <h2 className="section-title">상대 맞춤 전략</h2>
              </div>
              <Sparkles className="mt-1 size-5 text-amber-500" aria-hidden="true" />
            </div>

            <button
              type="button"
              aria-pressed={chosenTactic === null}
              onClick={() => selectTactic(null)}
              className={`mt-3 flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${chosenTactic === null ? 'border-emerald-500 bg-emerald-50' : 'hover:bg-muted/60'}`}
            >
              <span>
                <strong className="block text-xs">자동 추천 적용</strong>
                <span className="text-[10px] text-muted-foreground">{analysis.recommended.label}</span>
              </span>
              <Badge className="bg-emerald-700 text-white">BEST</Badge>
            </button>

            <div className="mt-2 space-y-2">
              {analysis.tactics.map((tactic) => {
                const isChosen = chosenTactic === tactic.id;
                const isRecommended = analysis.recommended.id === tactic.id;
                return (
                  <button
                    type="button"
                    key={tactic.id}
                    aria-label={`${tactic.label}, 예상 승률 ${Math.round(tactic.winProbability)}%, 전술 적합도 ${Math.round(tactic.adjusted)}점, 상대 보정 ${tactic.bonus >= 0 ? '+' : ''}${tactic.bonus}`}
                    aria-pressed={isChosen}
                    onClick={() => selectTactic(tactic.id)}
                    className={`tactic-row ${isChosen ? 'is-chosen' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`grid size-6 place-items-center rounded-full text-[9px] font-black ${isRecommended ? 'bg-amber-300 text-amber-950' : 'bg-muted text-muted-foreground'}`}>
                          {tactic.short.slice(0, 1)}
                        </span>
                        <span>
                          <strong className="block text-xs">{tactic.label}</strong>
                          <span className="text-[9px] text-muted-foreground">전술 {Math.round(tactic.adjusted)} · 상대 {tactic.bonus >= 0 ? '+' : ''}{tactic.bonus}</span>
                        </span>
                      </div>
                      <strong className="text-sm tabular-nums">{Math.round(tactic.winProbability)}%</strong>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${isRecommended ? 'bg-amber-400' : 'bg-emerald-600'}`} style={{ width: `${tactic.winProbability}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>

            {chosenTactic && recommendedGain > 0.4 && (
              <button
                type="button"
                onClick={() => selectTactic(null)}
                className="mt-3 w-full rounded-xl bg-amber-50 px-3 py-2 text-left text-[10px] font-bold text-amber-900"
              >
                추천 전술로 바꾸면 승률이 약 +{recommendedGain.toFixed(1)}%p 올라갑니다.
              </button>
            )}
          </section>

          <section className="rounded-[22px] border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="eyebrow">Scouting report</p>
                <h2 className="text-base font-black">{selectedOpponent.flag} {selectedOpponent.style}</h2>
              </div>
              <Shield className="size-5 text-emerald-700" aria-hidden="true" />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selectedOpponent.strengths.map((strength) => (
                <Badge key={strength} variant="secondary">{strength}</Badge>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{selectedOpponent.weakPoint}</p>
            <ul className="mt-3 space-y-2 border-t pt-3">
              {analysis.reasons.map((reason) => (
                <li key={reason} className="flex gap-2 text-[11px] leading-relaxed">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[22px] border border-amber-300/60 bg-amber-50 p-4 shadow-sm" aria-live="polite">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="eyebrow text-amber-700">Step 3 · Match</p>
                <h2 className="text-base font-black">경기 시작</h2>
              </div>
              <Swords className="size-5 text-amber-700" aria-hidden="true" />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-amber-950/65">
              선택한 11명과 <strong>{analysis.applied.label}</strong> 전술로 {selectedOpponent.name}에 도전합니다.
            </p>
            <Button onClick={simulateMatch} className="mt-3 h-11 w-full bg-[#123d31] font-black text-white hover:bg-[#0b2e25]">
              {matchResult ? '다시 경기하기 · 라이브' : '킥오프 · 라이브 경기 보기'}
              <ArrowRight aria-hidden="true" />
            </Button>

            {matchResult && (
              <div className={`match-result mt-3 ${matchResult.tone}`}>
                <p className="text-[10px] font-black uppercase tracking-wider opacity-60">Full time</p>
                <div className="my-2 flex items-center justify-center gap-3">
                  <span className="text-xs font-black">통일 XI</span>
                  <strong className="text-3xl font-black tracking-tight">{matchResult.ours} : {matchResult.theirs}</strong>
                  <span className="text-xs font-black">{selectedOpponent.name}</span>
                </div>
                <p className="text-center text-sm font-black">{matchResult.label}</p>
                <ul className="mt-3 space-y-1.5 border-t border-current/10 pt-3">
                  {matchResult.highlights.map((highlight) => (
                    <li key={highlight} className="text-[10px] leading-relaxed opacity-75">• {highlight}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <p className="px-2 pb-2 text-center text-[9px] leading-relaxed text-muted-foreground">
            선수 능력치는 PPT 레이더 이미지를 0–100으로 근사해 게임용으로 환산했습니다.
          </p>
        </aside>
      </section>

      <button
        type="button"
        onClick={returnToOpponent}
        className="fixed bottom-4 left-4 z-40 hidden items-center gap-1 rounded-full border bg-white/90 px-3 py-2 text-[10px] font-black shadow-lg backdrop-blur sm:flex xl:hidden"
      >
        <ArrowLeft className="size-3" aria-hidden="true" /> 상대 변경
      </button>

      {matchSession && (
        <LiveMatchDialog
          key={matchSession.id}
          session={matchSession}
          onCancel={closeMatchPlayback}
          onFinish={finishMatchPlayback}
          onReplay={replayMatch}
        />
      )}
    </main>
  );
}

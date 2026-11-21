import React, { useState } from 'react';
import { Award } from 'lucide-react';
import { ACHIEVEMENTS } from '../game/achievements';
import { ITEM_CATALOG } from '../game/quests';
import { ItemId, QuestState } from '../game/types';

interface QuestJournalModalProps {
  quests: QuestState[];
  unlockedAchievements: string[];
  onClose: () => void;
}

export const QuestJournalModal: React.FC<QuestJournalModalProps> = ({
  quests,
  unlockedAchievements,
  onClose,
}) => {
  const [tab, setTab] = useState<'main' | 'side' | 'completed' | 'achievements'>('main');

  const mainQuests = quests.filter((q) => q.category === 'main' && q.status !== 'completed');
  const sideQuests = quests.filter((q) => q.category === 'side' && q.status !== 'completed');
  const completedQuests = quests.filter((q) => q.status === 'completed');

  const list = tab === 'main' ? mainQuests : tab === 'side' ? sideQuests : completedQuests;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Quest Journal"
    >
      <div className="w-full max-w-2xl bg-[#121b17] border border-[#455e50] shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 bg-[#18241f] border-b border-[#2b3b33]">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-xl font-bold text-[#f3efe2]">Quest Journal</h2>
            <div className="flex flex-wrap items-center gap-1 bg-[#0e1512] p-1 border border-[#2a3b32]">
              <button
                type="button"
                onClick={() => setTab('main')}
                className={`px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                  tab === 'main' ? 'bg-[#2a453b] text-[#f4efe2]' : 'text-[#9ab0a2] hover:text-white'
                }`}
              >
                Main ({mainQuests.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('side')}
                className={`px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                  tab === 'side' ? 'bg-[#2a453b] text-[#f4efe2]' : 'text-[#9ab0a2] hover:text-white'
                }`}
              >
                Side ({sideQuests.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('completed')}
                className={`px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                  tab === 'completed'
                    ? 'bg-[#2a453b] text-[#f4efe2]'
                    : 'text-[#9ab0a2] hover:text-white'
                }`}
              >
                Done ({completedQuests.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('achievements')}
                className={`px-2.5 py-1 text-xs font-semibold cursor-pointer inline-flex items-center gap-1 ${
                  tab === 'achievements'
                    ? 'bg-[#4f3d17] text-[#fde047]'
                    : 'text-[#9ab0a2] hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>
                  Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
                </span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-[#d4ded7] hover:text-white bg-[#1f2e28] border border-[#3d5448] cursor-pointer"
          >
            Close [J]
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3">
          {tab === 'achievements' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ACHIEVEMENTS.map((ach) => {
                const unlocked = unlockedAchievements.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`p-3.5 border flex items-start gap-3 ${
                      unlocked
                        ? 'bg-[#1a261f] border-[#d4a13b]'
                        : 'bg-[#101714] border-[#223029] opacity-65'
                    }`}
                  >
                    <Award
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        unlocked ? 'text-[#fde047]' : 'text-[#5b7064]'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-sm font-bold text-[#f4efe2]">
                          {ach.title}
                        </h3>
                        <span
                          className={`text-[10px] font-mono-num font-bold uppercase ${
                            unlocked ? 'text-[#fde047]' : 'text-[#73887c]'
                          }`}
                        >
                          {unlocked ? 'UNLOCKED' : 'LOCKED'}
                        </span>
                      </div>
                      <p className="text-xs text-[#b8c7be] mt-0.5 leading-snug">
                        {ach.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : list.length === 0 ? (
            <p className="text-sm text-[#95ab9d] py-8 text-center">
              {tab === 'completed'
                ? 'No completed missions yet. Speak with survivors in The Last Haven to get started!'
                : 'All missions in this category are complete.'}
            </p>
          ) : (
            list.map((q) => (
              <div
                key={q.id}
                className={`p-4 border ${
                  q.status === 'locked'
                    ? 'bg-[#101714] border-[#223029] opacity-65'
                    : q.status === 'completed'
                      ? 'bg-[#13211b] border-[#2f5243]'
                      : 'bg-[#16231d] border-[#3d594b]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-[#f4efe2]">{q.title}</h3>
                  <span
                    className={`text-xs font-mono-num font-semibold ${
                      q.status === 'completed'
                        ? 'text-[#5eead4]'
                        : q.status === 'active'
                          ? 'text-[#e6b865]'
                          : 'text-[#809488]'
                    }`}
                  >
                    {q.status === 'completed'
                      ? 'COMPLETED'
                      : q.status === 'active'
                        ? 'ACTIVE'
                        : 'UPCOMING'}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-[#c6d3ca] mt-1">{q.summary}</p>

                <ul className="mt-3 space-y-1">
                  {q.objectives.map((o) => {
                    const done = o.current >= o.required;
                    return (
                      <li
                        key={o.id}
                        className={`text-xs flex items-center justify-between ${
                          done ? 'text-[#7be3b5] line-through opacity-80' : 'text-[#ebece6]'
                        }`}
                      >
                        <span>
                          {done ? '✓' : '○'} {o.label}
                        </span>
                        <span className="font-mono-num text-[11px]">
                          {o.current}/{o.required}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-3 pt-2.5 border-t border-[#26362e] text-[11px] font-mono-num text-[#9eb5a6]">
                  Reward: +{q.rewards.xp} XP
                  {q.rewards.items &&
                    Object.entries(q.rewards.items).map(
                      ([k, qty]) => ` · +${qty} ${ITEM_CATALOG[k as ItemId].name}`
                    )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

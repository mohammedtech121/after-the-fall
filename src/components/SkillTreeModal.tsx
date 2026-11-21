import React, { useState } from 'react';
import { Flame, Shield, Sparkles, Zap } from 'lucide-react';
import { canLearnSkill, SKILL_TREE_NODES } from '../game/combat';
import { SkillBranch, SkillId, SkillRankMap } from '../game/types';

interface SkillTreeModalProps {
  level: number;
  xp: number;
  nextLevelXp: number;
  skillPoints: number;
  skills: SkillRankMap;
  onLearnSkill: (skillId: SkillId) => { ok: boolean; message: string };
  onClose: () => void;
}

const BRANCHES: {
  id: SkillBranch;
  title: string;
  subtitle: string;
  accent: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'combat',
    title: 'Combat',
    subtitle: 'Sword mastery & critical strikes',
    accent: '#f5be4f',
    icon: <Flame className="w-4 h-4 text-[#f5be4f]" />,
  },
  {
    id: 'energy',
    title: 'Energy',
    subtitle: 'Arc capacity, regen & shockwaves',
    accent: '#5eead4',
    icon: <Zap className="w-4 h-4 text-[#5eead4]" />,
  },
  {
    id: 'survival',
    title: 'Survival',
    subtitle: 'Vitality, stamina & scavenging',
    accent: '#86efac',
    icon: <Shield className="w-4 h-4 text-[#86efac]" />,
  },
];

export const SkillTreeModal: React.FC<SkillTreeModalProps> = ({
  level,
  xp,
  nextLevelXp,
  skillPoints,
  skills,
  onLearnSkill,
  onClose,
}) => {
  const [notice, setNotice] = useState<string | null>(null);
  const xpPct = Math.max(0, Math.min(100, (xp / Math.max(1, nextLevelXp)) * 100));

  const handleLearn = (id: SkillId, name: string) => {
    const res = onLearnSkill(id);
    setNotice(res.ok ? `Learned rank in ${name}!` : res.message);
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/78 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Survivor Skill Tree"
    >
      <div className="w-full max-w-4xl bg-[#111a17] border border-[#446152] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#17241f] border-b border-[#2b3f35]">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#5eead4]" />
            <div>
              <h2 className="font-display text-xl font-bold text-[#f3efe2]">
                Survivor Skill Tree
              </h2>
              <div className="flex items-center gap-3 text-xs text-[#9fb6a8] mt-0.5">
                <span className="font-mono-num font-bold text-[#e6b865]">Level {level}</span>
                <div className="w-28 h-2 bg-[#0c1411] border border-[#283c32] overflow-hidden">
                  <div className="h-full bg-[#5eead4]" style={{ width: `${xpPct}%` }} />
                </div>
                <span className="font-mono-num text-[11px]">
                  {xp}/{nextLevelXp} XP
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-[#1a2c24] border border-[#4cd3c2] text-xs font-bold text-[#99f6e4] font-mono-num">
              {skillPoints} Skill {skillPoints === 1 ? 'Point' : 'Points'}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-[#d4ded7] hover:text-white bg-[#1f2e28] border border-[#3d5448] cursor-pointer"
            >
              Close [K]
            </button>
          </div>
        </div>

        {notice && (
          <div className="px-5 py-2 bg-[#162922] border-b border-[#346454] text-xs font-semibold text-[#99f6e4]">
            {notice}
          </div>
        )}

        {/* 3-Branch Grid */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {BRANCHES.map((branch) => {
            const nodes = SKILL_TREE_NODES.filter((n) => n.branch === branch.id);
            return (
              <div
                key={branch.id}
                className="bg-[#0e1613] border border-[#2b4036] p-3.5 flex flex-col gap-3"
              >
                <div className="pb-2.5 border-b border-[#22342b]">
                  <div className="flex items-center gap-2">
                    {branch.icon}
                    <h3 className="font-display text-base font-bold text-[#f3efe2]">
                      {branch.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#9ab0a2] mt-0.5">{branch.subtitle}</p>
                </div>

                <div className="space-y-2.5 flex-1">
                  {nodes.map((node) => {
                    const rank = skills[node.id] ?? 0;
                    const maxed = rank >= node.maxRank;
                    const check = canLearnSkill(node.id, { skills, skillPoints });

                    return (
                      <div
                        key={node.id}
                        className="bg-[#14201b] border border-[#2d4439] p-3 flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#f3efe2]">{node.name}</span>
                            <span
                              className="font-mono-num text-[11px] font-bold"
                              style={{ color: branch.accent }}
                            >
                              {rank}/{node.maxRank}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1.5">
                            {Array.from({ length: node.maxRank }).map((_, idx) => (
                              <span
                                key={idx}
                                className="h-1.5 flex-1"
                                style={{
                                  backgroundColor: idx < rank ? branch.accent : '#213029',
                                }}
                              />
                            ))}
                          </div>
                          <p className="text-[11px] text-[#b4c7bc] mt-1.5 leading-snug">
                            {node.description}
                          </p>
                          <div className="text-[10px] font-mono-num text-[#8de8db] mt-1">
                            {node.effectPerRank}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!check.ok}
                          onClick={() => handleLearn(node.id, node.name)}
                          aria-label={`Learn ${node.name}`}
                          className={`w-full py-1.5 text-[11px] font-bold uppercase tracking-wider ${
                            maxed
                              ? 'bg-[#17302a] border border-[#32685e] text-[#7ddcd0] cursor-default'
                              : check.ok
                                ? 'bg-[#2a5946] hover:bg-[#357058] border border-[#6ee7b7] text-[#ecfdf5] cursor-pointer'
                                : 'bg-[#17201c] border border-[#293830] text-[#667a6f] cursor-not-allowed'
                          }`}
                        >
                          {maxed ? 'Mastered' : rank === 0 ? 'Learn (1 SP)' : 'Upgrade (1 SP)'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

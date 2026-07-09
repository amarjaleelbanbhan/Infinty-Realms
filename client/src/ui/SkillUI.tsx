import { useState } from 'react';
import { KNOWN_SKILLS, useSkillStore, type Skill } from '@game/systems/SkillSystem';
import { useUIStore } from '@stores/useUIStore';
import { BookOpen, X, Droplet, Timer, Sparkles, Flame, Snowflake, Heart, Zap, Shield } from 'lucide-react';

export function SkillUI({ onClose }: { onClose: () => void }) {
  const { equippedSkills, castSkill } = useSkillStore();
  const { addToast } = useUIStore();
  const [selectedSkill, setSelectedSkill] = useState<Skill>(KNOWN_SKILLS[0]);

  const handleCast = (skillId: string) => {
    castSkill(skillId);
  };

  const renderSkillIcon = (icon: string, className = "w-6 h-6") => {
    switch (icon) {
      case 'flame': return <Flame className={`${className} text-orange-400`} />;
      case 'snowflake': return <Snowflake className={`${className} text-blue-400`} />;
      case 'heart': return <Heart className={`${className} text-red-400`} />;
      case 'zap': return <Zap className={`${className} text-yellow-400`} />;
      default: return <Shield className={`${className} text-gray-400`} />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-realm-border pb-3 mb-4">
          <h2 className="font-game text-xl text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-realm-accent" /> Spellbook & Grimoire</h2>
          <button onClick={onClose} className="text-realm-text-muted hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-xs text-realm-text-muted font-ui mb-4">
          Master elemental spells to unleash devastation in combat or channel restorative magic.
        </p>

        {/* Skill List */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {KNOWN_SKILLS.map((skill) => {
            const isEquipped = equippedSkills.some((s) => s.id === skill.id);
            return (
              <button
                key={skill.id}
                onClick={() => setSelectedSkill(skill)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedSkill.id === skill.id
                    ? 'border-realm-accent bg-realm-accent/10 shadow-glow'
                    : 'border-realm-border bg-realm-surface hover:border-realm-accent/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded bg-black/40 border border-realm-border/50 flex items-center justify-center">
                    {renderSkillIcon(skill.icon, "w-4 h-4")}
                  </div>
                  <span className="font-game text-xs text-white">{skill.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono text-realm-text-muted">
                  <span className="flex items-center gap-1"><Droplet className="w-3 h-3 text-blue-400" /> {skill.manaCost} MP</span>
                  <span className="flex items-center gap-1"><Timer className="w-3 h-3 text-gray-400" /> {skill.cooldown}s</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Skill Details */}
        {selectedSkill && (
          <div className="bg-realm-bg border border-realm-border rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded glass flex items-center justify-center bg-black/40 border border-realm-border/50">
                {renderSkillIcon(selectedSkill.icon, "w-6 h-6")}
              </div>
              <div>
                <h3 className="font-game text-sm text-realm-gold">{selectedSkill.name}</h3>
                <span className="text-xs font-mono text-realm-xp uppercase">{selectedSkill.type} Spell</span>
              </div>
            </div>
            <p className="text-xs text-gray-300 font-ui mb-3">{selectedSkill.description}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleCast(selectedSkill.id)}
                className="btn-gold flex-1 text-xs py-2 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Cast Spell
              </button>
            </div>
          </div>
        )}

        <button className="btn-secondary w-full text-xs" onClick={onClose}>
          Close Spellbook
        </button>
      </div>
    </div>
  );
}

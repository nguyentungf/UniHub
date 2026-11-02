import React, { useState } from 'react';
import { Modal, Button, Input, Badge } from '@/components/ui';
import { GradingScale, GradeScaleTier } from '@/types';
import { Plus, Trash2, RotateCcw, Check, Sliders, AlertCircle } from 'lucide-react';
import { DEFAULT_GRADING_SCALES } from '../utils/gradingScales';

interface GradingScaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeScaleId: string;
  scales: GradingScale[];
  onSelectScale: (scaleId: string) => void;
  onSaveScale: (scale: GradingScale) => void;
  onResetScales: () => void;
}

export const GradingScaleModal: React.FC<GradingScaleModalProps> = ({
  isOpen,
  onClose,
  activeScaleId,
  scales,
  onSelectScale,
  onSaveScale,
  onResetScales,
}) => {
  const [selectedId, setSelectedId] = useState<string>(activeScaleId);
  const [isEditingCustom, setIsEditingCustom] = useState<boolean>(false);

  // Custom scale draft state
  const activeScale =
    scales.find((s) => s.id === selectedId) || scales[0] || DEFAULT_GRADING_SCALES[0];

  const [customName, setCustomName] = useState<string>(activeScale.name);
  const [customMaxGpa, setCustomMaxGpa] = useState<number>(activeScale.maxGpa);
  const [customTiers, setCustomTiers] = useState<GradeScaleTier[]>([...activeScale.tiers]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // When switching scale selection
  const handleSelectScale = (scaleId: string) => {
    setSelectedId(scaleId);
    const target = scales.find((s) => s.id === scaleId) || DEFAULT_GRADING_SCALES[0];
    setCustomName(target.name);
    setCustomMaxGpa(target.maxGpa);
    setCustomTiers([...target.tiers]);
    setIsEditingCustom(false);
    setErrorMsg(null);
  };

  const handleStartCustomizing = () => {
    setIsEditingCustom(true);
    setCustomName(`${activeScale.name} (Customized)`);
  };

  const handleAddTier = () => {
    const newTier: GradeScaleTier = {
      letter: 'New',
      gradePoint: Math.max(0, customMaxGpa - 0.5),
      minPercentage: 70,
      maxPercentage: 79.99,
      description: 'Custom Tier',
    };
    setCustomTiers([newTier, ...customTiers]);
  };

  const handleUpdateTier = (index: number, updates: Partial<GradeScaleTier>) => {
    setCustomTiers((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...updates } : t))
    );
  };

  const handleDeleteTier = (index: number) => {
    if (customTiers.length <= 1) {
      setErrorMsg('A grading scale must have at least one grade tier.');
      return;
    }
    setCustomTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyAndSave = () => {
    setErrorMsg(null);
    if (isEditingCustom) {
      if (!customName.trim()) {
        setErrorMsg('Please specify a valid scale name.');
        return;
      }
      if (customTiers.length === 0) {
        setErrorMsg('A grading scale must have at least one grade tier.');
        return;
      }

      const customScale: GradingScale = {
        id: `scale-custom-${Date.now()}`,
        name: customName.trim(),
        scaleType: 'custom',
        maxGpa: customMaxGpa,
        isCustom: true,
        tiers: customTiers.sort((a, b) => b.minPercentage - a.minPercentage),
      };

      onSaveScale(customScale);
      onSelectScale(customScale.id);
    } else {
      onSelectScale(selectedId);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Grading Scale Settings & Configuration"
      description="Choose your institution's grading system or customize your own cutoff boundaries"
      size="xl"
    >
      <div className="space-y-6 pt-2 text-xs">
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Preset Scale Chooser */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Select Grading Scale System
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {scales.map((s) => {
              const isSelected = s.id === selectedId;
              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectScale(s.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/60 shadow-xs dark:border-brand-500 dark:bg-brand-950/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {s.name}
                    </span>
                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <span>Max GPA: {s.maxGpa.toFixed(2)}</span>
                    <span>·</span>
                    <span>{s.tiers.length} Tiers</span>
                    {s.isCustom && (
                      <Badge variant="amber" size="sm">
                        Custom
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customization Controls */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {!isEditingCustom ? (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Sliders className="h-3.5 w-3.5" />}
                onClick={handleStartCustomizing}
              >
                Customize Scale Tiers
              </Button>
            ) : (
              <Badge variant="brand">Editing Custom Scale Draft</Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={() => {
              onResetScales();
              setSelectedId(DEFAULT_GRADING_SCALES[0].id);
              setIsEditingCustom(false);
            }}
          >
            Reset Defaults
          </Button>
        </div>

        {/* Custom Scale Metadata Header (if customizing) */}
        {isEditingCustom && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-900/40 dark:border-slate-800">
            <div className="sm:col-span-2">
              <Input
                label="Custom Scale Name *"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. My University 4.0 Scale"
              />
            </div>
            <div>
              <Input
                label="Max GPA Scale *"
                type="number"
                step="0.01"
                min="1"
                max="10"
                value={customMaxGpa}
                onChange={(e) => setCustomMaxGpa(parseFloat(e.target.value) || 4.0)}
              />
            </div>
          </div>
        )}

        {/* Tiers Breakdown Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Grade Tier Cutoffs & Point Weights
            </span>
            {isEditingCustom && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                onClick={handleAddTier}
              >
                Add Tier
              </Button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-700 dark:bg-slate-900/70 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-3 text-left font-semibold">Letter</th>
                  <th className="py-2 px-3 text-center font-semibold">Grade Point</th>
                  <th className="py-2 px-3 text-center font-semibold">Min %</th>
                  <th className="py-2 px-3 text-center font-semibold">Max %</th>
                  <th className="py-2 px-3 text-left font-semibold">Description</th>
                  {isEditingCustom && <th className="py-2 px-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {customTiers.map((tier, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                      {isEditingCustom ? (
                        <input
                          type="text"
                          value={tier.letter}
                          onChange={(e) => handleUpdateTier(idx, { letter: e.target.value })}
                          className="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-xs dark:border-slate-700 dark:bg-slate-900 font-bold"
                        />
                      ) : (
                        tier.letter
                      )}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-semibold text-brand-600 dark:text-brand-400">
                      {isEditingCustom ? (
                        <input
                          type="number"
                          step="0.01"
                          value={tier.gradePoint}
                          onChange={(e) =>
                            handleUpdateTier(idx, {
                              gradePoint: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-xs text-center dark:border-slate-700 dark:bg-slate-900 font-mono"
                        />
                      ) : (
                        tier.gradePoint.toFixed(2)
                      )}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                      {isEditingCustom ? (
                        <input
                          type="number"
                          step="0.1"
                          value={tier.minPercentage}
                          onChange={(e) =>
                            handleUpdateTier(idx, {
                              minPercentage: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-xs text-center dark:border-slate-700 dark:bg-slate-900 font-mono"
                        />
                      ) : (
                        `${tier.minPercentage}%`
                      )}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                      {isEditingCustom ? (
                        <input
                          type="number"
                          step="0.1"
                          value={tier.maxPercentage}
                          onChange={(e) =>
                            handleUpdateTier(idx, {
                              maxPercentage: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-xs text-center dark:border-slate-700 dark:bg-slate-900 font-mono"
                        />
                      ) : (
                        `${tier.maxPercentage}%`
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400">
                      {isEditingCustom ? (
                        <input
                          type="text"
                          value={tier.description || ''}
                          onChange={(e) =>
                            handleUpdateTier(idx, { description: e.target.value })
                          }
                          className="w-full rounded border border-slate-200 px-1.5 py-0.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                        />
                      ) : (
                        tier.description || '-'
                      )}
                    </td>
                    {isEditingCustom && (
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteTier(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApplyAndSave}>
            Apply Active Scale
          </Button>
        </div>
      </div>
    </Modal>
  );
};


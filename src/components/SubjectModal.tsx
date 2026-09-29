import React, { useState } from 'react';
import { X, Plus, Trash2, Palette } from 'lucide-react';
import { Subject } from '../types';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onSaveSubjects: (updated: Subject[]) => void;
}

const PALETTE = [
  '#7c8cf4', // Pastel Periwinkle
  '#52b788', // Pastel Sage
  '#e9a858', // Pastel Apricot
  '#e2858b', // Pastel Dusty Rose
  '#9b82db', // Pastel Muted Lavender
  '#5ea8ba', // Pastel Ocean Mist
  '#d48b70', // Pastel Warm Terracotta
  '#749db8', // Pastel Slate Blue
  '#62a88e', // Pastel Celadon
  '#b5838d', // Pastel Dusty Mauve
  '#e0a96d', // Pastel Warm Almond
  '#8b9cb6', // Pastel Soft Steel
];

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  subjects,
  onSaveSubjects,
}) => {
  const [list, setList] = useState<Subject[]>(subjects);
  const [newName, setNewName] = useState('');
  const [newTargetHours, setNewTargetHours] = useState(6);
  const [newColor, setNewColor] = useState(PALETTE[0]);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newSubj: Subject = {
      id: `subj-${Date.now()}`,
      name: newName.trim(),
      color: newColor,
      targetWeeklyHours: newTargetHours,
    };

    const updated = [...list, newSubj];
    setList(updated);
    setNewName('');
    onSaveSubjects(updated);
  };

  const handleUpdateTarget = (id: string, hours: number) => {
    const updated = list.map((s) => (s.id === id ? { ...s, targetWeeklyHours: hours } : s));
    setList(updated);
    onSaveSubjects(updated);
  };

  const handleDelete = (id: string) => {
    if (list.length <= 1) {
      alert('You must keep at least one subject.');
      return;
    }
    const updated = list.filter((s) => s.id !== id);
    setList(updated);
    onSaveSubjects(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-cream-border/60 dark:border-stone-800">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">
              Manage Subjects & Weekly Goals
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Customize subject names, weekly hour goals, and visual palette colors.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-cream-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing subjects list */}
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {list.map((subj) => (
            <div
              key={subj.id}
              className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-cream-50 dark:bg-stone-800/60 border border-cream-border dark:border-stone-800"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3.5 h-3.5 rounded-md shrink-0"
                  style={{ backgroundColor: subj.color }}
                />
                <span className="text-sm font-semibold text-stone-900 dark:text-white truncate">
                  {subj.name}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1 text-xs">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={subj.targetWeeklyHours || 5}
                    onChange={(e) => handleUpdateTarget(subj.id, parseInt(e.target.value) || 1)}
                    className="w-12 bg-cream-card dark:bg-stone-700 border border-cream-border dark:border-stone-600 rounded-lg px-2 py-1 text-center font-bold text-stone-900 dark:text-white text-xs"
                  />
                  <span className="text-stone-400">hrs/wk</span>
                </div>

                <button
                  onClick={() => handleDelete(subj.id)}
                  className="p-1.5 text-stone-400 hover:text-rose-500 transition cursor-pointer"
                  title="Remove subject"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add new subject form */}
        <form onSubmit={handleAdd} className="pt-3 border-t border-cream-border/60 dark:border-stone-800 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Add New Subject
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Organic Chemistry"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 bg-cream-50 dark:bg-stone-800 border border-cream-border dark:border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max="60"
                value={newTargetHours}
                onChange={(e) => setNewTargetHours(parseInt(e.target.value) || 1)}
                className="w-16 bg-cream-50 dark:bg-stone-800 border border-cream-border dark:border-stone-700 rounded-xl px-2 py-2 text-center text-sm text-stone-900 dark:text-white font-semibold"
                title="Target weekly hours"
              />
              <span className="text-xs text-stone-400">hrs</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {PALETTE.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setNewColor(color)}
                  className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                    newColor === color ? 'scale-125 ring-2 ring-amber-500 ring-offset-2' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Subject
            </button>
          </div>
        </form>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

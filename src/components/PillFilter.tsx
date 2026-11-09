import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface Pill {
  key: string;
  label: string;
  count?: number;
}

interface PillFilterProps {
  title: string;
  pills: Pill[];
  selected: string[];
  onToggle: (key: string) => void;
  onClear?: () => void;
}

/**
 * Horizontal, scrollable pill filter row. Multi-select; active pills are
 * filled (burgundy), inactive pills are outlined. Shows a count badge.
 */
export function PillFilter({ title, pills, selected, onToggle, onClear }: PillFilterProps) {
  if (pills.length === 0) return null;
  const hasSelection = selected.length > 0;

  return (
    <div className="flex items-start gap-2">
      <div className="text-xs font-semibold text-stone-500 pt-1.5 w-20 shrink-0">{title}</div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {pills.map(p => {
          const active = selected.includes(p.key);
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onToggle(p.key)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors ${
                active
                  ? 'bg-[#800020] text-white border-[#800020]'
                  : 'bg-white text-stone-600 border-stone-300 hover:border-[#800020] hover:text-[#800020]'
              }`}
            >
              <span className="max-w-[180px] truncate">{p.label}</span>
              {typeof p.count === 'number' && (
                <span className={`text-[10px] rounded-full px-1.5 ${active ? 'bg-white/20' : 'bg-stone-100'}`}>
                  {p.count}
                </span>
              )}
            </button>
          );
        })}
        {hasSelection && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs text-stone-400 hover:text-stone-600"
            title="Clear this filter"
          >
            <X className="w-3 h-3" /> clear
          </button>
        )}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, className = '' }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard?.writeText(codeText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!content.trim()) {
    return (
      <div className="py-12 text-center text-xs text-slate-400 italic">
        Chưa có nội dung. Bắt đầu viết ghi chú bằng Markdown ở khung soạn thảo...
      </div>
    );
  }

  // Parse markdown blocks separated by double newlines or single newlines for lists/tables
  const blocks = content.split('\n\n');

  return (
    <div className={`space-y-4 text-xs text-slate-800 dark:text-slate-200 leading-relaxed ${className}`}>
      {blocks.map((block, index) => {
        const trimmed = block.trim();

        // 1. Heading 1
        if (trimmed.startsWith('# ')) {
          return (
            <h1
              key={index}
              className="text-lg font-black text-slate-900 dark:text-white border-b border-slate-200/80 dark:border-slate-800 pb-2 mt-4 first:mt-0 tracking-tight"
            >
              {trimmed.replace(/^#\s+/, '')}
            </h1>
          );
        }

        // 2. Heading 2
        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={index}
              className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-1.5 pt-2"
            >
              {trimmed.replace(/^##\s+/, '')}
            </h2>
          );
        }

        // 3. Heading 3
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={index} className="text-sm font-bold text-slate-900 dark:text-white pt-2">
              {trimmed.replace(/^###\s+/, '')}
            </h3>
          );
        }

        // 4. Code Blocks (```)
        if (trimmed.startsWith('```')) {
          const lines = trimmed.split('\n');
          const firstLine = lines[0].replace('```', '').trim();
          const codeBody = lines.slice(1, lines[lines.length - 1].startsWith('```') ? -1 : undefined).join('\n');
          const isCopied = copiedIndex === index;

          return (
            <div
              key={index}
              className="relative my-3 rounded-2xl bg-slate-950 dark:bg-navy-950 border border-slate-800 shadow-sm overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900/50 text-[10px] text-slate-400 font-mono">
                <span>{firstLine || 'code'}</span>
                <button
                  onClick={() => handleCopyCode(codeBody, index)}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                  title="Sao chép đoạn mã"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Đã chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed">
                <code>{codeBody}</code>
              </pre>
            </div>
          );
        }

        // 5. Blockquote (>)
        if (trimmed.startsWith('>')) {
          return (
            <blockquote
              key={index}
              className="border-l-4 border-brand-500 pl-4 py-1 italic bg-brand-50/30 dark:bg-brand-950/20 rounded-r-xl text-slate-700 dark:text-slate-300"
            >
              {trimmed.replace(/^>\s*/gm, '')}
            </blockquote>
          );
        }

        // 6. Task List (- [ ] or - [x])
        if (trimmed.includes('- [ ]') || trimmed.includes('- [x]')) {
          return (
            <div key={index} className="space-y-1.5 my-2">
              {trimmed.split('\n').map((line, liIdx) => {
                const isChecked = line.includes('- [x]');
                const label = line.replace(/-\s*\[[ x]\]\s*/, '');
                return (
                  <div key={liIdx} className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-brand-600 pointer-events-none"
                    />
                    <span
                      className={`text-xs ${
                        isChecked ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        }

        // 7. Bullet List (- or *)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <ul key={index} className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300 my-2">
              {trimmed.split('\n').map((li, i) => (
                <li key={i}>{li.replace(/^[-*]\s+/, '')}</li>
              ))}
            </ul>
          );
        }

        // 8. Ordered List (1. 2.)
        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <ol key={index} className="list-decimal pl-5 space-y-1 text-slate-700 dark:text-slate-300 my-2">
              {trimmed.split('\n').map((li, i) => (
                <li key={i}>{li.replace(/^\d+\.\s+/, '')}</li>
              ))}
            </ol>
          );
        }

        // 9. Horizontal Rule (---)
        if (trimmed === '---' || trimmed === '***') {
          return <hr key={index} className="border-slate-200 dark:border-slate-800 my-4" />;
        }

        // 10. Table (| col1 | col2 |)
        if (trimmed.startsWith('|') && trimmed.includes('\n|')) {
          const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
          if (lines.length >= 2) {
            const headerCells = lines[0]
              .split('|')
              .slice(1, -1)
              .map((c) => c.trim());
            const bodyRows = lines
              .slice(2) // Skip header and separator row
              .map((row) =>
                row
                  .split('|')
                  .slice(1, -1)
                  .map((c) => c.trim())
              );

            return (
              <div key={index} className="overflow-x-auto my-3">
                <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80">
                      {headerCells.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          className="border border-slate-200 dark:border-slate-800 p-2 font-semibold text-slate-700 dark:text-slate-200"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bodyRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="border border-slate-200 dark:border-slate-800 p-2 text-slate-600 dark:text-slate-300"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        // 11. Standard Paragraph
        return (
          <p key={index} className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
};


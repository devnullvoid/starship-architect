import React from 'react';
import { PreviewContext } from '../types';
import { Folder, GitBranch, Code2, Box, Home } from 'lucide-react';

interface ContextSelectorProps {
    contexts: PreviewContext[];
    activeContext: PreviewContext;
    onSelect: (context: PreviewContext) => void;
}

const ContextSelector: React.FC<ContextSelectorProps> = ({ contexts, activeContext, onSelect }) => {
    const getIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('git')) return <GitBranch size={14} />;
        if (lower.includes('home')) return <Home size={14} />;
        if (lower.includes('node') || lower.includes('go') || lower.includes('rust')) return <Code2 size={14} />;
        return <Folder size={14} />;
    };

    return (
        <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
            {contexts.map(ctx => (
                <button
                    key={ctx.id}
                    onClick={() => onSelect(ctx)}
                    className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all
            ${activeContext.id === ctx.id
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}
          `}
                >
                    {getIcon(ctx.name)}
                    {ctx.name}
                </button>
            ))}
        </div>
    );
};

export default ContextSelector;

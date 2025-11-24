import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface KeyValueEditorProps {
    value: Record<string, string>;
    onChange: (value: Record<string, string>) => void;
}

const KeyValueEditor: React.FC<KeyValueEditorProps> = ({ value, onChange }) => {
    const [entries, setEntries] = useState<[string, string][]>([]);

    useEffect(() => {
        if (value && typeof value === 'object') {
            setEntries(Object.entries(value));
        } else {
            setEntries([]);
        }
    }, [value]);

    const handleChange = (index: number, key: string, val: string) => {
        const newEntries = [...entries];
        newEntries[index] = [key, val];
        setEntries(newEntries);
        updateParent(newEntries);
    };

    const handleDelete = (index: number) => {
        const newEntries = entries.filter((_, i) => i !== index);
        setEntries(newEntries);
        updateParent(newEntries);
    };

    const handleAdd = () => {
        const newEntries = [...entries, ['', ''] as [string, string]];
        setEntries(newEntries);
        // Don't update parent yet until they type something, or maybe do?
        // Let's wait to avoid empty keys
    };

    const updateParent = (currentEntries: [string, string][]) => {
        const newValue: Record<string, string> = {};
        currentEntries.forEach(([k, v]) => {
            if (k.trim()) newValue[k] = v;
        });
        onChange(newValue);
    };

    return (
        <div className="space-y-2">
            {entries.map(([key, val], index) => (
                <div key={index} className="flex gap-2">
                    <input
                        type="text"
                        value={key}
                        onChange={(e) => handleChange(index, e.target.value, val)}
                        placeholder="Key"
                        className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <input
                        type="text"
                        value={val}
                        onChange={(e) => handleChange(index, key, e.target.value)}
                        placeholder="Value"
                        className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <button
                        onClick={() => handleDelete(index)}
                        className="text-slate-500 hover:text-red-400"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            <button
                onClick={handleAdd}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            >
                <Plus size={14} /> Add Item
            </button>
        </div>
    );
};

export default KeyValueEditor;

// Global in-memory log store — survives component remounts
const logs = [];
const listeners = new Set();

const notify = () => listeners.forEach(fn => fn([...logs]));

export const debugLog = (level, ...args) => {
    const line = {
        id:   Date.now() + Math.random(),
        time: new Date().toLocaleTimeString(),
        level,
        msg:  args.map(a => {
            try { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a); }
            catch { return String(a); }
        }).join(' ')
    };
    logs.push(line);
    if (logs.length > 200) logs.shift();
    notify();

    // Also write to real console so dev builds still show in terminal
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](`[${level.toUpperCase()}]`, ...args);
};

export const useLogs = (setState) => {
    const React = require('react');
    React.useEffect(() => {
        setState([...logs]);
        listeners.add(setState);
        return () => listeners.delete(setState);
    }, [setState]);
};
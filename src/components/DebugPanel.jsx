import React, { useState, useRef, useEffect } from 'react';
import { useLogs, debugLog } from './DebugLogger';

const COLORS = {
    info:    '#4fc3f7',
    warn:    '#ffb74d',
    error:   '#ef9a9a',
    success: '#81c784',
};

const DebugPanel = () => {
    const [logs,    setLogs]    = useState([]);
    const [visible, setVisible] = useState(false);
    const [filter,  setFilter]  = useState('all');
    const bottomRef             = useRef(null);

    useLogs(setLogs);

    // Auto-scroll to bottom
    useEffect(() => {
        if (visible) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs, visible]);

    const filtered = filter === 'all'
        ? logs
        : logs.filter(l => l.level === filter);

    const copy = () => {
        const text = filtered.map(l => `[${l.time}][${l.level}] ${l.msg}`).join('\n');
        navigator.clipboard?.writeText(text).then(() => debugLog('info', 'Logs copied to clipboard'));
    };

    return (
        <>
            {/* Floating trigger — tap 5 times fast to toggle */}
            <TapTrigger onActivate={() => setVisible(v => !v)} />

            {visible && (
                <div style={{
                    position:        'fixed',
                    inset:           0,
                    background:      'rgba(0,0,0,0.95)',
                    zIndex:          99999,
                    display:         'flex',
                    flexDirection:   'column',
                    fontFamily:      'monospace',
                    fontSize:        11,
                }}>
                    {/* Header */}
                    <div style={{
                        display:        'flex',
                        alignItems:     'center',
                        gap:            8,
                        padding:        '10px 12px',
                        background:     '#1a1a1a',
                        borderBottom:   '1px solid #333',
                        flexWrap:       'wrap',
                    }}>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>
                            🪲 Debug Logs ({filtered.length})
                        </span>

                        {['all','info','warn','error','success'].map(f => (
                            <button key={f} onClick={() => setFilter(f)} style={{
                                background:  filter === f ? '#444' : 'transparent',
                                color:       COLORS[f] || '#aaa',
                                border:      '1px solid #444',
                                borderRadius: 4,
                                padding:     '2px 8px',
                                cursor:      'pointer',
                                fontSize:    10,
                            }}>
                                {f}
                            </button>
                        ))}

                        <button onClick={copy} style={{
                            marginLeft:  'auto',
                            background:  '#1674a2',
                            color:       '#fff',
                            border:      'none',
                            borderRadius: 4,
                            padding:     '4px 10px',
                            cursor:      'pointer',
                            fontSize:    10,
                        }}>
                            Copy
                        </button>

                        <button onClick={() => setVisible(false)} style={{
                            background:  '#c0392b',
                            color:       '#fff',
                            border:      'none',
                            borderRadius: 4,
                            padding:     '4px 10px',
                            cursor:      'pointer',
                            fontSize:    10,
                        }}>
                            Close
                        </button>
                    </div>

                    {/* Log list */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
                        {filtered.length === 0 && (
                            <p style={{ color: '#555', textAlign: 'center', marginTop: 40 }}>
                                No logs yet
                            </p>
                        )}
                        {filtered.map(log => (
                            <div key={log.id} style={{
                                marginBottom:  4,
                                padding:       '4px 6px',
                                borderRadius:  3,
                                background:    'rgba(255,255,255,0.03)',
                                borderLeft:    `3px solid ${COLORS[log.level] || '#555'}`,
                            }}>
                                <span style={{ color: '#666', fontSize: 9 }}>{log.time} </span>
                                <span style={{ color: COLORS[log.level] || '#aaa' }}>
                                    [{log.level.toUpperCase()}]{' '}
                                </span>
                                <span style={{
                                    color:      '#ddd',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak:  'break-all',
                                }}>
                                    {log.msg}
                                </span>
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>
                </div>
            )}
        </>
    );
};

// Invisible tap zone — tap 5x fast in bottom-right corner to open
const TapTrigger = ({ onActivate }) => {
    const taps    = useRef(0);
    const timeout = useRef(null);

    const handle = () => {
        taps.current += 1;
        clearTimeout(timeout.current);
        if (taps.current >= 5) {
            taps.current = 0;
            onActivate();
        } else {
            timeout.current = setTimeout(() => { taps.current = 0; }, 1500);
        }
    };

    return (
        <div
            onPointerDown={handle}
            style={{
                position:  'fixed',
                bottom:    60,
                right:     0,
                width:     50,
                height:    80,
                zIndex:    99998,
                opacity:   0,           // invisible
                cursor:    'pointer',
            }}
        />
    );
};

export default DebugPanel;
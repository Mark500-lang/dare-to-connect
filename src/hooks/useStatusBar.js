import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export const useStatusBar = (style = 'dark', backgroundColor = '#ffffff') => {
    useEffect(() => {
        if (!isNative) return;

        const apply = async () => {
            try {
                await StatusBar.setStyle({
                    // Style.Dark = dark icons (for light backgrounds)
                    // Style.Light = light icons (for dark backgrounds like splash)
                    style: style === 'dark' ? Style.Dark : Style.Light
                });
                await StatusBar.setBackgroundColor({ color: backgroundColor });
            } catch (e) {
                console.warn('StatusBar error:', e);
            }
        };

        apply();
    }, [style, backgroundColor]);
};
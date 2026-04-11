import { API_CONFIG, buildRequestBody } from '../config/api';
import { Device } from '@capacitor/device';

class VersionService {
    // webFallbackVersion is passed in from appConfig so the service
    // doesn't need to import package.json itself
    async checkVersion(webFallbackVersion = '1.0.0') {
        try {
            let platform = 'web';
            let version  = webFallbackVersion; // use package.json version on web

            try {
                const info = await Device.getInfo();
                platform = info.platform === 'ios'     ? 'ios'
                         : info.platform === 'android' ? 'android'
                         : 'web';

                if (platform === 'android') {
                    const manufacturer = (info.manufacturer || '').toLowerCase();
                    const model        = (info.model        || '').toLowerCase();
                    if (manufacturer.includes('huawei') || model.includes('huawei')) {
                        platform = 'huawei';
                    }
                }
            } catch {}

            // On native, override version with the actual installed app version
            if (platform !== 'web') {
                try {
                    const appInfo = await window.Capacitor?.Plugins?.App?.getInfo?.();
                    if (appInfo?.version) version = appInfo.version;
                } catch {}
            }

            const controller = new AbortController();
            const timeout    = setTimeout(() => controller.abort(), 6000);

            let response;
            try {
                response = await fetch(
                    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHECK_VERSION}`,
                    {
                        method:  'POST',
                        headers: API_CONFIG.HEADERS,
                        signal:  controller.signal,
                        body:    JSON.stringify(buildRequestBody({ version, platform })),
                    }
                );
            } finally {
                clearTimeout(timeout);
            }

            if (!response.ok) throw new Error(`checkVersion HTTP ${response.status}`);

            const json = await response.json();

            if (json.status === 'ok' && json.result?.code === 1) {
                return {
                    needsUpdate: true,
                    title:       json.result.title,
                    message:     json.result.message,
                    url:         json.result.url,
                    force:       json.result.force,
                };
            }

            return { needsUpdate: false };

        } catch (err) {
            if (err.name !== 'AbortError') {
                console.warn('[VersionService] Version check failed (non-fatal):', err.message);
            }
            return { needsUpdate: false };
        }
    }
}

const versionService = new VersionService();
export default versionService;
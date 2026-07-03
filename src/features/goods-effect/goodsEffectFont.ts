import { browser } from 'wxt/browser';
import type { GoodsEffectFontInfo } from './goodsEffectTypes';

type RawFontInfo = {
    fontFaces: Array<{
        family: string;
        status: string;
    }>;
    fontUrls: string[];
    cssTexts: string[];
    textSamples: string[];
};

// 在当前 PDD 页面里读取字体调试信息。
export async function readGoodsEffectFontInfo(): Promise<GoodsEffectFontInfo> {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
        throw new Error('没有找到当前标签页');
    }

    const [result] = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: readFontInfoInsidePage
    });

    return normalizeGoodsEffectFontInfo(result?.result || emptyRawFontInfo());
}

// 整理页面字体信息：合并字体地址、提取加密字符。
export function normalizeGoodsEffectFontInfo(raw: RawFontInfo): GoodsEffectFontInfo {
    const fontUrls = uniqueStrings([...raw.fontUrls, ...readFontUrlsFromCss(raw.cssTexts)]);

    return {
        fontFaces: raw.fontFaces,
        fontUrls,
        encryptedChars: readEncryptedChars(raw.textSamples),
        textSamples: raw.textSamples.filter(Boolean).slice(0, 30),
        capturedAt: Date.now()
    };
}

// 空数据，页面读取失败时也能保持结构稳定。
function emptyRawFontInfo(): RawFontInfo {
    return {
        fontFaces: [],
        fontUrls: [],
        cssTexts: [],
        textSamples: []
    };
}

// 这段函数会被复制到 PDD 页面里执行，不能引用外部函数。
function readFontInfoInsidePage(): RawFontInfo {
    const fontFaces = Array.from(document.fonts || []).map(fontFace => ({
        family: fontFace.family,
        status: fontFace.status
    }));

    const fontUrls = performance
        .getEntriesByType('resource')
        .map(entry => entry.name)
        .filter(url => /\.(woff2?|ttf|otf)(\?|$)/i.test(url));

    const cssTexts = Array.from(document.styleSheets)
        .flatMap(styleSheet => {
            try {
                return Array.from(styleSheet.cssRules || []).map(rule => rule.cssText);
            } catch {
                return [];
            }
        })
        .filter(text => text.includes('@font-face') || /\.(woff2?|ttf|otf)/i.test(text));

    const textSamples = Array.from(document.querySelectorAll('tr, [role="row"], .ant-table-row'))
        .map(row => (row.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 30);

    return {
        fontFaces,
        fontUrls,
        cssTexts,
        textSamples
    };
}

// 从 CSS 文本里提取字体文件地址。
function readFontUrlsFromCss(cssTexts: string[]): string[] {
    const urls: string[] = [];
    const urlPattern = /url\(["']?([^"')]+?\.(?:woff2?|ttf|otf)(?:\?[^"')]+)?)["']?\)/gi;

    for (const cssText of cssTexts) {
        for (const match of cssText.matchAll(urlPattern)) {
            urls.push(match[1]);
        }
    }

    return urls;
}

// 从页面文本里提取私有区字符。PDD 的数字加密字符通常在这个范围里。
function readEncryptedChars(textSamples: string[]): string[] {
    const chars: string[] = [];

    for (const text of textSamples) {
        for (const char of text) {
            const code = char.codePointAt(0) || 0;
            if (code >= 0xe000 && code <= 0xf8ff) {
                chars.push(char);
            }
        }
    }

    return uniqueStrings(chars);
}

// 数组去重，并保持原来的出现顺序。
function uniqueStrings(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
}

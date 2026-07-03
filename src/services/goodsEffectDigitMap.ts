import { browser } from 'wxt/browser';
import type { PddDigitMap } from './goodsEffectCapture';
import { readGoodsEffectFontInfo } from './goodsEffectFont.ts';

// 从当前页面自动获取最新字体文件，并识别加密字符到数字的映射。
export async function readPddDigitMapFromPage(): Promise<PddDigitMap> {
    const fontInfo = await readGoodsEffectFontInfo();
    const fontUrls = sortPddFontUrls(fontInfo.fontUrls);
    const fontUrl = fontUrls[0];

    if (!fontUrl) {
        throw new Error('没有找到 PDD 数字字体文件');
    }

    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
        throw new Error('没有找到当前标签页');
    }

    const [result] = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: readDigitMapInsidePage,
        args: [fontUrl, fontInfo.encryptedChars]
    });

    const digitMap = result?.result || {};
    if (Object.keys(digitMap).length === 0) {
        throw new Error('没有识别到 PDD 数字字体映射');
    }

    return digitMap;
}

// 字体地址排序：优先使用 PDD 的 webspider 数字字体。
export function sortPddFontUrls(fontUrls: string[]): string[] {
    return [...fontUrls].sort((left, right) => {
        const leftScore = getFontUrlScore(left);
        const rightScore = getFontUrlScore(right);
        return leftScore - rightScore;
    });
}

function getFontUrlScore(url: string): number {
    if (url.includes('webspider-sdk-api')) return 0;
    if (/\.ttf(\?|$)/i.test(url)) return 1;
    if (/\.otf(\?|$)/i.test(url)) return 2;
    return 3;
}

// 这段函数会被复制到 PDD 页面里执行，不能引用外部函数。
// 它做的事等同于“下载最新字体 -> 看每个字符长什么样 -> 生成映射”，只是自动化完成。
async function readDigitMapInsidePage(fontUrl: string, encryptedChars: string[]): Promise<PddDigitMap> {
    const fontFamily = `pdd-digit-${Date.now()}`;
    const fontFace = new FontFace(fontFamily, `url(${fontUrl})`);
    await fontFace.load();
    document.fonts.add(fontFace);

    const digitMap: PddDigitMap = {};
    const normalDigitImages = new Map<string, ImageData>();

    for (const digit of '0123456789') {
        normalDigitImages.set(digit, drawTextToImageData(digit, '80px Arial, sans-serif'));
    }

    for (const char of encryptedChars) {
        const encryptedImage = drawTextToImageData(char, `80px "${fontFamily}"`);
        let bestDigit = '';
        let bestScore = Number.POSITIVE_INFINITY;

        for (const [digit, normalImage] of normalDigitImages) {
            const score = compareImageData(encryptedImage, normalImage);
            if (score < bestScore) {
                bestScore = score;
                bestDigit = digit;
            }
        }

        if (bestDigit) {
            digitMap[char] = bestDigit;
        }
    }

    return digitMap;

    // 把一个字符画成固定大小的黑白图片。
    function drawTextToImageData(text: string, font: string): ImageData {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 110;

        const context = canvas.getContext('2d');
        if (!context) throw new Error('无法创建 canvas');

        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#000';
        context.font = font;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2 + 4);

        return context.getImageData(0, 0, canvas.width, canvas.height);
    }

    // 比较两张图片的黑色像素差异，分数越低越像。
    function compareImageData(left: ImageData, right: ImageData): number {
        let score = 0;

        for (let index = 0; index < left.data.length; index += 4) {
            const leftBlack = 255 - left.data[index];
            const rightBlack = 255 - right.data[index];
            score += Math.abs(leftBlack - rightBlack);
        }

        return score;
    }
}

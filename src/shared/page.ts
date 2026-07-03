import { browser } from 'wxt/browser';

// 读取当前激活标签页的地址。
export async function readCurrentTabUrl(): Promise<string> {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) throw new Error('没有找到当前标签页地址');
    return tab.url;
}

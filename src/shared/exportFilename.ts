export type ExportFormat = 'json' | 'csv';

// 导出文件名统一使用北京时间，避免浏览器本地时区或 UTC 导致时间不对。
export function formatBeijingDateTime(date = new Date()): string {
    const parts = new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).formatToParts(date);

    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`;
}

export function buildExportFilename(name: string, format: ExportFormat, date = new Date()): string {
    return `${name} ${formatBeijingDateTime(date)}.${format}`;
}

// 下载文本文件。CSV 和 JSON 都走这里，避免每个功能重复写下载逻辑。
export function downloadTextFile(filename: string, data: string, type: string) {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

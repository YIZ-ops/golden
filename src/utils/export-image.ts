import { toPng } from 'html-to-image';

export async function exportQuoteAsImage(element: HTMLElement, fileName = `quote-${Date.now()}.png`) {
  const dataUrl = await toPng(element, { cacheBust: true });
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}

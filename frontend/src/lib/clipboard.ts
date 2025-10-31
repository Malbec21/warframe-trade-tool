/**
 * Clipboard utility for copying trade messages
 */

export function copyTradeMessage(itemName: string, price: number, username: string): Promise<void> {
  const message = `/w ${username} Hi! I want to buy: "${itemName}" for ${price} platinum. (warframe.market)`;
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(message);
  }
  
  // Fallback for older browsers
  const textarea = document.createElement('textarea');
  textarea.value = message;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  
  try {
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return Promise.resolve();
  } catch (err) {
    document.body.removeChild(textarea);
    return Promise.reject(err);
  }
}

export function getWarframeMarketUrl(itemId: string): string {
  return `https://warframe.market/items/${itemId}`;
}

export function getWarframeMarketPartUrl(frameId: string, partName: string): string {
  // Convert part name to URL format: "Blueprint" -> "blueprint"
  const partSlug = partName.toLowerCase().replace(/\s+/g, '_');
  return `https://warframe.market/items/${frameId}_${partSlug}`;
}


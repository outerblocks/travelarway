function inlineComputedStyles(source: HTMLElement, copy: HTMLElement) {
  const sourceElements = [source, ...source.querySelectorAll<HTMLElement>('*')];
  const copyElements = [copy, ...copy.querySelectorAll<HTMLElement>('*')];

  sourceElements.forEach((element, index) => {
    const computed = window.getComputedStyle(element);
    const styles = Array.from(computed)
      .map((property) => `${property}:${computed.getPropertyValue(property)};`)
      .join('');
    copyElements[index]?.setAttribute('style', styles);
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}

export async function downloadThermalTicket(ticket: HTMLElement, reference: string) {
  if (typeof URL.createObjectURL !== 'function') {
    throw new Error('This browser cannot create a downloadable ticket.');
  }

  const copy = ticket.cloneNode(true) as HTMLElement;
  inlineComputedStyles(ticket, copy);
  copy.style.cssText +=
    'width:72mm!important;min-height:0!important;margin:0 auto!important;transform:none!important;animation:none!important;box-shadow:none!important;';

  const documentHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Travelar ticket ${escapeHtml(reference)}</title>
    <style>
      @page { size: 80mm auto; margin: 0; }
      html, body { box-sizing: border-box; width: 80mm; margin: 0; padding: 0; background: #fff; }
      body { padding: 4mm; }
      #thermal-ticket { box-sizing: border-box !important; width: 72mm !important; }
    </style>
  </head>
  <body>${copy.outerHTML}</body>
</html>`;
  const blob = new Blob([documentHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `travelar-ticket-${reference.replace(/[^a-zA-Z0-9-]/g, '')}.html`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

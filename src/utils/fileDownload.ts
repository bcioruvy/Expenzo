// Triggers a CSV file download in a way that actually works on iOS Safari — including
// inside a home-screen "standalone" PWA, which is how this app is typically used on iPad.
//
// The old approach (a `data:text/csv,...` URI set as an <a href>, clicked programmatically)
// is unreliable on Safari: it's frequently silently ignored, or Safari just navigates to
// show the raw CSV text as a page instead of downloading it — especially in standalone PWA
// mode, where some navigation/download behaviors are more restricted than in a normal tab.
// This is why "nothing happens" when tapping Export CSV.
//
// Fix: prefer the native iOS/Android share sheet (Web Share API with a real File object)
// when available — this is the most reliable path on iPad, and lets the user directly
// choose "Save to Files", AirDrop, Mail, etc. Falls back to a Blob-based object URL (far
// more reliable than a data: URI) if the Share API isn't available or the user cancels.
export const downloadCSV = async (csvBody: string, filename: string): Promise<void> => {
  const blob = new Blob([csvBody], { type: 'text/csv;charset=utf-8;' });

  const nav = navigator as Navigator & {
    canShare?: (data?: { files?: File[] }) => boolean;
    share?: (data: { files?: File[]; title?: string }) => Promise<void>;
  };

  if (nav.canShare && nav.share) {
    try {
      const file = new File([blob], filename, { type: 'text/csv' });
      if (nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: filename });
        return;
      }
    } catch (err) {
      // User cancelled the share sheet, or sharing failed for some other reason — fall
      // through to the direct download below rather than leaving the export stuck.
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

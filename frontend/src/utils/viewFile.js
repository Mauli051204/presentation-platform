export const viewFile = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    // Force the correct MIME type for inline PDF rendering — Cloudinary raw
    // uploads don't always set one the browser recognizes as viewable inline.
    const typedBlob = blob.type ? blob : new Blob([blob], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(typedBlob);
    window.open(blobUrl, '_blank');
    // Not revoking immediately — the new tab needs the blob URL to stay
    // valid for as long as that tab is open.
  } catch (error) {
    window.open(url, '_blank');
  }
};

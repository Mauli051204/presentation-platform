export const downloadFile = async (url, filename = 'download') => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    // Fallback: if fetch/CORS fails for any reason, at least open it so the
    // user can save it manually from the browser's own PDF viewer.
    window.open(url, '_blank');
  }
};

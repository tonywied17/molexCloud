export function getMimeIcon(mimeType) {
  const iconClasses = {
    // Media
    'image': 'fa-file-image',
    'audio': 'fa-file-audio',
    'video': 'fa-file-video',
    // Documents
    'application/pdf': 'fa-file-pdf',
    'application/msword': 'fa-file-word',
    'application/vnd.ms-word': 'fa-file-word',
    'application/vnd.oasis.opendocument.text': 'fa-file-word',
    'application/vnd.openxmlformatsfficedocument.wordprocessingml': 'fa-file-word',
    'application/vnd.ms-excel': 'fa-file-excel',
    'application/vnd.openxmlformatsfficedocument.spreadsheetml': 'fa-file-excel',
    'application/vnd.oasis.opendocument.spreadsheet': 'fa-file-excel',
    'application/vnd.ms-powerpoint': 'fa-file-powerpoint',
    'application/vnd.openxmlformatsfficedocument.presentationml': 'fa-file-powerpoint',
    'application/vnd.oasis.opendocument.presentation': 'fa-file-powerpoint',
    'text/plain': 'fa-file-text',
    'text/html': 'fa-file-code',
    'application/json': 'fa-file-code',
    // Archives
    'application/gzip': 'fa-file-archive',
    'application/zip': 'fa-file-archive',
  };

  for (const type in iconClasses) {
    if (mimeType.startsWith(type)) {
      return iconClasses[type];
    }
  }

  return 'fa-file';
}


export function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  } else if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  } else if (bytes >= 1024) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else {
    return bytes + ' bytes';
  }
}
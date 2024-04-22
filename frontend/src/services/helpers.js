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
    // Folder/Directory
    'inode/directory': 'fa-folder',
  };

  for (const type in iconClasses) {
    if (mimeType.startsWith(type)) {
      return iconClasses[type];
    }
  }

  return 'fa-file';
}

export function replaceSpecialCharacters(str) {
  const specialCharsMap = {
      'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A',
      'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a',
      'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O',
      'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ō' : 'o',
      'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
      'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
      'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
      'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
      'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
      'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
      'Ý': 'Y', 'ý': 'y', 'ÿ': 'y',
      'Ñ': 'N', 'ñ': 'n',
      'Ç': 'C', 'ç': 'c',
      'ß': 'ss',
      'Æ': 'AE', 'æ': 'ae',
      'Œ': 'OE', 'œ': 'oe',
      'Š': 'S', 'š': 's',
      'Ž': 'Z', 'ž': 'z'
  };

  return str.replace(/[^\w\s]/gi, (char) => specialCharsMap[char] || char);
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

export function cap(string) {
  if (typeof string !== 'string' || !string.trim()) {
    return string;
  }
  
  const firstChar = string.trim().charAt(0);
  if (!isNaN(parseInt(firstChar))) {
    return string;
  }
  
  return firstChar.toUpperCase() + string.trim().slice(1);
}

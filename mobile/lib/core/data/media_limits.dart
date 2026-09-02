const int maxUploadBytes = 10 * 1024 * 1024;

const Set<String> allowedUploadExtensions = {'jpg', 'jpeg', 'png', 'webp', 'pdf'};

String mimeTypeForExtension(String extension) {
  switch (extension.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'pdf':
      return 'application/pdf';
    default:
      throw ArgumentError('Неподдерживаемый тип файла');
  }
}

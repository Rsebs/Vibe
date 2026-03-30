import * as FileSystem from 'expo-file-system';
const MediaFileReader = require('jsmediatags/build2/MediaFileReader');
const StringUtils = require('jsmediatags/build2/StringUtils');

// Polyfill atob
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const atob = (input: string = '') => {
  let str = input.replace(/=+$/, '');
  let output = '';

  if (str.length % 4 == 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
  }
  for (let bc = 0, bs = 0, buffer, i = 0;
    buffer = str.charAt(i++);
    ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
      bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
  ) {
    buffer = chars.indexOf(buffer);
  }

  return output;
};

export default class ExpoFileReader extends MediaFileReader {
  _uri: string;
  _size: number;
  _fileData: { [key: number]: number };

  constructor(uri: string) {
    super();
    this._uri = uri;
    this._size = 0;
    this._fileData = {};
  }

  static canReadFile(file: any) {
    return typeof file === 'string' && (file.startsWith('file://') || file.startsWith('content://'));
  }

  init(callbacks: { onSuccess: () => void; onError: (err: any) => void }) {
    FileSystem.getInfoAsync(this._uri).then(info => {
      if (info.exists && !info.isDirectory) {
        this._size = info.size || 0;
        callbacks.onSuccess();
      } else {
        callbacks.onError({ type: 'fs', info: 'File does not exist' });
      }
    }).catch(err => {
      callbacks.onError({ type: 'fs', info: 'Error getting file info', err });
    });
  }

  loadRange(range: [number, number], callbacks: { onSuccess: () => void; onError: (err: any) => void }) {
    const position = Math.max(0, range[0]);
    const length = range[1] - position + 1;

    FileSystem.readAsStringAsync(this._uri, {
      position,
      length,
      encoding: 'base64',
    }).then(base64Str => {
      const binaryString = atob(base64Str);
      for (let i = 0; i < binaryString.length; i++) {
        this._fileData[position + i] = binaryString.charCodeAt(i);
      }
      callbacks.onSuccess();
    }).catch(err => {
      callbacks.onError({ type: 'fs', info: 'Error reading file', err });
    });
  }

  getByteAt(offset: number) { 
    if (this._fileData[offset] === undefined) {
      throw new Error(`Offset ${offset} hasn't been loaded yet.`);
    }
    return this._fileData[offset]; 
  }

  getSize() { return this._size; }
}

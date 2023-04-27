export function decode(return_value: string): string {

  let bytes_arr: ArrayBuffer = String.UTF8.encode(return_value);
  let bytes: Uint8Array = Uint8Array.wrap(bytes_arr);
  return bytes.toString();
}

export function hex_encode(bytes: Uint8Array): string {
  let hexString: string = "";
  for (let i = 0; i < bytes.length; i++) {
    let hexByte: string = bytes[i].toString(16);
    if (hexByte.length < 2) {
      hexByte = "0" + hexByte;
    }
    hexString += hexByte;
  }
  return hexString;
}

export function hex_decode(hexString: string): Uint8Array {
  let bytes: Uint8Array = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    let hexByte: string = hexString.substr(i * 2, 2);
    bytes[i] = <u8>parseInt(hexByte, 16);
  }
  return bytes;
}
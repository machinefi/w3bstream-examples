import {
  GetDataByRID,
  GetDB,
  JSON,
  Log,
  SendTx,
  SetDB,
} from "@w3bstream/wasm-sdk";
export { alloc } from "@w3bstream/wasm-sdk";

// payload like {
// "chainId": 4690,
// "address":"0x4BF7916893DfA78834B2F8B535654682d36e1163",
// "mintTo":"0x9117f5EF4156709092f79740a97b1638cA399A00",
// }
export function start(rid: i32): i32 {
  Log("start from typescript");
  const message = GetDataByRID(rid);
  Log("wasm received message:" + message);

  let jsonObj: JSON.Obj = JSON.parse(message) as JSON.Obj;
  let chainIdOrNull: JSON.Integer | null = jsonObj.getInteger("chainId");
  let ERC20Address: JSON.Str | null = jsonObj.getString("address");
  let MintTo: JSON.Str | null = jsonObj.getString("mintTo");
  let value = GetDB("clicks");
  if (!value) {
    SetDB("clicks", 1);
  } else {
    SetDB("clicks", (parseInt(value) + 1) as i32);
    Log("wasm get value:" + value.toString());
  }
  if (chainIdOrNull && ERC20Address && MintTo) {
    if (value && parseInt(value) % 5 == 0) {
      const res = SendTx(
        chainIdOrNull.valueOf() as i32,
        ERC20Address.valueOf(),
        "0",
        `0x40c10f19000000000000000000000000${MintTo.valueOf().replace(
          "0x",
          ""
        )}0000000000000000000000000000000000000000000000000de0b6b3a7640000`
      );
      Log("wasm send tx result:" + res);
    }
  } else {
    Log(`params invalid`);
  }
  return 0;
}

export function abort(
  message: string | null,
  fileName: string | null,
  lineNumber: u32,
  columnNumber: u32
): void {}

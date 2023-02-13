package main

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"math/big"

	"github.com/machinefi/w3bstream-wasm-golang-sdk/blockchain"
	"github.com/machinefi/w3bstream-wasm-golang-sdk/database"
	"github.com/machinefi/w3bstream-wasm-golang-sdk/log"
	"github.com/machinefi/w3bstream-wasm-golang-sdk/stream"
	"github.com/tidwall/gjson"
)

func main() {}

//export start
func _start(rid uint32) int32 {
	log.Log(fmt.Sprintf("start received: %d", rid))
	message, err := stream.GetDataByRID(rid)
	if err != nil {
		log.Log("error: " + err.Error())
		return -1
	}
	res := string(message)

	Connections := gjson.Get(res, "Connections")
	Account := gjson.Get(res, "Account")
	count := getDB("clicks") + 1

	if Connections.Int() > 100 {
		setDB("clicks", count)
	}

	if count%5 == 0 {
		blockchain.SendTx(
			4690, // chain id
			"0xb73eE6EB5b1984c78CCcC49eA7Ad773E71d74F51", // W3BERC20 contract address
			big.NewInt(0), // value
			fmt.Sprintf("40c10f19000000000000000000000000%s0000000000000000000000000000000000000000000000000de0b6b3a7640000", Account.String()), //send to account
		)
		log.Log("send tx")
	}

	return 0
}

func getDB(key string) int32 {
	val, err := database.Get(key)
	if err != nil {
		return 0
	}
	var ret int32
	buf := bytes.NewBuffer(val)
	binary.Read(buf, binary.LittleEndian, &ret)
	return ret
}

func setDB(key string, val int32) {
	buf := new(bytes.Buffer)
	binary.Write(buf, binary.LittleEndian, val)
	_ = database.Set(key, buf.Bytes())
}

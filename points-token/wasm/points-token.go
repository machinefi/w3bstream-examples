package main

import (
	"fmt"
	"math/big"

	"github.com/machinefi/w3bstream-wasm-golang-sdk/blockchain"
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

	Points := gjson.Get(res, "Points")
	Account := gjson.Get(res, "Account")

	log.Log("wasm get Points from json: " + Points.String())

	if Points.Int() > 1000 {
		blockchain.SendTx(
			4690, // chain id
			"0xb73eE6EB5b1984c78CCcC49eA7Ad773E71d74F51", //W3BERC20 contract address
			big.NewInt(0),
			fmt.Sprintf("40c10f19000000000000000000000000%s0000000000000000000000000000000000000000000000000de0b6b3a7640000", Account.String()),
		)
		log.Log("W3BStreamToken has been sent to :" + Account.String())
	}

	return 0
}

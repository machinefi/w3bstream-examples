# Device Proof

 > This example mainly demonstrates how to make devices in the physical world communicate with w3bstream nodes.

First of all, there will be a trusted data source, which can be an esp32 single chip microcomputer or any device in the physical world. In this example, esp32 is used to send the data source, and then wasm applet will receive the data transmitted by the device. After analyzing the data, it will actively mint a W3BStream ERC20 token in the `IoTeX` testnet to the account you set up. Here are the notes in the code.

## Send data
The payload you are about to send is a string in json format, and you can send data to w3bstream in any of the following ways
```json
{
    "Device_id": "368ef287-40f9-4358-8221-00012235554",
    "Location_latitude": 10,
    "Location_longitude": -10,
    "Device_status": 1,
    "UL_throughput": 3770633,
    "DL_throughput": 1370858,
    "UL_utilization": 38,
    "DL_utilization": 14,
    "Connections": 395,
    "Device_alarms": 5,
    "Record_timestamp": 1655787124,
    "Data_source": "488",
    "Message": "",
    "Account":"YOUR ACCOUNT ADDRESS WITHOUT 0x"
  }
```

Please note that the data you want to send must contain Account and there is no 0x

`curl`
```bash
curl --location --request POST 'http://localhost:8888/srv-applet-mgr/v0/event/project_01' \
--header 'event_type: 2147483647' \
--header 'Content-Type: application/json' \
--data-raw '{
    "payload":"{\"Device_id\":\"368ef287-40f9-4358-8221-9e989efa9300\",\"Location_latitude\":10,\"Location_longitude\":-10,\"Device_status\":1,\"UL_throughput\":3770633,\"DL_throughput\":1370858,\"UL_utilization\":38,\"DL_utilization\":14,\"Connections\":395,\"Device_alarms\":5,\"Record_timestamp\":1655787124,\"Data_source\":\"488\",\"Message\":\"\",\"Account\":\"610CBDa6f0037B4141A5B949f56479106BeCb1E9\"}"
}'
```

`javascript`
```javascript
var myHeaders = new Headers();
myHeaders.append("event_type", "2147483647");
myHeaders.append("Content-Type", "application/json");

var raw = JSON.stringify({
  "payload": "{\"Device_id\":\"368ef287-40f9-4358-8221-9e989efa9300\",\"Location_latitude\":10,\"Location_longitude\":-10,\"Device_status\":1,\"UL_throughput\":3770633,\"DL_throughput\":1370858,\"UL_utilization\":38,\"DL_utilization\":14,\"Connections\":395,\"Device_alarms\":5,\"Record_timestamp\":1655787124,\"Data_source\":\"488\",\"Message\":\"\",\"Account\":\"610CBDa6f0037B4141A5B949f56479106BeCb1E9\"}"
});

var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: raw,
  redirect: 'follow'
};

fetch("http://localhost:8888/srv-applet-mgr/v0/event/project_01", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));

```

`go`
```go
package main

import (
  "fmt"
  "strings"
  "net/http"
  "io/ioutil"
)

func main() {

  url := "http://localhost:8888/srv-applet-mgr/v0/event/project_01"
  method := "POST"

  payload := strings.NewReader(`{`+"
"+`
    "payload":"{\"Device_id\":\"368ef287-40f9-4358-8221-9e989efa9300\",\"Location_latitude\":10,\"Location_longitude\":-10,\"Device_status\":1,\"UL_throughput\":3770633,\"DL_throughput\":1370858,\"UL_utilization\":38,\"DL_utilization\":14,\"Connections\":395,\"Device_alarms\":5,\"Record_timestamp\":1655787124,\"Data_source\":\"488\",\"Message\":\"\",\"Account\":\"610CBDa6f0037B4141A5B949f56479106BeCb1E9\"}"`+"
"+`
}`)

  client := &http.Client {
  }
  req, err := http.NewRequest(method, url, payload)

  if err != nil {
    fmt.Println(err)
    return
  }
  req.Header.Add("event_type", "2147483647")
  req.Header.Add("Content-Type", "application/json")

  res, err := client.Do(req)
  if err != nil {
    fmt.Println(err)
    return
  }
  defer res.Body.Close()

  body, err := ioutil.ReadAll(res.Body)
  if err != nil {
    fmt.Println(err)
    return
  }
  fmt.Println(string(body))
}
```
## Send data use esp32
You can refer this doc [README.md](/click2earn/README.md#hardware)

## Receive data
After receiving the data, applet will output the following log to docker. Every time you send the data five times, your account will mint an erc20 token.

![txhash](https://user-images.githubusercontent.com/35157091/198268955-9c625299-fc45-46c2-be6e-af3a4873a68b.png)

There is the erc20 token contract address `0xb73eE6EB5b1984c78CCcC49eA7Ad773E71d74F51`

You can check it in [spoon](https://app.spoon.limo/github/spoonproject/examples?path=W3BStream%20ERC20.json)

## Check token
If you want to see the change in the number of tokens more easily, you can go to [web iopay](https://web.iopay.me/) to check it

First you can switch to IoTeX testnet,and enter the account which you want to observer.

![image](https://user-images.githubusercontent.com/35157091/198533989-e70ceb70-3994-4471-b02a-df6e122a0294.png)

And then enter the W3BStream Token address `0xb73eE6EB5b1984c78CCcC49eA7Ad773E71d74F51` to the search box 

![image](https://user-images.githubusercontent.com/35157091/198534451-21979812-c7bf-4adb-a495-7e74f9e37d36.png)

We found four tokens in our observer account.

🎉Congratulations, you have completed all the examples, and you can start using w3bstream happily.

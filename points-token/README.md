# Points to Token

 > This example mainly demonstrates how to use a traditional centralized service provider to dock to W3BStream

After receiving the data, applet will output the following log to docker. Your account will mint an erc20 token.
First of all, there is a traditional centralized service provider, which provides customers with an incentive. If customers accumulate 1000 points at the service provider, then the service provider will mint an ERC20 Token to the user.

## Send data
In this example, a relatively simple data structure is used, and a json format string is sent, which contains only points and account
```json
{
    "Points": 2000,
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
    "payload":"{\"Points\":2000,\"Account\":\"9117f5EF4156709092f79740a97b1638cA399A00\"}"
}'
```

`javascript`
```javascript
var myHeaders = new Headers();
myHeaders.append("event_type", "2147483647");
myHeaders.append("Content-Type", "application/json");

var raw = JSON.stringify({
  "payload": "{\"Points\":2000,\"Account\":\"9117f5EF4156709092f79740a97b1638cA399A00\"}"
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
    "payload":"{\"Points\":2000,\"Account\":\"9117f5EF4156709092f79740a97b1638cA399A00\"}"`+"
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
After receiving the data, applet will output the following log to docker. Your account will mint an erc20 token.

![0ed36c3a70d837ba6a357bc4b73127f](https://user-images.githubusercontent.com/35157091/199143442-76d4b5eb-86c1-4b47-ae3c-bcec2958f8ce.jpg)


There is the erc20 token contract address `0xb73eE6EB5b1984c78CCcC49eA7Ad773E71d74F51`


## Check Token
You can check it in [README](/device-proof/README.md#receive-data)


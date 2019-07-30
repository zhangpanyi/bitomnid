# ominibtc
比特币及USDT钱包中间件，提供方便的BTC/USDT转账、地址管理、资金归集和收款通知等功能。

## 1. 快速开始
```
git clone https://github.com/zhangpanyi/ominibtc.git
cd ominibtc
npm install && npm start
```

## 2. 配置文件
由于工程中只有配置模板，第一次启动服务前必须执行 `node init_config.js` 命令，用于自动生成配置文件，然后酌情修改。

## 3. 接口列表

### 1. 创建地址

**请求参数说明** 

方法名称: `extNewAddr`

**返回参数说明** 

|类型|说明|
|:-----|----- |
|string  |地址  |

**示例代码**

```
// 请求示例
{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "extNewAddr",
    "params": []
}

// 返回结果
{"id":"1","result":"mxe8zsSJKgn2msrADEJ43pdRpWJQzJv4WM"}
```

### 2. 资金归集
此接口用于将充值账户的BTC/USDT余额归集到主钱包地址。

**请求参数说明** 

方法名称: `extCollect`

|参数名|类型|说明|
|:-----  |:-----|----- |
|symbol |string   |货币符合  |
|minAmount |string   |最小USDT金额 |

**返回参数说明** 

|类型|说明|
|:-----|----- |
|array of string  |交易ID列表  |

**示例代码**

```
// 请求示例
{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "extCollect",
    "params": ["BTC"]
}

// 返回结果
{"id":"1","result":["aa03cad7c6be7c876b0f6268d55dc816fdc2116a2b44d103710feafabd6758c8"]}
```

### 3. 发送手续费
此接口用于向拥有USDT余额的充值账户地址转移一笔BTC手续费。

**请求参数说明** 

方法名称: `extSendFee`

|参数名|类型|说明|
|:-----  |:-----|----- |
|minAmount |string   |接收者最小USDT金额 |

**返回参数说明** 

|类型|说明|
|:-----|----- |
|string  |交易ID  |

**示例代码**

```
// 请求示例
{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "extSendFee",
    "params": ["10"]
}

// 返回结果
{"id":"1","result":"aa03cad7c6be7c876b0f6268d55dc816fdc2116a2b44d103710feafabd6758c8"}
```

### 4. 发送BTC/USDT
此接口用于从主钱包地址发送一出BTC/USDT。

**请求参数说明** 

方法名称: `extSendToken`

|参数名|类型|说明|
|:-----  |:-----|----- |
|to |string   |接收者 |
|symbol |string |货币符号 |
|amount | string | 发送金额 |

**返回参数说明** 

|类型|说明|
|:-----|----- |
|string  |交易ID  |

**示例代码**

```
// 请求示例
{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "extSendToken",
    "params": ["mmFnYQekoM4Cndna5mMZgWLgByHFaCMy35","BTC","0.1"]
}

// 返回结果
{"id":"1","result":"aa03cad7c6be7c876b0f6268d55dc816fdc2116a2b44d103710feafabd6758c8"}
```

### 5. 获取交易信息
此接口用于BTC/USDT交易信息。

**请求参数说明** 

方法名称: `extGetTransaction`

|参数名|类型|说明|
|:-----  |:-----|----- |
|txid |string   |交易ID |


**示例代码**

```
// 请求示例
{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "extGetTransaction",
    "params": ["2287d8052fac7be29a3dde0e609e4c697e808ed39fe06125955f60d45c11bc50"]
}

// 返回结果
{
	"id": "1",
	"result": {
		"amount": 0.00125136,
		"confirmations": 0,
		"trusted": false,
		"txid": "2287d8052fac7be29a3dde0e609e4c697e808ed39fe06125955f60d45c11bc50",
		"walletconflicts": [],
		"time": 1564490455,
		"timereceived": 1564490455,
		"bip125-replaceable": "no",
		"details": [{
			"account": "payment",
			"address": "mmFnYQekoM4Cndna5mMZgWLgByHFaCMy35",
			"category": "receive",
			"amount": 0.00125136,
			"label": "payment",
			"vout": 0
		}],
		"hex": "0100000001296ea9fccf5b5720397a368357c25e0aa5ec151207c318c5759a94533dbf5030010000006b483045022100cff3a27fcfada8e1fd4ea4735011525e44cebd2316c0bb02884cd29bbc475b3f02207858fa0d14ccd1d2f044af4d428ae398cc265fc83090a8e7e1d16afe67c918c7012103af7bd7e9895187fa5f3be2a385044c83d71fc22147213203f26285745bb5801bffffffff02d0e80100000000001976a9143ef25fd1a4333d5fd079827fd32fc4166463e52488acc5f19900000000001976a9141826efb6399e3b7978b4af1728f1e007a76cb63e88ac00000000"
	}
}
```

### 6. 获取钱包余额
此接口钱包中BTC/USDT余额。

**请求参数说明** 

方法名称: `extWalletBalance`

|参数名|类型|说明|
|:-----  |:-----|----- |
|symbol |string |货币符号 |

**返回参数说明** 

|类型|说明|
|:-----|----- |
|string  |余额  |

**示例代码**

```
// 请求示例
{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "extWalletBalance",
    "params": ["BTC"]
}

// 返回结果
{"id":1,"result":"0.09545991"}
```
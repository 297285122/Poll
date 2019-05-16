# 投票选举系统API

这是一个简易投票选举服务。管理员发布投票选举活动，用户注册后投票。投票活动开始前，管理员添加投票选举信息，包括活动介绍、候选人信息、活动开始及截至时间等。注册用户在活动期间可进行投票，一个用户只能投票一次，相同账号或相同IP地址视为同一个用户。

### 实现说明

#### 数据存储
本服务主要有用户数据、投票活动信息、投票结果信息。投票活动信息包含活动信息、候选人信息，考虑分步编辑存储，候选人与活动信息分为两个Schema存储。由于活动信息更新不频繁，且活动开始后不可被更改，可将部分重要的候选人信息嵌套在活动信息的Schema中，以加快用户访问活动信息的速度。投票详情与投票统计数据单独存储（目前简单将统计数据理解为得票数，嵌入活动信息中）。

由于需求对数据信息描述不是很详细，目前实现中只存储了极少的必要字段，为区分不同投票活动、候选人信息，起名称需是唯一的。

#### 实现技术
本服务采用nodejs，koa2框架，mongo数据库实现。验证邮件的发送及投票详情的持久化存储采用阿里MQ异步处理，并用Redis缓存活动信息及投票统计，以应对大量用户并发投票。ava、nyc运行单元测试用例。

#### 目录结构

```
poll
├── package.json
├── README.md (文档)
├── src
|   ├── app.js
│   ├── router.js
│   ├── common (可选)
│   │   ├── errorCode.js (内部错误码)
│   │   └── errorMsg.js (错误提示信息)
│   ├── middleware
│   ├── models (Schema)
│   ├── controllers
│   └── proxy
└── tests（测试用例）
    └── helpers
        └── env.js（测试用例的环境变量数据）
```
### 完成情况
目前完成12个API及简单的单元测试(45个测试用例，发送邮件接口暂时未提供用例)。邮件发送与投票数据持久化存储提供了API接口，可以写一个worker（未实现）从MQ中获取消息并调用相应的API处理。
可优化的地方：
<br>1、参数校验，目前的koa2-validation + joi不支持ObjectId验证；</br>
<br>2、完善models与proxys的错误码；</br>
<br>3、代码整理；</br>
<br>4、接口定义可再斟酌；</br>
<br>5、理想的可扩展设计，可将邮件发送、用户部分（包含用户、工作人员）单独实现为公用服务，本服务则只关心投票业务；</br>
<br>6、完善API的单元测试用例，还缺一小部分测试用例。</br>

### 使用说明
本服务需要node 8及以上版本，mongo 3.6及以上版本。请先安装并运行mongo和redis，且设置对应的环境变量（具体说明见.env文件）。运行测试用例前，请在tests/helpers/env.js中填写您的mongo、redis地址等环境变量信息。
<br>源码编译：`npm run build`</br>
<br>运行测试用例：`npm run test`</br>
<br>运行服务：`npm run start` 或用阿里云RCP或RDC部署至Docker容器以提供API访问。</br>

### 接口说明
本服务采用Restful API风格（与我理解的restful api稍有差异），全量更新的方式，API版本信息暂存于URL中。

简要示例
##### 请求示例
```
post: http://127.0.0.1/v1/poll/users
{
  mail:'45632222@163.com',
  psw: '123456'
}
```
##### Global 响应示例
```
{
  code: 0,
  message: 'success',
  data:{
    userId:'5caee5599d1a9c2280b3b283'
  } 
}
```
### <span id = "main">接口目录</span>

|接口|方法|描述|
|:---|:---|:---|
|[/api/:version/poll/users](#users.create)|POST|用户注册|
|[/api/:version/poll/users/email](#users.email)|GET|验证邮箱|
|[/api/:version/poll/users/email](#users.email.send)|POST|发送邮件|
|[/api/:version/poll/candidates](#candidates.create)|POST|增加候选人|
|[/api/:version/poll/candidates](#candidates.get)|GET|查看候选人|
|[/api/:version/poll/candidates](#candidates.update)|PUT|修改候选人|
|[/api/:version/poll/candidates](#candidates.delete)|DELETE|删除候选人|
|[/api/:version/poll/themes](#themes.create)|POST|创建投票活动|
|[/api/:version/poll/themes](#themes.update)|PUT|修改投票活动|
|[/api/:version/poll/themes](#themes.get)|GET|查看投票活动（含结果）|
|[/api/:version/poll/results](#result.update)|PUT|提交投票|
|[/api/:version/poll/results](#result.create)|POST|保存投票结果|

###  <span id = "users.create">POST /api/:version/poll/users </span>
####  [返回接口目录](#main)

描述: 用户通过邮箱来注册账户信息，注册成功后才能进行投票。邮箱验证成功视为注册成功。

<i>注：邮箱验证信息存储在redis中，有效期为1天。此接口并不同步发送验证邮件，只将用户信息写入MQ即返回，由邮件发送worker来处理邮件发送。</i>

#### 请求参数:

|参数|类型|是否必填|描述|示例值|备注|
|:---|:---|:---|:---|:---|:---|
|mail|String|Y|邮箱地址|cindy@163.com|-|
|pwd|String|Y|密码|1900000109|-|

#### 响应参数:

|参数|类型|是否必填|描述|示例值|
|:---|:---:|:---:|:---|:---|
|code|int|Y|返回码|0 = 正常 <br> 其他值表示错误或者异常|
|message|String|Y|返回错误信息|-|
|userId|String|Y|用户ID|'5caee5599d1a9c2280b3b283'|-|

#### 错误编码:

|编码|描述|
|:---|:---:|
|400|参数错误|
|409|用户已注册|
|500|未知错误|


##### 响应示例:

```
{
  code: 0,
  message: 'success',
  data:{
    userId:'5caee5599d1a9c2280b3b283'
  } 
}
```
###  <span id = "users.email">GET /api/:version/poll/users/email?mail=2344455@163.com&&code=9CBF8A4DCB8E30682B927F352D6559A0</span>
####  [返回接口目录](#main)

描述: 验证用户邮箱的有效性。

<i>注：验证成功后返回token信息。</i>

#### 错误编码:

|编码|描述|
|:---|:---:|
|400|参数错误，错误的链接|
|403|无效链接，如验证信息已过期|


##### 响应示例
```
{
  code: 0,
  message: 'success',
  data: {
    token: ''
  }
}
```
###  <span id = "users.email.send">POST /api/:version/poll/users/email </span>
####  [返回接口目录](#main)

描述: 发送验证邮件。

<i>注：此接口仅供worker调用。</i>

#### 请求参数:

|参数|类型|是否必填|描述|示例值|备注|
|:---|:---|:---|:---|:---|:---|
|mail|String|Y|邮箱地址|cindy@163.com|-|
|code|String|Y|验证码|1900000109|-|

#### 响应参数:

|参数|类型|是否必填|描述|示例值|
|:---|:---:|:---:|:---|:---|
|code|int|Y|返回码|0 = 正常 <br> 其他值表示错误或者异常|
|message|String|Y|返回错误信息|-|

#### 错误编码 // todo

##### 响应示例:

```
{
  code: 0,
  message: 'success',
}
```

###  <span id = "candidates.create">POST /api/:version/poll/candidates </span>
####  [返回接口目录](#main)

描述: 新增候选人信息。

#### 请求参数：

|参数|类型|是否必填|描述|示例值|备注|
|:---|:---|:---|:---|:---|:---|
|candidateName|String|Y|候选人姓名|王二|-|
|works|String|Y|作品信息|'i am a bunny'|-|

####  响应参数：

|参数|类型|是否必填|描述|示例值|
|:---|:---:|:---:|:---|:---|
|code|int|Y|返回码|0 = 正常 <br> 其他值表示错误或者异常|
|message|String|Y|返回错误信息|-|
|candidateId|String|Y|候选人ID|2008450740201411110000174436|-|

#### 错误编码:

|编码|描述|
|:---|:---:|
|400|参数错误|
|409|候选人已存在|
|500|未知错误|

##### 请求示例
```
{
  candidateName: '王二',
  works: 'i am a bunny',
}
```
##### 响应示例
```
{
  code: 0,
  message: 'success',
  data:{
    candidateId:'2008450740201411110000174436'
  }
}
```

###  <span id = "candidates.get">GET /api/:version/poll/candidates </span>
####  [返回接口目录](#main)

描述: 查看候选人详细信息。

#### 请求参数：

|参数|类型|是否必填|描述|示例值|备注|
|:---|:---|:---|:---|:---|:---|
|candidateId|String|Y|候选人ID|2008450740201411110000174436|-|

####  响应参数：

|参数|类型|是否必填|描述|示例值|
|:---|:---:|:---:|:---|:---|
|code|int|Y|返回码|0 = 正常 <br> 其他值表示错误或者异常|
|message|String|Y|返回错误信息|-|
|candidateId|String|Y|候选人ID|2008450740201411110000174436|-|
|candidateName|String|Y|候选人姓名|王二|-|
|works|String|Y|作品信息|i am a bunny|-|

#### 错误编码:

|编码|描述|
|:---|:---:|
|404|未找到候选人信息|
|400|参数错误|


##### 请求示例
```
GET /api/v1/poll/candidates?candidateId=2008450740201411110000174436
```
##### 响应示例
```
{
  code: 0,
  message: 'success',
  data:{
    candidateId:'2008450740201411110000174436',
    candidateName: '王二',
    works: 'i am a bunny',
  }
}
```

###  <span id = "candidates.update">PUT /api/:version/poll/candidates/:candidateId </span>
####  [返回接口目录](#main)

描述: 修改候选人信息。投票活动开始后，候选人信息不能被修改。

#### 请求参数：

|参数|类型|是否必填|描述|示例值|备注|
|:---|:---|:---|:---|:---|:---|
|candidateId|String|Y|候选人ID|‘2008450740201411110000174436’|-|
|candidateName|String|Y|候选人姓名|王二|-|
|works|String|Y|作品信息|'i am a bunny'|-|

####  响应参数：

|参数|类型|是否必填|描述|示例值|
|:---|:---:|:---:|:---|:---|
|code|int|Y|返回码|0 = 正常 <br> 其他值表示错误或者异常|
|message|String|Y|返回错误信息|-|

#### 错误编码:

|编码|描述|
|:---|:---:|
|400|参数错误|
|409|候选人名称冲突|
|403|活动已开始，候选人信息不能被修改|
|500|未知错误|


##### 请求示例
```
PUT /api/v1/poll/candidates/2008450740201411110000174436
{
  candidateName: '王二',
  works: 'i am a bunny',
}
```
##### 响应示例
```
{
  code: 0,
  message: 'success',
}
```

###  <span id = "candidates.delete">DELETE /api/:version/poll/candidates </span>
####  [返回接口目录](#main)

描述: 删除候选人信息。已参与投票活动的候选人，需将其从相应的活动中移出后才能进行删除操作。投票活动开始后，候选人信息不能被删除（因为投票活动信息不能被修改）。

#### 请求参数：

|参数|类型|是否必填|描述|示例值|备注|
|:---|:---|:---|:---|:---|:---|
|candidateId|String|Y|候选人ID|'2008450740201411110000174436'|-|

####  响应参数：

|参数|类型|是否必填|描述|示例值|
|:---|:---:|:---:|:---|:---|
|code|int|Y|返回码|0 = 正常 <br> 其他值表示错误或者异常|
|message|String|Y|返回错误信息|-|

#### 错误编码:

|编码|描述|
|:---|:---:|
|400|参数错误|
|403|候选人已参加活动，需将其移出活动，才能对其进行删除操作|

##### 请求示例
```
{
  candidateId:'2008450740201411110000174436'
}
```
##### 响应示例
```
{
  code: 0,
  message: 'success',
 }
```

###  <span id = "themes.create">POST /api/:version/poll/themes </span>
####  [返回接口目录](#main)

描述: 创建投票活动。

<i>注：考虑到候选人信息多，将候选人信息分步存储。创建投票活动前，请先创建候选人信息。</i>

#### 请求参数：

|参数|类型|是否必填|描述|示例值|备注|
|:---|:---|:---|:---|:---|:---|
|themeName|String|Y|活动名称|摄影大赛|-|
|descripton|String|Y|活动描述|第十届全国大学生摄影大赛|-|-|
|candidates|Array|Y|候选人信息集合|-|候选人数不少于4个不多于10个|
|candidateId|String|Y|候选人ID|'2008450740201411110000174436'|-|
|start|Number|N|投票开始时间|1557884072|时间搓，单位为秒|
|end|Number|N|投票截止时间|1557904072|时间搓，单位为秒|

####  响应参数：
|参数|类型|是否必填|描述|示例值|备注|
|:---|:---:|:---:|:---|:---|:---|
|code|int|Y|返回码|0 = 正常 <br> 其他值表示错误或者异常|
|message|String|Y|返回错误信息|-|
|themeId|String|Y|活动Id|‘5cd908ae63afab148c963361’|-|

#### 错误编码:

|编码|描述|
|:---|:---:|
|400|参数错误|
|409|投票活动已存在|
|500|未知错误|

##### 请求示例
```
{
  themeName: '摄影大赛',
  descripton: '第十届全国大学生摄影大赛',
  candidates: [{
    candidateId:'2008450740201411110000174436',
  },
  ……
  ],
  start: ,
  end: ,
}
```
##### 响应示例
```
{
  code: 0,
  message: 'success',
  data: {
    themeId:'5cd908ae63afab148c963361',
  }
}
```
###  <span id = "themes.update">POST /api/:version/poll/themes/:themeId </span>
####  [返回接口目录](#main)

描述: 修改投票活动信息，包括投票起始截止时间、参与活动的候选人信息等。

<i>注：投票活动开始后，其信息不再允许被修改，包含候选人信息。</i>

#### 请求参数：

|参数|类型|是否必填|描述|示例值|备注|
|:---|:---|:---|:---|:---|:---|
|themeName|String|Y|活动名称|摄影大赛|-|
|descripton|String|Y|活动描述|第十届全国大学生摄影大赛|-|-|
|candidates|Array|Y|候选人信息集合|-|候选人数不少于4个不多于10个|
|candidateId|String|Y|候选人ID|'2008450740201411110000174436'|-|
|start|Number|N|投票开始时间|1557884072|时间搓，单位为秒|
|end|Number|N|投票截止时间|1557904072|时间搓，单位为秒|

####  响应参数：
|参数|类型|是否必填|描述|示例值|备注|
|:---|:---:|:---:|:---|:---|:---|
|code|int|Y|返回码|0 = 正常 <br> 其他值表示错误或者异常|
|message|String|Y|返回错误信息|-|

#### 错误编码:

|编码|描述|
|:---|:---:|
|400|参数错误|
|409|投票活动名称冲突|
|403|投票活动已开始或结束，投票活动信息不能被修改|
|500|未知错误|

##### 请求示例
```
{
  themeName: '摄影大赛',
  descripton: '第十届全国大学生摄影大赛’，
  candidates: [{
    candidateId:'2008450740201411110000174436',
  },
  ……
  ],
  start: 1557884072,
  end: 1557904072,
}
```
##### 响应示例
```
{
  code: 0,
  message: 'success'
}
```
###  <span id = "themes.get">GET /api/:version/poll/themes?themeId=5cd908ae63afab148c963361 </span>
####  [返回接口目录](#main)

描述: 查看投票活动详细情况，包含投票结果信息。

<i>注：投票结果理解为候选人的得票数。投票活动信息会被缓存至redis中。目前投票结果与投票活动信息嵌套存储。投票期间，投票结果从redis中读取，投票详情数据更新至mongo后，从mongo中读取。（需求中未具体要求查看投票活动信息）</i>

#### 请求参数：

|参数|类型|是否必填|描述|示例值|备注|
|:---|:---|:---|:---|:---|:---|
|themeId|String|Y|活动Id|'2008450740201411110000174436'|-|

####  响应参数：

|参数|类型|是否必填|描述|示例值|备注|
|:---|:---:|:---:|:---|:---|:---|
|code|int|Y|返回码|0 = 正常 <br> 其他值表示错误或者异常|
|message|String|Y|返回错误信息|-|
|themeName|String|Y|活动名称|摄影大赛|-|
|descripton|String|Y|活动描述|第十届全国大学生摄影大赛|-|-|
|candidates|Array|Y|候选人信息集合|-|候选人数不少于4个不多于10个|
|candidateId|String|Y|候选人ID|'2008450740201411110000174436'|-|
|votes|Number|Y|候选人得票数|123|-|
|start|Number|N|投票开始时间|1557884072|时间搓，单位为秒|
|end|Number|N|投票截止时间|1557904072|时间搓，单位为秒|

#### 错误编码:

|编码|描述|
|:---|:---:|
|400|参数错误|
|404|未找到投票活动信息|

##### 请求示例
```
GET /api/v1/poll/themes?themeId=5cd908ae63afab148c963361 
```
##### 响应示例
```
{
  code: 0,
  message: 'success'
  data: {
  themeName: '摄影大赛',
  descripton: '第十届全国大学生摄影大赛’，
  candidates: [{
    candidateId:'2008450740201411110000174436',
    votes: 89,
  },
  ……
  ],
  start: 1557884072,
  end: 1557904072,
}
```
###  <span id = "result.update">PUT /api/:version/poll/results </span>
####  [返回接口目录](#main)

 描述: 用户提交投票。
 
<i>注：相同ip地址或邮箱地址视为同一用户。投票期间，用户投票的统计信息保存在redis中，投票详情写入MQ（可考虑将详情保存至redis并从redis更新到mongo中）。后续由投票worker将数据存储到mongo中。</i>

#### 请求参数:
|参数|类型|是否必填|描述|示例值|备注|
|:---|:---|:---|:---|:---|:---|
|themeId|String|Y|投票活动ID|-|-|
|mail|String|Y|邮箱地址|cindy@163.com|-|
|candidateId|Array|Y|候选人ID|['5caee5599d1a9c2280b3b283']|-|

#### 响应参数:
|参数|类型|是否必填|描述|示例值|
|:---|:---:|:---:|:---|:---|
|code|int|Y|返回码|0 = 正常 <br> 其他值表示错误或者异常|
|message|String|Y|返回错误信息|-|

#### 错误编码:

|编码|描述|
|:---|:---:|
|400|参数错误|
|403|投票已结束或未开始或用户已完成投票|
|500|未知错误|


##### 请求示例
```
{
  themeId: '4568450740201411110005820870',
  mail: '123456789@qq.com',
  candidateId：['1008450740201411110005820873'],
}
```
##### 响应示例
```
{
  code: 0,
  message: 'success',
}
```

###  <span id = "result.create">POST /api/:version/poll/results </span>
####  [返回接口目录](#main)

 描述: 保存用户投票信息。
 
 <i>注：此API仅供持久化存储投票信息的worker调用。</i>

#### 请求参数:
|参数|类型|是否必填|描述|示例值|备注|
|:---|:---|:---|:---|:---|:---|
|themeId|String|Y|投票活动ID|-|-|
|mail|String|Y|邮箱地址|cindy@163.com|-|
|ipAdress|String|Y|ip地址|'192.168.5.1'|用户提交投票时，系统会将ip地址写入消息中|
|candidateId|Array|Y|候选人ID|['5caee5599d1a9c2280b3b283']|-|

#### 响应参数:
|参数|类型|是否必填|描述|示例值|
|:---|:---:|:---:|:---|:---|
|code|int|Y|返回码|0 = 正常 <br> 其他值表示错误或者异常|
|message|String|Y|返回错误信息|-|

#### 错误编码:

|编码|描述|
|:---|:---:|
|400|参数错误|
|403|用户已完成投票|
|500|未知错误|


##### 请求示例
```
{
  themeId: '4568450740201411110005820870',
  mail: '123456789@qq.com',
  ipAdress: '192.168.5.1',
  candidateId：['1008450740201411110005820873'],
}
```
##### 响应示例
```
{
  code: 0,
  message: 'success',
}
```


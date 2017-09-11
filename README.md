# STYLISH :tophat:

## Synopsis

Stylish is an AWS Lambda function returning a webpage's dominant color palette.

## Setup

Follow [this tutorial :link:](http://docs.aws.amazon.com/lambda/latest/dg/automating-deployment.html) for automating deployment of Lambda-based applications.

## Tests

```
tkmcc$ npm run local

> stylish@0.0.1 local /Users/tkmcc/code/stylish
> node run.js

WebSocket URL: ws://localhost:4937/stylish-ws
[29991: -0] Begin
URL: http://tkm.io/
[28246: -1745] Got message
[28123: -123] Begin png2palette
[27099: -1024] Complete png2palette
[26801: -298] Complete RgbQuant
Palette: {"palette":[[250,250,250],[182,58,60],[209,126,0],[208,175,134],[8,9,3],[126,147,235],[125,209,252],[252,125,215]]}
complete: {"err":null,"result":{"statusCode":200,"headers":{"access-control-allow-origin":"*"},"body":"{\"palette\":[[250,250,250],[182,58,60],[209,126,0],[208,175,134],[8,9,3],[126,147,235],[125,209,252],[252,125,215]]}"}}
callback: err=null, msg={"statusCode":200,"headers":{"access-control-allow-origin":"*"},"body":"{\"palette\":[[250,250,250],[182,58,60],[209,126,0],[208,175,134],[8,9,3],[126,147,235],[125,209,252],[252,125,215]]}"}
```

## Contributors

Open a GitHub issue or make a PR!

## License

[MIT](LICENSE)

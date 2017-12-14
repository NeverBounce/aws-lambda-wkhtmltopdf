# aws-lambda-wkhtmltopdf for API Gateway
Convert HTML to PDF using Webkit (QtWebKit) on AWS Lambda

## Building and Deploying

1. Ensure NPM dependencies are installed (`yarn install` or `npm install`)
2. Run `npm run zip`
3. Upload the `lambda.zip` to the Lambda function

## Input

This lambda function is designed to be hooked up to an GET request on the API Gateway using the lambda proxy method. This means all the data should be placed into the `queryStringParameters` object within the lambda function's own `event` object.

### Source Data

The script will accept either a URL or the base64 encoded HTML data.

```json
{
    "queryStringParameters": {
        "url" : "https://google.com"
    }
}
```

```json
{
    "queryStringParameters": {
        "html_base64" : "PGJvZHk+SGVsbG8gd29ybGQ8L2JvZHk+"
    }
}
```

> The `html_base64` parameter is `<body>Hello world</body>` base64 encoded

### Options

All of the options available to `wkhtmltopdf` via the cli are still available for this script. However the options should be specified as camel-case rather than dashed; e.g. `page-size` would become `pageSize`. For reference view wkhtmltopdf's documentation [here](https://wkhtmltopdf.org/usage/wkhtmltopdf.txt).

To specify command line flags such as `--debug-javascript` specify them in the options camel-cased with the value of `true`.

```json
{
    "queryStringParameters": {
        "html_base64" : "PGJvZHk+SGVsbG8gd29ybGQ8L2JvZHk+",
        "options":
        {
            "pageSize": "letter",
            "debugJavascript": true
        }
    }
}
```

## Response

The output this lambda function will return a object with a `statusCode`, `headers` and a json-encoded `body`. This is for easy consumption by the lambda proxy setup in the API Gateway.

### Successful PDF Conversion

```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json"
  },
  "body": "{\"pdf_base64\":\"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YXBOYW1lIC9BZG9iZS1JZGVudGl0eS1VQ1MgZGVmCi9DTWFwVHlwZSAyIGRlZgoxIGJlZ2luY29kZXNwYWNlcmFuZ2UKPDAwMDA+IDxGRkZGPgplbmRjb2Rlc3BhY2VyYW5nZQoyIGJlZ2luYmZyYW5nZQo8MDAwMD4gPDAwMDA+IDwwMDAwPgo8MDAwMT4gPDAwMDg+IFs8MDA0OD4gPDAwNjU+IDwwMDZDPiA8MDA2Rj4gPDAwMjA+IDwwMDc3PiA8MDA3Mj4gPDAwNjQ+IF0KZW5kYmZyYW5nZQplbmRjbWFwCkNNYXBOYW1lIGN1cnJlbnRkaWN0IC9DTWFwIGRlZmluZXJlc291cmNlIHBvcAplbmQKZW5kCgplbmRzdHJlYW0KZW5kb2JqCjYgMCBvYmoKPDwgL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUwCi9CYXNlRm9udCAvTmltYnVzU2FuTC1SZWd1Ci9FbmNvZGluZyAvSWRlbnRpdHktSAovRGVzY2VuZGFudEZvbnRzIFsxNCAwIFJdCi9Ub1VuaWNvZGUgMTUgMCBSPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIApbCjUgMCBSCl0KL0NvdW50IDEKL1Byb2NTZXQgWy9QREYgL1RleHQgL0ltYWdlQiAvSW1hZ2VDXQo+PgplbmRvYmoKeHJlZgowIDE3CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAzMTQyIDAwMDAwIG4gCjAwMDAwMDAxODEgMDAwMDAgbiAKMDAwMDAwMDI3NiAwMDAwMCBuIAowMDAwMDAwMzYyIDAwMDAwIG4gCjAwMDAwMDMwMDEgMDAwMDAgbiAKMDAwMDAwMDMxMyAwMDAwMCBuIAowMDAwMDAwNjY4IDAwMDAwIG4gCjAwMDAwMDA5ODggMDAwMDAgbiAKMDAwMDAwMDQ4MiAwMDAwMCBuIAowMDAwMDAwNjQ4IDAwMDAwIG4gCjAwMDAwMDEwMDcgMDAwMDAgbiAKMDAwMDAwMTIxNiAwMDAwMCBuIAowMDAwMDAyMjc4IDAwMDAwIG4gCjAwMDAwMDI1MjkgMDAwMDAgbiAKMDAwMDAwMjI1OCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDE3Ci9JbmZvIDEgMCBSCi9Sb290IDcgMCBSCj4+CnN0YXJ0eHJlZgozMjQwCiUlRU9GCg==\"}"
}
```

The body of a successful response will contain a `pdf_base64` property that contains the base64-encoded PDF data. To consume this you'll need to decode the data and either stream it to the browser or write it to a file.

### Timeouts

```json
{
  "statusCode": 503,
  "headers": {
    "Content-Type": "application/json"
  },
  "body": "{\"message\":\"The `wkhtmltopdf` process took too long; this may be due to the input HTML containing external links. The lambda function is unable to load external resources contained outside the VPC. Please base64 encode all images and include them inline. Other external resources like stylesheets and scripts should also be included inline.\"}"
}
```

By default when a lambda function times-out using the lambda proxy method the API Gateway will return an "Internal Error". In order to make this a little more friendly we employ an interval to return a friendly message before the lambda function itself times-out.

### Other Errors

If there's any other errors be it node related or wkhtmltopdf related we'll allow lambda to handle the error reporting itself. The lambda proxy will then tell the API Gateway to return an "Internal Error" message.
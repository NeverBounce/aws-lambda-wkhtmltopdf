#!/usr/bin/env bash
rm -f lambda.zip
zip lambda.zip wkhtmltopdf index.js
zip lambda.zip node_modules/{connected-domain,memorystream,ps-node,slang,table-parser,wkhtmltopdf}/*.{json,js}
zip lambda.zip node_modules/{connected-domain,ps-node,table-parser}/lib/*.js

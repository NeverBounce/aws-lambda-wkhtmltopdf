const wkhtmltopdf = require('wkhtmltopdf');
const MemoryStream = require('memorystream');
const ps = require('ps-node');

// Ensure wkhtmltopdf binary is in the $PATH
process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

exports.handler = function (event, context, callback) {
    console.log("context: " + JSON.stringify(context));
    console.log("request: " + JSON.stringify(event));

    // Boilerplate response method for returning data consumable by API Gateway's Lambda Proxy
    const response = (body, status = 200, headers = {}) => {
        callback(null, {
            statusCode: status,
            headers: Object.assign({}, headers, {'Content-Type': 'application/json'}),
            body: JSON.stringify(body)
        });
    };

    if(!event.queryStringParameters) {
        return response({
            message: 'No input was specified. Please specify either the ' +
            '`html_base64` or `url` parameter and try again'
        }, 422);
    }

    const {html_base64, url} = event.queryStringParameters;

    // Check to ensure we have at least one input
    if (!html_base64 && !url) {
        return response({
            message: 'The `html_base64` and `url` are both empty, ' +
            'please specify one of them.'
        }, 422);
    }

    // Check if both are present
    if (html_base64 && url) {
        return response({
            message: 'The `html_base64` and `url` are both present,' +
            ' unable to process both at once. Please split up the request and ' +
            'try again.'
        }, 422);
    }

    // Get options and merge them with out defaults
    let {options} = event.queryStringParameters;
    options = Object.assign({
        viewportSize: "1280x1024",
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        marginTop: 0,
        disableExternalLinks: true,
        disableJavascript: true,
    }, options || {});

    // Ensure the out parameter isn't being used in the wkhtmltopdf option is disabled
    if (options && options.out !== undefined) {
        return response({
            message: 'The `out` option for wkhtmltopdf is not ' +
            'supported here, please remove this parameter and try again.'
        }, 422);
    }
    console.log("wkhtmltopdf options: " + JSON.stringify(options));

    // Gracefully handle timeouts to prevent API gateway from returning an
    // "Internal Error" response when the lambda function timeouts
    let timeout = false;
    let interval = setInterval(() => {
        console.log("remaining time: " + context.getRemainingTimeInMillis());
        if (context.getRemainingTimeInMillis() < 500) {
            timeout = true;
            clearInterval(interval);

            // We need to manually kill the wkhtmltopdf process to properly exit
            // the script, otherwise it'll hang until the child wkhtmltopdf
            // process exits. The wkhtmltopdf node library creates a detached
            // child on Linux systems which means we can't just kill that one,
            // so we'll kill all wkhtmltopdf processes.
            ps.lookup({
                command: 'wkhtmltopdf'
            }, function (err, resultList) {
                if (err) {
                    throw new Error(err);
                }

                resultList.forEach(function (process) {
                    if (process) {
                        console.log('PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments);
                        ps.kill(process.pid, function (err) {
                            if (err) {
                                throw new Error(err);
                            }
                            else {
                                console.log('Process %s has been killed!', process.pid);
                            }
                        });
                    }
                });
            });
        }
    }, 250);

    const memStream = new MemoryStream();

    // Get input either a base64 encoded string of the HTML or a url that
    // returns the HTML you want to encode
    const input = (html_base64) ? new Buffer(html_base64, 'base64').toString('utf8') : url;
    return wkhtmltopdf(input, options, function (err) {
        clearInterval(interval);

        // Internal Err (wkhtmltopdf failed)
        if (err) {
            return callback(err);
        }

        // Display a friendly error message when a timeout would occur
        if (timeout) {
            return response({
                message: 'The `wkhtmltopdf` process took too long; this may be ' +
                'due to the input HTML containing external links. The lambda ' +
                'function is unable to load external resources contained outside' +
                ' the VPC. Please base64 encode all images and include them ' +
                'inline. Other external resources like stylesheets and scripts ' +
                'should also be included inline.'
            }, 503);
        }

        // Return base64 encoded pdf data
        return response({pdf_base64: memStream.read().toString('base64')});
    }).pipe(memStream);
};
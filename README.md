# hapi-swaggered
Yet another hapi (>= 6.x < 8.x) plugin providing swagger compliant API specifications based on routes and joi schemas to be used with swagger-ui.

[![Build Status](https://travis-ci.org/z0mt3c/hapi-swaggered.png)](https://travis-ci.org/z0mt3c/hapi-swaggered)
[![Dependency Status](https://gemnasium.com/z0mt3c/hapi-swaggered.png)](https://gemnasium.com/z0mt3c/hapi-swaggered)


## Install
```bash
npm install hapi-swaggered --save
```

## Swagger-UI
This plugin does not include a [swagger-ui](https://github.com/wordnik/swagger-ui) interface. It just serves the bare swagger 1.2 (working on 2.0) compliant json feed.
If you are looking for an easy swagger-ui plugin to drop-in? Have a look at:
* [hapi-swaggered-ui](https://github.com/z0mt3c/hapi-swaggered-ui)

## Plugin Configuration
* `requiredTags`: an array of strings, only routes with on of the specified tags will be exposed, defaults to: `['api']`
* `produces`: an array of mime type strings, defaults to: `[ 'application/json' ]`
* `consumes`: an array of mime type strings, defaults to: `[ 'application/json' ]`
* `apiVersion`: version string of your api, which will be exposed, defaults to null
* `endpoint`: route path to the swagger specification, defaults to: `'/swagger'`
* `routeTags`: an array of strings, all routes exposed by hapi-swaggered will be tagged as specified, defaults to `['swagger']`
* `stripPrefix`: a path prefix which should be stripped from the swagger specifications. E.g. your root resource are located under `/api/v12345678/resource` you might want to strip `/api/v12345678`, defaults to null
* `responseValidation`: boolean, turn response validation on and off for hapi-swaggered routes, defaults to true
* `cache`: caching options for the swagger schema generation as specified in [`server.method()`](https://github.com/hapijs/hapi/blob/master/docs/Reference.md#servermethodname-fn-options) of hapi, defaults to: `{ expiresIn: 15 * 60 * 1000 }`
* `descriptions`: object for defining root level resource descriptions. E.g. you have endpoints `/get/this` and `/get/that` they will be groupped unter /get and you are able to define a description through this object as `{ 'get': 'get this and that' }`, defaults to null
* `info`: exposed swagger api informations, defaults to null
  * `title`: string
  * `description`: string
  * `termsOfServiceUrl`: string
  * `contact`: string
  * `license`: string
  * `licenseUrl`: string


## Overwriting configuration on server level
Some configurations can be overwritten on server level:

```js
var server = Hapi.createServer('localhost', 8000, {
  labels: ['api'],
  app: {
    swagger: {
      stripPrefix: '/api',
      descriptions: {}  // see plugin configuration for descriptions aboove
      info: {} // see plugin configuration for info aboove
    }
  }
});
```

## Simple example configuration
Swagger ui should be configured to use /api2/swagger2 in this example ;-)

```js
server.pack.register({
  plugin: require('hapi-swaggered'),
  options: {
    apiVersion: require('./package.json').version,
  }
}, {
  select: 'api',
  route: {
    prefix: '/swagger'
  }
}, function (err) {
  if (err) {
    throw err;
  }
});
```

## Features
### File upload
To achieve a file upload your route should look like as follows. (Important parts are the swaggerType in the Joi options as well as the allowed payload)

```js
plugin.route({
    method: 'POST',
    path: '/test/fileUpload',
    config: {
        tags: ['api'],
        validate: {
            payload: Joi.object().keys({ name: Joi.string(), file: Joi.any().options({ swaggerType: 'file' }) })
        },
        handler: function (request, reply) {
            // handle file upload as specified in payload.output
            reply({ name: request.payload.name });
        },
        payload: {
            allow: 'multipart/form-data'
            output: 'data'|'stream'|'file'
        }
    }
});
```

### Tag filtering
Routes can be filtered for tags through the tags query parameter beside the requiredTags property which is always required to be present.

For example:

* `?tags=public,beta (equal to ?tags=+public,+beta)`
  * will only show apis and routes with tag public AND/OR beta.
* `?tags=public,-beta (equal to ?tags=+public,-beta)`
  * will only show apis and routes with tag public AND NOT beta.

## Known problems
### No repsonse types
The routes response schemas which hapi-swaggered is parsing will be dropped by hapi whenever the response validation is disabled. In this case hapi-swaggered will not be able to show any response types. A very low sampling rate is sufficient to keep the repsonse types.

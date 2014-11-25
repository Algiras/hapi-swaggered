var Hoek = require('hoek');
var Joi = require('joi');
var Schema = require('./schema');
//var _ = require('lodash');
var utils = require('./utils');

var SWAGGER_VERSION = '2.0';
var defaultOptions = {
    requiredTags: ['api'],
    produces: ['application/json'],
    consumes: ['application/json'],
    // route configuration
    endpoint: '/swagger',
    routeTags: ['swagger'],
    responseValidation: true,
    endpointDeclarationSuffix: '/list',
    cache: {
        expiresIn: 15 * 60 * 1000
    },
    schemes: [
        "http"
    ]
};



module.exports.register = function(plugin, options, next) {
    //var Hapi = plugin.hapi;
    var settings = Hoek.applyToDefaults(defaultOptions, options);
    Joi.assert(options, Schema.PluginOptions);

    settings.pluginRoutePrefix = plugin.config.route.prefix || '';

    var internals = {
        resources: require('./resources'),
        keyGenerator: function(request) {
            return 'hapi-swaggered:' + request.server.info.uri + ':' + request.url.path;
        }
    };

    var methods = {
        resources: function(request, reply) {
            var serverSettings = Hoek.reach(request, 'server.settings.app.swagger');
            var currentSettings = utils.getCurrentSettings(settings, serverSettings);
            var host = utils.extractBaseHost(currentSettings, request);
            var resources = internals.resources(currentSettings, request.server.table(), request.query.tags);

            var data = {
                swagger: SWAGGER_VERSION,
                host: host,
                schemes: currentSettings.schemes,
                externalDocs: currentSettings.externalDocs,
                paths: resources.paths,
                definitions: resources.definitions
            };

            utils.setNotEmpty(data, 'info', currentSettings.info);
            utils.setNotEmpty(data, 'basePath', null);
            reply(data);
        }
    };

    var methodOptions = {
        cache: settings.cache,
        generateKey: internals.keyGenerator
    };

    plugin.method('resources', methods.resources, methodOptions);

    var handler = {
        resources: function(request, reply) {
            //return plugin.methods.resources(request, reply);
            return methods.resources(request, reply);
        }
    };

    plugin.route({
        method: 'GET',
        path: settings.endpoint,
        config: {
            tags: settings.routeTags,
            auth: settings.auth,
            validate: {
                query: {
                    tags: Joi.string().optional()
                }
            },
            handler: handler.resources,
            response: settings.responseValidation === true ? {
                schema: Schema.Swagger
            } : undefined
        }
    });

    // expose settings
    plugin.expose('settings', settings);
    next();
};

module.exports.register.attributes = {
    pkg: require('../package.json')
};

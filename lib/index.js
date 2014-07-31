var Hoek = require('hoek');
var Boom = require('boom');
var Joi = require('joi');
var Path = require('path');
var Schema = require('./schema');
var _ = require('lodash');
var utils = require('./utils');

var SWAGGER_VERSION = '1.2';
var defaultOptions = {
    endpoint: '/swagger',
    requiredTag: 'api'
};

module.exports.register = function (plugin, options, next) {
    var settings = Hoek.applyToDefaults(defaultOptions, options || {});
    settings.pluginRoutePrefix = plugin.config.route.prefix || '';

    var internals = {
        apiDeclaration: require('./apiDeclaration')(settings),
        apiList: require('./apiListing')(settings)
    };

    var handler = {};

    handler.resourceListing = function (request, reply) {
        var apiRefs = internals.apiList(request.server.table(), request.query.tags, Hoek.reach(request, 'server.settings.app.swagger'));

        reply({
            swaggerVersion: SWAGGER_VERSION,
            apiVersion: settings.apiVersion,
            apis: apiRefs,
            info: Hoek.reach(request, 'server.settings.app.swagger.info') || settings.info,
            authorizations: settings.authorizations
        });
    };

    handler.apiDeclaration = function (request, reply) {
        var models = {};
        var apis = internals.apiDeclaration(request.server.table(), request.params.path, models, request.query.tags, Hoek.reach(request, 'server.settings.app.swagger'));

        var apiDeclaration = {
            swaggerVersion: SWAGGER_VERSION,
            apiVersion: settings.apiVersion,
            basePath: utils.extractBaseHost(settings, request),
            resourcePath: '/' + request.params.path,
            produces: [ 'application/json' ],
            apis: apis,
            models: models
        };

        reply(apiDeclaration);
    };

    plugin.route({
        method: 'GET',
        path: options.endpoint,
        config: {
            tags: ['api', 'swagger'],
            auth: settings.auth,
            validate: {
                query: {
                    tags: Joi.string().optional()
                    //api_key: Joi.string().optional()
                }
            },
            handler: handler.resourceListing,
            response: {
                schema: Schema.ResourceListing
            }
        }
    });

    plugin.route({
        method: 'GET',
        path: options.endpoint + '/{path}',
        config: {
            tags: ['api', 'swagger'],
            auth: settings.auth,
            validate: {
                params: {
                    path: Joi.string().required()
                },
                query: {
                    //tags: Joi.string().optional(),
                    //api_key: Joi.string().optional()
                }
            },
            handler: handler.apiDeclaration,
            response: {
                schema: Schema.APIDeclaration
            }
        }
    });

    next();
};

module.exports.register.attributes = {
    pkg: require('../package.json')
};
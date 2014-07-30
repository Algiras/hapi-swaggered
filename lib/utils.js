var Hoek = require('hoek');
var _ = require('lodash');
var utils = module.exports = {};

utils.isResourceRoute = function (routePath, resourceName) {
    return routePath && resourceName && routePath.search('^/' + resourceName + '(/|$)') === 0;
};

utils.getDescription = function (settings, prefix) {
    return Hoek.reach(settings, 'descriptions.' + prefix) || undefined;
};


utils.extractBaseHost = function (settings, request) {
    var protocol = settings.protocol || request.server.info.protocol || 'http';
    var hostname = protocol + '://' + request.headers.host;
    return hostname;
};

utils.extractBasePath = function (settings, request) {
    var basePath = utils.extractBaseHost(settings, request) + settings.pluginRoutePrefix + settings.endpoint + '/';
    return basePath;
};

utils.generateNameFromSchema = function (schema) {
    var children = Hoek.reach(schema, '_inner.children');
    var keys = _.map(_.pluck(children, 'key'), function (key) {
        return key.charAt(0).toUpperCase() + key.slice(1);
    });
    keys.push('Model');
    return keys.join('');
};

utils.filterRoutesByTags = function (settings, tags, routingTable) {
    if (tags || settings.requiredTag) {
        tags = _.union(tags ? tags.split(',') : []);

        routingTable = _.filter(routingTable, function (route) {
            var routeTags = route.settings.tags;

            if (_.isUndefined(routeTags) || _.isEmpty(routeTags)) {
                return false;
            } else if (settings.requiredTag && !_.contains(routeTags, settings.requiredTag)) {
                return false;
            } else {
                return tags.length == 0 || Hoek.intersect(routeTags, tags).length > 0;
            }
        });
    }

    return routingTable;
};

utils.filterRoutesByPrefix = function (routingTable, prefix) {
    var prefixLength = prefix.length;
    return _.filter(routingTable, function (route) {
        var routePath = route.path;
        return routePath.indexOf(prefix) === 1 && (routePath.length === prefixLength + 1 || routePath.charAt(prefixLength + 1) === '/');
    });
};

utils.groupRoutesByPath = function (routingTable) {
    var routesPerPath = _.reduce(routingTable, function (memo, route) {
        var entry = memo[route.path] = memo[route.path] || [];
        entry.push(route);
        return memo;
    }, {});
    return routesPerPath;
};

utils.extractAPIKeys = function (routingTable) {
    var apiPrefixes = _.reduce(routingTable, function (memo, route) {
        var path = route.path;

        if (path !== '/') {
            var indexOfFirstSlash = path.indexOf('/', 1);
            var prefix = indexOfFirstSlash !== -1 ? path.substring(0, indexOfFirstSlash) : path.substr(0);

            if (memo.indexOf(prefix) === -1) {
                memo.push(prefix);
            }
        }

        return memo;
    }, []);

    apiPrefixes.sort();

    return apiPrefixes;
};


var numberSuffix = /_([0-9]+)$/;

utils.generateFallbackName = function (modelName) {
    if (_.isEmpty(modelName)) {
        return null
    }

    var match = numberSuffix.exec(modelName);

    if (match) {
        var count = parseInt(match[1], 10) + 1;
        modelName = modelName.replace(numberSuffix, '_' + count);
    } else {
        modelName = modelName + '_' + 2;
    }

    return modelName;
};
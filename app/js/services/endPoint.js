'use strict';
/**
 * EndPointService
 * A Service, which gets the available SPARQL classes from the Server.
 *
 * @namespace data.results.bindings
 *
 */

angular.module('GSB.services.endPoint', ['GSB.config'])
    .factory('EndPointService', function ($http, $q, $log, globalConfig) {
        _.mixin(_.str.exports());
        var factory = {};

        var service = Jassa.service;
        var sponate = Jassa.sponate;

        var sparqlService = new service.SparqlServiceHttp(globalConfig.baseURL, globalConfig.defaultGraphURIs);
        sparqlService = new service.SparqlServiceCache(sparqlService);
        var store = new sponate.StoreFacade(sparqlService, globalConfig.prefixes);

        var cleanURI = function (str) {
            if (str === null || str === undefined) {
                return str;
            }
            return str.replace(/^<+/, '').replace(/>+$/, '');
        };

        var makeLabel = function($label, uri){
            if ($label !== null) {
                return $label;
            } else {
                uri = cleanURI(uri);
                var hashPos = uri.lastIndexOf('#'),
                    slashPos = uri.lastIndexOf('/');
                if (hashPos > slashPos) {
                    $label = uri.substr(hashPos + 1);
                } else {
                    $label = uri.substr(slashPos + 1);
                }
                return $label;
            }

        };

        /**
         * Returns the type of a Property
         * @param $range
         * @returns string
         */
        factory.getPropertyType = function ($range) {
            var findKey = function(uri) {
                return _.findKey(globalConfig.propertyTypeURIs, function(elem) {
                    var regex = new RegExp('(?:' + elem.join('|') + ')');
                    return regex.test(uri);
                });
            };
            for(var i = 0, j = $range.length; i<j ;i++){
                var key = findKey($range[i]);
                if(key){
                    return key;
                }
            }
            return 'STANDARD_PROPERTY';
        };

        factory.getAvailableClasses = function (uri) {
            if (!store.hasOwnProperty('classes')) {

                store.addMap({
                    name: 'classes',
                    template: [
                        {
                            id: '?uri',
                            $label: '?label',
                            $comment: '?comment'
                        }
                    ],
                    from: globalConfig.endPointQueries.getAvailableClasses
                });
            }
            var flow = store.classes.find();
            return $q.when(flow.asList())
                .then(function (classCollection) {
                    if(uri){
                        classCollection = _.filter(classCollection, {id: '<' + cleanURI(uri) + '>'});
                    }
                    classCollection.forEach(function (doc) {
                        doc.uri = cleanURI(doc.id);
                        doc.$label = makeLabel(doc.$label,doc.uri);
                    });
                    return classCollection;
                })
                .catch(function (error) {
                    $log.error('Getting Classes:', error);
                });
        };

        var getOtherClasses = function (uri, query, key) {
            if (!store.hasOwnProperty(key + uri)) {
                store.addMap({
                    name: key + uri,
                    template: [
                        {
                            id: '?uri'
                        }
                    ],
                    from: query
                });
            }
            var flow = store[key + uri].find();

            return $q.when(flow.asList())
                .then(function (docs) {
                    var ret = [];
                    docs.forEach(function (doc) {
                        ret.push(doc.id);
                    });
                    return ret;
                })
                .catch(function (err) {
                    $log.error('An error occurred: ', err);
                });

        };

        factory.getSuperAndEqClasses = function (uri) {
            return getOtherClasses(cleanURI(uri),globalConfig.endPointQueries.getSuperAndEqClasses.replace('%uri%',cleanURI(uri)),'SuperAndEqClasses');
        };

        factory.getSubAndEqClasses = function (uri) {
            return getOtherClasses(cleanURI(uri),globalConfig.endPointQueries.getSubAndEqClasses.replace('%uri%',cleanURI(uri)),'SubAndEqClasses');
        };

        var getProperties = function (uri, query, inverse, filterURI) {
            var storeKey = (inverse)? 'InverseProperties' : 'DirectProperties';
            if (!store.hasOwnProperty(storeKey + uri)) {
                store.addMap({
                    name: storeKey + uri,
                    template: [
                        {
                            id: '?uri',
                            $comment: '?comment',
                            $label: '?label',
                            $range : [{id:'?range'}]
                        }
                    ],
                    from: query
                });
            }
            var flow = store[storeKey + uri].find();

            return $q.when(flow.asList())
                .then(function (propertyCollection) {
                    if(filterURI){
                        propertyCollection = _.filter(propertyCollection, {id: '<' + cleanURI(filterURI) + '>'});
                    }
                    propertyCollection.forEach(function (property) {
                        property.$range = _.pluck(property.$range,'id');
                        property.uri = cleanURI(property.id);
                        property.$label = makeLabel(property.$label,property.uri);
                        if (inverse) {
                            property.type = 'INVERSE_PROPERTY';
                            property.$label = 'is ' + property.$label + ' of';
                        } else {
                            property.type = factory.getPropertyType(property.$range);
                        }
                        property.alias = property.$label;
                    });
                    return propertyCollection;
                })
                .catch(function (err) {
                    $log.error('An error occurred: ', err);
                });
        };

        factory.getDirectProperties = function (uri, filterURI){
            return getProperties(cleanURI(uri), globalConfig.endPointQueries.getDirectProperties.replace('%uri%',uri), false, filterURI);
        };

        factory.getInverseProperties = function (uri, filterURI){
            return getProperties(cleanURI(uri), globalConfig.endPointQueries.getInverseProperties.replace('%uri%',uri), true, filterURI);
        };

        factory.getPropertyDetails = function (uri, property){
            if(property.type === 'INVERSE_PROPERTY'){
                return factory.getInverseProperties(cleanURI(uri), property.uri);
            }else{
                return factory.getDirectProperties(cleanURI(uri), property.uri);
            }
        };

        return factory;

    });

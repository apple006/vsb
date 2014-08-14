'use strict';

/**
 * PropertyInstanceCtrl
 * Controller for a single property.
 */

angular.module('GSB.controllers.propertyInstance', ['GSB.config'])
    //Inject $scope, $http, $log and globalConfig (see @ js/config.js) into controller
    .controller('PropertyInstanceCtrl', function ($scope, $log, $q, EndPointService) {

        /**
         * Changes visibility of a given propertyInst
         */
        $scope.togglePropertyView = function () {
            $scope.propertyInst.view = !$scope.propertyInst.view;
        };

        $scope.togglePropertyExists = function () {
            $scope.propertyInst.filterExists = !$scope.propertyInst.filterExists;
        };

        $scope.toggleHasFilter = function () {
            $scope.propertyInst.hasFilter = !$scope.propertyInst.hasFilter;
        };

        /**
         * Changes optionality of a given propertyInst
         */
        $scope.togglePropertyOptional = function () {
            $scope.propertyInst.optional = !$scope.propertyInst.optional;
        };

        var getSubClassesOfRange = function(range){
            if(range !== undefined) {
                var originalPropertyRange = angular.copy(range);
                var promises = [];
                originalPropertyRange.forEach(function (rangeItem) {
                    promises.push(EndPointService.getSubAndEqClasses(rangeItem));
                });
                return $q.all(promises).then(function ($range) {
                    $range = _.uniq(_.flatten($range));
                    $scope.propertyInst.$range = $range;
                    return $range;
                }).then(function ($range) {
                    if ($scope.propertyInst.type !== 'INVERSE_PROPERTY') {
                        $scope.propertyInst.type = EndPointService.getPropertyType($range);
                    }
                });
            }
        };

        if ($scope.propertyInst.$copied) {
            EndPointService.getPropertyDetails($scope.subjectInst.uri, $scope.propertyInst)
                .then(function (data) {
                    data = data[0];
                    if(data !== undefined) {
                        $scope.propertyInst.$comment = data.$comment;
                        $scope.propertyInst.$label = data.$label;
                        $scope.propertyInst.$range = data.$range;
                        $scope.propertyInst.type = data.type;
                        return data.$range;
                    }
                })
                .then(getSubClassesOfRange)
                .catch(function (error) {
                    $log.error(error);
                });
        }else{
            getSubClassesOfRange($scope.propertyInst.$range);
        }

        $scope.$watch('propertyInst.linkTo', function (nv) {
            if (typeof nv === 'string') {
                var subjects = $scope.subjects;
                for (var i = 0, j = subjects.length; i < j; i++) {
                    if (subjects[i].hasOwnProperty('alias') && subjects[i].alias === nv) {
                        $scope.propertyInst.linkTo = subjects[i];
                        return;
                    }
                }
            }
        });


    });
'use strict';

angular.module('GSB.controllers.addSubject', ['ngSanitize', 'ui.select']).
  controller('AddSubjectCtrl', ['$scope', 'mockUpClasses', function($scope, mockUpClasses) {
    //  List of available subject classes that can be added to the workspace.
    $scope.availableSubjectClasses = [];

    //  Subject selected to be added to the workspace.
    $scope.selectedSubjectClass = undefined;
    
    mockUpClasses.get($scope.availableSubjectClasses);
    
    $scope.uiAddSubject = function() {
      console.log($scope.selectedSubjectClass);
      if($scope.selectedSubjectClass) { // If the selected option is undefined no subject will be added.
        $scope.$emit('newSubjectEvent', $scope.selectedSubjectClass);
	      $scope.selectedSubjectClass = undefined;
      }
    };
  }]);



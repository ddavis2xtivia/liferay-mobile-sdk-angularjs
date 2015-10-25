(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('ThemeService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.getThemes = function(companyId) {
            return service.invoke('/theme/get-themes',[{
                companyId:companyId
            }]);
        };
        service.getWarThemes = function() {
            return service.invoke('/theme/get-war-themes',[{
                
            }]);
        };
        
        // End generated service methods
        return service;
    }])
});
(function() {
    'use strict';

    angular
        .module('mobile.sdk.v62', []);
})();
(function() {
    'use strict';
    // Used only for the BottomSheetExample
    angular
        .module('mobile.sdk.v62')
    ;
})();
(function() {
    'use strict';

    if (!String.prototype.endsWith) {
        String.prototype.endsWith = function(searchString, position) {
            var subjectString = this.toString();
            if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
                position = subjectString.length;
            }
            position -= searchString.length;
            var lastIndex = subjectString.indexOf(searchString, position);
            return lastIndex !== -1 && lastIndex === position;
        };
    }

    angular
        .module('mobile.sdk.v62')
        .factory('SessionService', ['Base64','$cookieStore','$http','$q',function(Base64,$cookieStore,$http,$q) {
            var factory = this;
            var service = {};

            factory.jsonWsUrl = 'api/jsonws/invoke';
            factory.server = 'http://liferaydemo.xtivia.com';
            factory.authenticationTypes = {
                BASIC: 'basic',
                DIGEST: 'digest'
            };


            service.setCredentials = function (username, password) {
                var authdata = Base64.encode(username + ':' + password);
                $http.defaults.headers.common['Authorization'] = 'Basic ' + authdata; // jshint ignore:line
                $cookieStore.put('globals', {
                    currentUser: {
                        username: username,
                        authdata: authdata
                    }
                });
            };

            service.clearCredentials = function () {
                $cookieStore.remove('globals');
                $http.defaults.headers.common.Authorization = 'Basic ';
            };

            service.invoke = function (command) {
                var url = (document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1)?factory.server:'/';
                if(url.endsWith('/')) {
                    url = url + factory.jsonWsUrl;
                } else {
                    url = url + '/' + factory.jsonWsUrl;
                }
                return $q(function(resolve,reject) {
                    $http.post(url,[command]).then(function(resp) {
                        if(resp.data&&Array.isArray(resp.data)) {
                            resolve(resp.data.length>0?resp.data[0]:{});
                        } else {
                            reject(resp.data);
                        }
                    },function(err) {
                        reject(err);
                    });
                });
            };

            service.getImageUrlPrefix = function() {
                return (document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1)?factory.server+'/image':'/image';
            };

            service.setServer = function(server) {
                factory.server = server;
                service.server = factory.server;
            };

            service.authenticationTypes = factory.authenticationTypes;
            service.jsonWsUrl = factory.jsonWsUrl;
            service.server = factory.server;

            return service;
        }])
        .factory('Base64', function () {
            /* jshint ignore:start */

            var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

            return {
                encode: function (input) {
                    var output = "";
                    var chr1, chr2, chr3 = "";
                    var enc1, enc2, enc3, enc4 = "";
                    var i = 0;

                    do {
                        chr1 = input.charCodeAt(i++);
                        chr2 = input.charCodeAt(i++);
                        chr3 = input.charCodeAt(i++);

                        enc1 = chr1 >> 2;
                        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                        enc4 = chr3 & 63;

                        if (isNaN(chr2)) {
                            enc3 = enc4 = 64;
                        } else if (isNaN(chr3)) {
                            enc4 = 64;
                        }

                        output = output +
                            keyStr.charAt(enc1) +
                            keyStr.charAt(enc2) +
                            keyStr.charAt(enc3) +
                            keyStr.charAt(enc4);
                        chr1 = chr2 = chr3 = "";
                        enc1 = enc2 = enc3 = enc4 = "";
                    } while (i < input.length);

                    return output;
                },

                decode: function (input) {
                    var output = "";
                    var chr1, chr2, chr3 = "";
                    var enc1, enc2, enc3, enc4 = "";
                    var i = 0;

                    // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
                    var base64test = /[^A-Za-z0-9\+\/\=]/g;
                    if (base64test.exec(input)) {
                        window.alert("There were invalid base64 characters in the input text.\n" +
                            "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                            "Expect errors in decoding.");
                    }
                    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

                    do {
                        enc1 = keyStr.indexOf(input.charAt(i++));
                        enc2 = keyStr.indexOf(input.charAt(i++));
                        enc3 = keyStr.indexOf(input.charAt(i++));
                        enc4 = keyStr.indexOf(input.charAt(i++));

                        chr1 = (enc1 << 2) | (enc2 >> 4);
                        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                        chr3 = ((enc3 & 3) << 6) | enc4;

                        output = output + String.fromCharCode(chr1);

                        if (enc3 != 64) {
                            output = output + String.fromCharCode(chr2);
                        }
                        if (enc4 != 64) {
                            output = output + String.fromCharCode(chr3);
                        }

                        chr1 = chr2 = chr3 = "";
                        enc1 = enc2 = enc3 = enc4 = "";

                    } while (i < input.length);

                    return output;
                }
            };

            /* jshint ignore:end */

        })
        .factory('SigninService', ['SessionService','GroupService','UserService','$q', function (SessionService,GroupService,UserService,$q) {
            var service = {};

            service.signin = function(authentication) {
                if(authentication) {
                    if(authentication.authenticationType === SessionService.authenticationTypes.BASIC) {
                        SessionService.setCredentials(authentication.credentials.username,authentication.credentials.password);
                    }
                    return $q(function(resolve, reject) {
                        GroupService.getUserSites().then(function(resp){
                            var site = resp[0];
                            UserService.getUserByEmailAddress(site.companyId,authentication.credentials.username)
                                .then(function(resp) {
                                    resolve(resp);
                                },function(err) {
                                    reject(err);
                                });
                        },function(err){
                            reject(err);
                        });
                    });
                }
            };

            return service;
        }]);
})();

(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('AddressService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addAddress = function(className,classPK,street1,street2,street3,city,zip,regionId,countryId,typeId,mailing,primary) {
            return SessionService.invoke('/address/add-address',[{
                className:className
                ,classPK:classPK
                ,street1:street1
                ,street2:street2
                ,street3:street3
                ,city:city
                ,zip:zip
                ,regionId:regionId
                ,countryId:countryId
                ,typeId:typeId
                ,mailing:mailing
                ,primary:primary
            }]);
        };
        service.addAddress = function(className,classPK,street1,street2,street3,city,zip,regionId,countryId,typeId,mailing,primary,serviceContext) {
            return SessionService.invoke('/address/add-address',[{
                className:className
                ,classPK:classPK
                ,street1:street1
                ,street2:street2
                ,street3:street3
                ,city:city
                ,zip:zip
                ,regionId:regionId
                ,countryId:countryId
                ,typeId:typeId
                ,mailing:mailing
                ,primary:primary
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteAddress = function(addressId) {
            return SessionService.invoke('/address/delete-address',[{
                addressId:addressId
            }]);
        };
        service.getAddress = function(addressId) {
            return SessionService.invoke('/address/get-address',[{
                addressId:addressId
            }]);
        };
        service.getAddresses = function(className,classPK) {
            return SessionService.invoke('/address/get-addresses',[{
                className:className
                ,classPK:classPK
            }]);
        };
        service.updateAddress = function(addressId,street1,street2,street3,city,zip,regionId,countryId,typeId,mailing,primary) {
            return SessionService.invoke('/address/update-address',[{
                addressId:addressId
                ,street1:street1
                ,street2:street2
                ,street3:street3
                ,city:city
                ,zip:zip
                ,regionId:regionId
                ,countryId:countryId
                ,typeId:typeId
                ,mailing:mailing
                ,primary:primary
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('AnnouncementsdeliveryService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.updateDelivery = function(userId,type,email,sms,website) {
            return SessionService.invoke('/announcementsdelivery/update-delivery',[{
                userId:userId
                ,type:type
                ,email:email
                ,sms:sms
                ,website:website
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('AnnouncementsentryService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addEntry = function(plid,classNameId,classPK,title,content,url,type,displayDateMonth,displayDateDay,displayDateYear,displayDateHour,displayDateMinute,expirationDateMonth,expirationDateDay,expirationDateYear,expirationDateHour,expirationDateMinute,priority,alert) {
            return SessionService.invoke('/announcementsentry/add-entry',[{
                plid:plid
                ,classNameId:classNameId
                ,classPK:classPK
                ,title:title
                ,content:content
                ,url:url
                ,type:type
                ,displayDateMonth:displayDateMonth
                ,displayDateDay:displayDateDay
                ,displayDateYear:displayDateYear
                ,displayDateHour:displayDateHour
                ,displayDateMinute:displayDateMinute
                ,expirationDateMonth:expirationDateMonth
                ,expirationDateDay:expirationDateDay
                ,expirationDateYear:expirationDateYear
                ,expirationDateHour:expirationDateHour
                ,expirationDateMinute:expirationDateMinute
                ,priority:priority
                ,alert:alert
            }]);
        };
        service.addEntry = function(plid,classNameId,classPK,title,content,url,type,displayDateMonth,displayDateDay,displayDateYear,displayDateHour,displayDateMinute,displayImmediately,expirationDateMonth,expirationDateDay,expirationDateYear,expirationDateHour,expirationDateMinute,priority,alert) {
            return SessionService.invoke('/announcementsentry/add-entry',[{
                plid:plid
                ,classNameId:classNameId
                ,classPK:classPK
                ,title:title
                ,content:content
                ,url:url
                ,type:type
                ,displayDateMonth:displayDateMonth
                ,displayDateDay:displayDateDay
                ,displayDateYear:displayDateYear
                ,displayDateHour:displayDateHour
                ,displayDateMinute:displayDateMinute
                ,displayImmediately:displayImmediately
                ,expirationDateMonth:expirationDateMonth
                ,expirationDateDay:expirationDateDay
                ,expirationDateYear:expirationDateYear
                ,expirationDateHour:expirationDateHour
                ,expirationDateMinute:expirationDateMinute
                ,priority:priority
                ,alert:alert
            }]);
        };
        service.deleteEntry = function(entryId) {
            return SessionService.invoke('/announcementsentry/delete-entry',[{
                entryId:entryId
            }]);
        };
        service.getEntry = function(entryId) {
            return SessionService.invoke('/announcementsentry/get-entry',[{
                entryId:entryId
            }]);
        };
        service.updateEntry = function(entryId,title,content,url,type,displayDateMonth,displayDateDay,displayDateYear,displayDateHour,displayDateMinute,displayImmediately,expirationDateMonth,expirationDateDay,expirationDateYear,expirationDateHour,expirationDateMinute,priority) {
            return SessionService.invoke('/announcementsentry/update-entry',[{
                entryId:entryId
                ,title:title
                ,content:content
                ,url:url
                ,type:type
                ,displayDateMonth:displayDateMonth
                ,displayDateDay:displayDateDay
                ,displayDateYear:displayDateYear
                ,displayDateHour:displayDateHour
                ,displayDateMinute:displayDateMinute
                ,displayImmediately:displayImmediately
                ,expirationDateMonth:expirationDateMonth
                ,expirationDateDay:expirationDateDay
                ,expirationDateYear:expirationDateYear
                ,expirationDateHour:expirationDateHour
                ,expirationDateMinute:expirationDateMinute
                ,priority:priority
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('AnnouncementsflagService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addFlag = function(entryId,value) {
            return SessionService.invoke('/announcementsflag/add-flag',[{
                entryId:entryId
                ,value:value
            }]);
        };
        service.deleteFlag = function(flagId) {
            return SessionService.invoke('/announcementsflag/delete-flag',[{
                flagId:flagId
            }]);
        };
        service.getFlag = function(entryId,value) {
            return SessionService.invoke('/announcementsflag/get-flag',[{
                entryId:entryId
                ,value:value
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('AssetcategoryService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addCategory = function(title,vocabularyId,serviceContext) {
            return SessionService.invoke('/assetcategory/add-category',[{
                title:title
                ,vocabularyId:vocabularyId
                ,serviceContext:serviceContext
            }]);
        };
        service.addCategory = function(parentCategoryId,titleMap,descriptionMap,vocabularyId,categoryProperties,serviceContext) {
            return SessionService.invoke('/assetcategory/add-category',[{
                parentCategoryId:parentCategoryId
                ,titleMap:titleMap
                ,descriptionMap:descriptionMap
                ,vocabularyId:vocabularyId
                ,categoryProperties:categoryProperties
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteCategories = function(categoryIds) {
            return SessionService.invoke('/assetcategory/delete-categories',[{
                categoryIds:categoryIds
            }]);
        };
        service.deleteCategories = function(categoryIds,serviceContext) {
            return SessionService.invoke('/assetcategory/delete-categories',[{
                categoryIds:categoryIds
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteCategory = function(categoryId) {
            return SessionService.invoke('/assetcategory/delete-category',[{
                categoryId:categoryId
            }]);
        };
        service.getCategories = function(className,classPK) {
            return SessionService.invoke('/assetcategory/get-categories',[{
                className:className
                ,classPK:classPK
            }]);
        };
        service.getCategory = function(categoryId) {
            return SessionService.invoke('/assetcategory/get-category',[{
                categoryId:categoryId
            }]);
        };
        service.getChildCategories = function(parentCategoryId) {
            return SessionService.invoke('/assetcategory/get-child-categories',[{
                parentCategoryId:parentCategoryId
            }]);
        };
        service.getChildCategories = function(parentCategoryId,start,end,obc) {
            return SessionService.invoke('/assetcategory/get-child-categories',[{
                parentCategoryId:parentCategoryId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getJsonSearch = function(groupId,name,vocabularyIds,start,end) {
            return SessionService.invoke('/assetcategory/get-json-search',[{
                groupId:groupId
                ,name:name
                ,vocabularyIds:vocabularyIds
                ,start:start
                ,end:end
            }]);
        };
        service.getJsonVocabularyCategories = function(vocabularyId,start,end,obc) {
            return SessionService.invoke('/assetcategory/get-json-vocabulary-categories',[{
                vocabularyId:vocabularyId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getJsonVocabularyCategories = function(groupId,title,vocabularyId,start,end,obc) {
            return SessionService.invoke('/assetcategory/get-json-vocabulary-categories',[{
                groupId:groupId
                ,title:title
                ,vocabularyId:vocabularyId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getVocabularyCategories = function(vocabularyId,start,end,obc) {
            return SessionService.invoke('/assetcategory/get-vocabulary-categories',[{
                vocabularyId:vocabularyId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getVocabularyCategories = function(parentCategoryId,vocabularyId,start,end,obc) {
            return SessionService.invoke('/assetcategory/get-vocabulary-categories',[{
                parentCategoryId:parentCategoryId
                ,vocabularyId:vocabularyId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getVocabularyCategories = function(groupId,name,vocabularyId,start,end,obc) {
            return SessionService.invoke('/assetcategory/get-vocabulary-categories',[{
                groupId:groupId
                ,name:name
                ,vocabularyId:vocabularyId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getVocabularyCategoriesCount = function(groupId,vocabularyId) {
            return SessionService.invoke('/assetcategory/get-vocabulary-categories-count',[{
                groupId:groupId
                ,vocabularyId:vocabularyId
            }]);
        };
        service.getVocabularyCategoriesCount = function(groupId,name,vocabularyId) {
            return SessionService.invoke('/assetcategory/get-vocabulary-categories-count',[{
                groupId:groupId
                ,name:name
                ,vocabularyId:vocabularyId
            }]);
        };
        service.getVocabularyCategoriesDisplay = function(vocabularyId,start,end,obc) {
            return SessionService.invoke('/assetcategory/get-vocabulary-categories-display',[{
                vocabularyId:vocabularyId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getVocabularyCategoriesDisplay = function(groupId,name,vocabularyId,start,end,obc) {
            return SessionService.invoke('/assetcategory/get-vocabulary-categories-display',[{
                groupId:groupId
                ,name:name
                ,vocabularyId:vocabularyId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getVocabularyRootCategories = function(vocabularyId,start,end,obc) {
            return SessionService.invoke('/assetcategory/get-vocabulary-root-categories',[{
                vocabularyId:vocabularyId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getVocabularyRootCategories = function(groupId,vocabularyId,start,end,obc) {
            return SessionService.invoke('/assetcategory/get-vocabulary-root-categories',[{
                groupId:groupId
                ,vocabularyId:vocabularyId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getVocabularyRootCategoriesCount = function(groupId,vocabularyId) {
            return SessionService.invoke('/assetcategory/get-vocabulary-root-categories-count',[{
                groupId:groupId
                ,vocabularyId:vocabularyId
            }]);
        };
        service.moveCategory = function(categoryId,parentCategoryId,vocabularyId,serviceContext) {
            return SessionService.invoke('/assetcategory/move-category',[{
                categoryId:categoryId
                ,parentCategoryId:parentCategoryId
                ,vocabularyId:vocabularyId
                ,serviceContext:serviceContext
            }]);
        };
        service.search = function(groupId,name,categoryProperties,start,end) {
            return SessionService.invoke('/assetcategory/search',[{
                groupId:groupId
                ,name:name
                ,categoryProperties:categoryProperties
                ,start:start
                ,end:end
            }]);
        };
        service.search = function(groupIds,title,vocabularyIds,start,end) {
            return SessionService.invoke('/assetcategory/search',[{
                groupIds:groupIds
                ,title:title
                ,vocabularyIds:vocabularyIds
                ,start:start
                ,end:end
            }]);
        };
        service.search = function(groupId,keywords,vocabularyId,start,end,obc) {
            return SessionService.invoke('/assetcategory/search',[{
                groupId:groupId
                ,keywords:keywords
                ,vocabularyId:vocabularyId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.updateCategory = function(categoryId,parentCategoryId,titleMap,descriptionMap,vocabularyId,categoryProperties,serviceContext) {
            return SessionService.invoke('/assetcategory/update-category',[{
                categoryId:categoryId
                ,parentCategoryId:parentCategoryId
                ,titleMap:titleMap
                ,descriptionMap:descriptionMap
                ,vocabularyId:vocabularyId
                ,categoryProperties:categoryProperties
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('AssetcategorypropertyService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addCategoryProperty = function(entryId,key,value) {
            return SessionService.invoke('/assetcategoryproperty/add-category-property',[{
                entryId:entryId
                ,key:key
                ,value:value
            }]);
        };
        service.deleteCategoryProperty = function(categoryPropertyId) {
            return SessionService.invoke('/assetcategoryproperty/delete-category-property',[{
                categoryPropertyId:categoryPropertyId
            }]);
        };
        service.getCategoryProperties = function(entryId) {
            return SessionService.invoke('/assetcategoryproperty/get-category-properties',[{
                entryId:entryId
            }]);
        };
        service.getCategoryPropertyValues = function(companyId,key) {
            return SessionService.invoke('/assetcategoryproperty/get-category-property-values',[{
                companyId:companyId
                ,key:key
            }]);
        };
        service.updateCategoryProperty = function(categoryPropertyId,key,value) {
            return SessionService.invoke('/assetcategoryproperty/update-category-property',[{
                categoryPropertyId:categoryPropertyId
                ,key:key
                ,value:value
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('AssetentryService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.getCompanyEntries = function(companyId,start,end) {
            return SessionService.invoke('/assetentry/get-company-entries',[{
                companyId:companyId
                ,start:start
                ,end:end
            }]);
        };
        service.getCompanyEntriesCount = function(companyId) {
            return SessionService.invoke('/assetentry/get-company-entries-count',[{
                companyId:companyId
            }]);
        };
        service.getEntries = function(entryQuery) {
            return SessionService.invoke('/assetentry/get-entries',[{
                entryQuery:entryQuery
            }]);
        };
        service.getEntriesCount = function(entryQuery) {
            return SessionService.invoke('/assetentry/get-entries-count',[{
                entryQuery:entryQuery
            }]);
        };
        service.getEntry = function(entryId) {
            return SessionService.invoke('/assetentry/get-entry',[{
                entryId:entryId
            }]);
        };
        service.incrementViewCounter = function(className,classPK) {
            return SessionService.invoke('/assetentry/increment-view-counter',[{
                className:className
                ,classPK:classPK
            }]);
        };
        service.updateEntry = function(groupId,className,classPK,classUuid,classTypeId,categoryIds,tagNames,visible,startDate,endDate,expirationDate,mimeType,title,description,summary,url,layoutUuid,height,width,priority,sync) {
            return SessionService.invoke('/assetentry/update-entry',[{
                groupId:groupId
                ,className:className
                ,classPK:classPK
                ,classUuid:classUuid
                ,classTypeId:classTypeId
                ,categoryIds:categoryIds
                ,tagNames:tagNames
                ,visible:visible
                ,startDate:startDate
                ,endDate:endDate
                ,expirationDate:expirationDate
                ,mimeType:mimeType
                ,title:title
                ,description:description
                ,summary:summary
                ,url:url
                ,layoutUuid:layoutUuid
                ,height:height
                ,width:width
                ,priority:priority
                ,sync:sync
            }]);
        };
        service.updateEntry = function(groupId,className,classPK,classUuid,classTypeId,categoryIds,tagNames,visible,startDate,endDate,publishDate,expirationDate,mimeType,title,description,summary,url,layoutUuid,height,width,priority,sync) {
            return SessionService.invoke('/assetentry/update-entry',[{
                groupId:groupId
                ,className:className
                ,classPK:classPK
                ,classUuid:classUuid
                ,classTypeId:classTypeId
                ,categoryIds:categoryIds
                ,tagNames:tagNames
                ,visible:visible
                ,startDate:startDate
                ,endDate:endDate
                ,publishDate:publishDate
                ,expirationDate:expirationDate
                ,mimeType:mimeType
                ,title:title
                ,description:description
                ,summary:summary
                ,url:url
                ,layoutUuid:layoutUuid
                ,height:height
                ,width:width
                ,priority:priority
                ,sync:sync
            }]);
        };
        service.updateEntry = function(groupId,createDate,modifiedDate,className,classPK,classUuid,classTypeId,categoryIds,tagNames,visible,startDate,endDate,expirationDate,mimeType,title,description,summary,url,layoutUuid,height,width,priority,sync) {
            return SessionService.invoke('/assetentry/update-entry',[{
                groupId:groupId
                ,createDate:createDate
                ,modifiedDate:modifiedDate
                ,className:className
                ,classPK:classPK
                ,classUuid:classUuid
                ,classTypeId:classTypeId
                ,categoryIds:categoryIds
                ,tagNames:tagNames
                ,visible:visible
                ,startDate:startDate
                ,endDate:endDate
                ,expirationDate:expirationDate
                ,mimeType:mimeType
                ,title:title
                ,description:description
                ,summary:summary
                ,url:url
                ,layoutUuid:layoutUuid
                ,height:height
                ,width:width
                ,priority:priority
                ,sync:sync
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('AssettagService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addTag = function(name,tagProperties,serviceContext) {
            return SessionService.invoke('/assettag/add-tag',[{
                name:name
                ,tagProperties:tagProperties
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteTag = function(tagId) {
            return SessionService.invoke('/assettag/delete-tag',[{
                tagId:tagId
            }]);
        };
        service.deleteTags = function(tagIds) {
            return SessionService.invoke('/assettag/delete-tags',[{
                tagIds:tagIds
            }]);
        };
        service.getGroupTags = function(groupId) {
            return SessionService.invoke('/assettag/get-group-tags',[{
                groupId:groupId
            }]);
        };
        service.getGroupTags = function(groupId,start,end,obc) {
            return SessionService.invoke('/assettag/get-group-tags',[{
                groupId:groupId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getGroupTagsCount = function(groupId) {
            return SessionService.invoke('/assettag/get-group-tags-count',[{
                groupId:groupId
            }]);
        };
        service.getGroupTagsDisplay = function(groupId,name,start,end) {
            return SessionService.invoke('/assettag/get-group-tags-display',[{
                groupId:groupId
                ,name:name
                ,start:start
                ,end:end
            }]);
        };
        service.getGroupsTags = function(groupIds) {
            return SessionService.invoke('/assettag/get-groups-tags',[{
                groupIds:groupIds
            }]);
        };
        service.getJsonGroupTags = function(groupId,name,start,end) {
            return SessionService.invoke('/assettag/get-json-group-tags',[{
                groupId:groupId
                ,name:name
                ,start:start
                ,end:end
            }]);
        };
        service.getTag = function(tagId) {
            return SessionService.invoke('/assettag/get-tag',[{
                tagId:tagId
            }]);
        };
        service.getTags = function(className,classPK) {
            return SessionService.invoke('/assettag/get-tags',[{
                className:className
                ,classPK:classPK
            }]);
        };
        service.getTags = function(groupId,classNameId,name) {
            return SessionService.invoke('/assettag/get-tags',[{
                groupId:groupId
                ,classNameId:classNameId
                ,name:name
            }]);
        };
        service.getTags = function(groupId,name,tagProperties,start,end) {
            return SessionService.invoke('/assettag/get-tags',[{
                groupId:groupId
                ,name:name
                ,tagProperties:tagProperties
                ,start:start
                ,end:end
            }]);
        };
        service.getTags = function(groupIds,name,tagProperties,start,end) {
            return SessionService.invoke('/assettag/get-tags',[{
                groupIds:groupIds
                ,name:name
                ,tagProperties:tagProperties
                ,start:start
                ,end:end
            }]);
        };
        service.getTags = function(groupId,classNameId,name,start,end,obc) {
            return SessionService.invoke('/assettag/get-tags',[{
                groupId:groupId
                ,classNameId:classNameId
                ,name:name
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getTagsCount = function(groupId,name) {
            return SessionService.invoke('/assettag/get-tags-count',[{
                groupId:groupId
                ,name:name
            }]);
        };
        service.getTagsCount = function(groupId,classNameId,name) {
            return SessionService.invoke('/assettag/get-tags-count',[{
                groupId:groupId
                ,classNameId:classNameId
                ,name:name
            }]);
        };
        service.getTagsCount = function(groupId,name,tagProperties) {
            return SessionService.invoke('/assettag/get-tags-count',[{
                groupId:groupId
                ,name:name
                ,tagProperties:tagProperties
            }]);
        };
        service.mergeTags = function(fromTagId,toTagId,overrideProperties) {
            return SessionService.invoke('/assettag/merge-tags',[{
                fromTagId:fromTagId
                ,toTagId:toTagId
                ,overrideProperties:overrideProperties
            }]);
        };
        service.mergeTags = function(fromTagIds,toTagId,overrideProperties) {
            return SessionService.invoke('/assettag/merge-tags',[{
                fromTagIds:fromTagIds
                ,toTagId:toTagId
                ,overrideProperties:overrideProperties
            }]);
        };
        service.search = function(groupId,name,tagProperties,start,end) {
            return SessionService.invoke('/assettag/search',[{
                groupId:groupId
                ,name:name
                ,tagProperties:tagProperties
                ,start:start
                ,end:end
            }]);
        };
        service.search = function(groupIds,name,tagProperties,start,end) {
            return SessionService.invoke('/assettag/search',[{
                groupIds:groupIds
                ,name:name
                ,tagProperties:tagProperties
                ,start:start
                ,end:end
            }]);
        };
        service.updateTag = function(tagId,name,tagProperties,serviceContext) {
            return SessionService.invoke('/assettag/update-tag',[{
                tagId:tagId
                ,name:name
                ,tagProperties:tagProperties
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('AssettagpropertyService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addTagProperty = function(tagId,key,value) {
            return SessionService.invoke('/assettagproperty/add-tag-property',[{
                tagId:tagId
                ,key:key
                ,value:value
            }]);
        };
        service.deleteTagProperty = function(tagPropertyId) {
            return SessionService.invoke('/assettagproperty/delete-tag-property',[{
                tagPropertyId:tagPropertyId
            }]);
        };
        service.getTagProperties = function(tagId) {
            return SessionService.invoke('/assettagproperty/get-tag-properties',[{
                tagId:tagId
            }]);
        };
        service.getTagPropertyValues = function(companyId,key) {
            return SessionService.invoke('/assettagproperty/get-tag-property-values',[{
                companyId:companyId
                ,key:key
            }]);
        };
        service.updateTagProperty = function(tagPropertyId,key,value) {
            return SessionService.invoke('/assettagproperty/update-tag-property',[{
                tagPropertyId:tagPropertyId
                ,key:key
                ,value:value
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('AssetvocabularyService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addVocabulary = function(title,serviceContext) {
            return SessionService.invoke('/assetvocabulary/add-vocabulary',[{
                title:title
                ,serviceContext:serviceContext
            }]);
        };
        service.addVocabulary = function(titleMap,descriptionMap,settings,serviceContext) {
            return SessionService.invoke('/assetvocabulary/add-vocabulary',[{
                titleMap:titleMap
                ,descriptionMap:descriptionMap
                ,settings:settings
                ,serviceContext:serviceContext
            }]);
        };
        service.addVocabulary = function(title,titleMap,descriptionMap,settings,serviceContext) {
            return SessionService.invoke('/assetvocabulary/add-vocabulary',[{
                title:title
                ,titleMap:titleMap
                ,descriptionMap:descriptionMap
                ,settings:settings
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteVocabularies = function(vocabularyIds) {
            return SessionService.invoke('/assetvocabulary/delete-vocabularies',[{
                vocabularyIds:vocabularyIds
            }]);
        };
        service.deleteVocabularies = function(vocabularyIds,serviceContext) {
            return SessionService.invoke('/assetvocabulary/delete-vocabularies',[{
                vocabularyIds:vocabularyIds
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteVocabulary = function(vocabularyId) {
            return SessionService.invoke('/assetvocabulary/delete-vocabulary',[{
                vocabularyId:vocabularyId
            }]);
        };
        service.getCompanyVocabularies = function(companyId) {
            return SessionService.invoke('/assetvocabulary/get-company-vocabularies',[{
                companyId:companyId
            }]);
        };
        service.getGroupVocabularies = function(groupId) {
            return SessionService.invoke('/assetvocabulary/get-group-vocabularies',[{
                groupId:groupId
            }]);
        };
        service.getGroupVocabularies = function(groupId,createDefaultVocabulary) {
            return SessionService.invoke('/assetvocabulary/get-group-vocabularies',[{
                groupId:groupId
                ,createDefaultVocabulary:createDefaultVocabulary
            }]);
        };
        service.getGroupVocabularies = function(groupId,start,end,obc) {
            return SessionService.invoke('/assetvocabulary/get-group-vocabularies',[{
                groupId:groupId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getGroupVocabularies = function(groupId,name,start,end,obc) {
            return SessionService.invoke('/assetvocabulary/get-group-vocabularies',[{
                groupId:groupId
                ,name:name
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getGroupVocabulariesCount = function(groupId) {
            return SessionService.invoke('/assetvocabulary/get-group-vocabularies-count',[{
                groupId:groupId
            }]);
        };
        service.getGroupVocabulariesCount = function(groupId,name) {
            return SessionService.invoke('/assetvocabulary/get-group-vocabularies-count',[{
                groupId:groupId
                ,name:name
            }]);
        };
        service.getGroupVocabulariesDisplay = function(groupId,name,start,end,obc) {
            return SessionService.invoke('/assetvocabulary/get-group-vocabularies-display',[{
                groupId:groupId
                ,name:name
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getGroupVocabulariesDisplay = function(groupId,title,start,end,addDefaultVocabulary,obc) {
            return SessionService.invoke('/assetvocabulary/get-group-vocabularies-display',[{
                groupId:groupId
                ,title:title
                ,start:start
                ,end:end
                ,addDefaultVocabulary:addDefaultVocabulary
                ,obc:obc
            }]);
        };
        service.getGroupsVocabularies = function(groupIds) {
            return SessionService.invoke('/assetvocabulary/get-groups-vocabularies',[{
                groupIds:groupIds
            }]);
        };
        service.getGroupsVocabularies = function(groupIds,className) {
            return SessionService.invoke('/assetvocabulary/get-groups-vocabularies',[{
                groupIds:groupIds
                ,className:className
            }]);
        };
        service.getJsonGroupVocabularies = function(groupId,name,start,end,obc) {
            return SessionService.invoke('/assetvocabulary/get-json-group-vocabularies',[{
                groupId:groupId
                ,name:name
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getVocabularies = function(vocabularyIds) {
            return SessionService.invoke('/assetvocabulary/get-vocabularies',[{
                vocabularyIds:vocabularyIds
            }]);
        };
        service.getVocabulary = function(vocabularyId) {
            return SessionService.invoke('/assetvocabulary/get-vocabulary',[{
                vocabularyId:vocabularyId
            }]);
        };
        service.updateVocabulary = function(vocabularyId,titleMap,descriptionMap,settings,serviceContext) {
            return SessionService.invoke('/assetvocabulary/update-vocabulary',[{
                vocabularyId:vocabularyId
                ,titleMap:titleMap
                ,descriptionMap:descriptionMap
                ,settings:settings
                ,serviceContext:serviceContext
            }]);
        };
        service.updateVocabulary = function(vocabularyId,title,titleMap,descriptionMap,settings,serviceContext) {
            return SessionService.invoke('/assetvocabulary/update-vocabulary',[{
                vocabularyId:vocabularyId
                ,title:title
                ,titleMap:titleMap
                ,descriptionMap:descriptionMap
                ,settings:settings
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('BackgroundtaskService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.getBackgroundTaskStatusJson = function(backgroundTaskId) {
            return SessionService.invoke('/backgroundtask/get-background-task-status-json',[{
                backgroundTaskId:backgroundTaskId
            }]);
        };
        service.getBackgroundTasksCount = function(groupId,taskExecutorClassName,completed) {
            return SessionService.invoke('/backgroundtask/get-background-tasks-count',[{
                groupId:groupId
                ,taskExecutorClassName:taskExecutorClassName
                ,completed:completed
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('BlogsentryService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.deleteEntry = function(entryId) {
            return SessionService.invoke('/blogsentry/delete-entry',[{
                entryId:entryId
            }]);
        };
        service.getCompanyEntries = function(companyId,displayDate,status,max) {
            return SessionService.invoke('/blogsentry/get-company-entries',[{
                companyId:companyId
                ,displayDate:displayDate
                ,status:status
                ,max:max
            }]);
        };
        service.getCompanyEntriesRss = function(companyId,displayDate,status,max,type,version,displayStyle,feedURL,entryURL,themeDisplay) {
            return SessionService.invoke('/blogsentry/get-company-entries-rss',[{
                companyId:companyId
                ,displayDate:displayDate
                ,status:status
                ,max:max
                ,type:type
                ,version:version
                ,displayStyle:displayStyle
                ,feedURL:feedURL
                ,entryURL:entryURL
                ,themeDisplay:themeDisplay
            }]);
        };
        service.getEntry = function(entryId) {
            return SessionService.invoke('/blogsentry/get-entry',[{
                entryId:entryId
            }]);
        };
        service.getEntry = function(groupId,urlTitle) {
            return SessionService.invoke('/blogsentry/get-entry',[{
                groupId:groupId
                ,urlTitle:urlTitle
            }]);
        };
        service.getGroupEntries = function(groupId,status,max) {
            return SessionService.invoke('/blogsentry/get-group-entries',[{
                groupId:groupId
                ,status:status
                ,max:max
            }]);
        };
        service.getGroupEntries = function(groupId,displayDate,status,max) {
            return SessionService.invoke('/blogsentry/get-group-entries',[{
                groupId:groupId
                ,displayDate:displayDate
                ,status:status
                ,max:max
            }]);
        };
        service.getGroupEntries = function(groupId,status,start,end) {
            return SessionService.invoke('/blogsentry/get-group-entries',[{
                groupId:groupId
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.getGroupEntries = function(groupId,displayDate,status,start,end) {
            return SessionService.invoke('/blogsentry/get-group-entries',[{
                groupId:groupId
                ,displayDate:displayDate
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.getGroupEntriesCount = function(groupId,status) {
            return SessionService.invoke('/blogsentry/get-group-entries-count',[{
                groupId:groupId
                ,status:status
            }]);
        };
        service.getGroupEntriesCount = function(groupId,displayDate,status) {
            return SessionService.invoke('/blogsentry/get-group-entries-count',[{
                groupId:groupId
                ,displayDate:displayDate
                ,status:status
            }]);
        };
        service.getGroupEntriesRss = function(groupId,displayDate,status,max,type,version,displayStyle,feedURL,entryURL,themeDisplay) {
            return SessionService.invoke('/blogsentry/get-group-entries-rss',[{
                groupId:groupId
                ,displayDate:displayDate
                ,status:status
                ,max:max
                ,type:type
                ,version:version
                ,displayStyle:displayStyle
                ,feedURL:feedURL
                ,entryURL:entryURL
                ,themeDisplay:themeDisplay
            }]);
        };
        service.getGroupsEntries = function(companyId,groupId,displayDate,status,max) {
            return SessionService.invoke('/blogsentry/get-groups-entries',[{
                companyId:companyId
                ,groupId:groupId
                ,displayDate:displayDate
                ,status:status
                ,max:max
            }]);
        };
        service.getOrganizationEntries = function(organizationId,displayDate,status,max) {
            return SessionService.invoke('/blogsentry/get-organization-entries',[{
                organizationId:organizationId
                ,displayDate:displayDate
                ,status:status
                ,max:max
            }]);
        };
        service.getOrganizationEntriesRss = function(organizationId,displayDate,status,max,type,version,displayStyle,feedURL,entryURL,themeDisplay) {
            return SessionService.invoke('/blogsentry/get-organization-entries-rss',[{
                organizationId:organizationId
                ,displayDate:displayDate
                ,status:status
                ,max:max
                ,type:type
                ,version:version
                ,displayStyle:displayStyle
                ,feedURL:feedURL
                ,entryURL:entryURL
                ,themeDisplay:themeDisplay
            }]);
        };
        service.moveEntryToTrash = function(entryId) {
            return SessionService.invoke('/blogsentry/move-entry-to-trash',[{
                entryId:entryId
            }]);
        };
        service.restoreEntryFromTrash = function(entryId) {
            return SessionService.invoke('/blogsentry/restore-entry-from-trash',[{
                entryId:entryId
            }]);
        };
        service.subscribe = function(groupId) {
            return SessionService.invoke('/blogsentry/subscribe',[{
                groupId:groupId
            }]);
        };
        service.unsubscribe = function(groupId) {
            return SessionService.invoke('/blogsentry/unsubscribe',[{
                groupId:groupId
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('BookmarksentryService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addEntry = function(groupId,folderId,name,url,description,serviceContext) {
            return SessionService.invoke('/bookmarksentry/add-entry',[{
                groupId:groupId
                ,folderId:folderId
                ,name:name
                ,url:url
                ,description:description
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteEntry = function(entryId) {
            return SessionService.invoke('/bookmarksentry/delete-entry',[{
                entryId:entryId
            }]);
        };
        service.getEntries = function(groupId,folderId,start,end) {
            return SessionService.invoke('/bookmarksentry/get-entries',[{
                groupId:groupId
                ,folderId:folderId
                ,start:start
                ,end:end
            }]);
        };
        service.getEntries = function(groupId,folderId,start,end,orderByComparator) {
            return SessionService.invoke('/bookmarksentry/get-entries',[{
                groupId:groupId
                ,folderId:folderId
                ,start:start
                ,end:end
                ,orderByComparator:orderByComparator
            }]);
        };
        service.getEntriesCount = function(groupId,folderId) {
            return SessionService.invoke('/bookmarksentry/get-entries-count',[{
                groupId:groupId
                ,folderId:folderId
            }]);
        };
        service.getEntriesCount = function(groupId,folderId,status) {
            return SessionService.invoke('/bookmarksentry/get-entries-count',[{
                groupId:groupId
                ,folderId:folderId
                ,status:status
            }]);
        };
        service.getEntry = function(entryId) {
            return SessionService.invoke('/bookmarksentry/get-entry',[{
                entryId:entryId
            }]);
        };
        service.getFoldersEntriesCount = function(groupId,folderIds) {
            return SessionService.invoke('/bookmarksentry/get-folders-entries-count',[{
                groupId:groupId
                ,folderIds:folderIds
            }]);
        };
        service.getGroupEntries = function(groupId,start,end) {
            return SessionService.invoke('/bookmarksentry/get-group-entries',[{
                groupId:groupId
                ,start:start
                ,end:end
            }]);
        };
        service.getGroupEntries = function(groupId,userId,start,end) {
            return SessionService.invoke('/bookmarksentry/get-group-entries',[{
                groupId:groupId
                ,userId:userId
                ,start:start
                ,end:end
            }]);
        };
        service.getGroupEntries = function(groupId,userId,rootFolderId,start,end) {
            return SessionService.invoke('/bookmarksentry/get-group-entries',[{
                groupId:groupId
                ,userId:userId
                ,rootFolderId:rootFolderId
                ,start:start
                ,end:end
            }]);
        };
        service.getGroupEntriesCount = function(groupId) {
            return SessionService.invoke('/bookmarksentry/get-group-entries-count',[{
                groupId:groupId
            }]);
        };
        service.getGroupEntriesCount = function(groupId,userId) {
            return SessionService.invoke('/bookmarksentry/get-group-entries-count',[{
                groupId:groupId
                ,userId:userId
            }]);
        };
        service.getGroupEntriesCount = function(groupId,userId,rootFolderId) {
            return SessionService.invoke('/bookmarksentry/get-group-entries-count',[{
                groupId:groupId
                ,userId:userId
                ,rootFolderId:rootFolderId
            }]);
        };
        service.moveEntry = function(entryId,parentFolderId) {
            return SessionService.invoke('/bookmarksentry/move-entry',[{
                entryId:entryId
                ,parentFolderId:parentFolderId
            }]);
        };
        service.moveEntryFromTrash = function(entryId,parentFolderId) {
            return SessionService.invoke('/bookmarksentry/move-entry-from-trash',[{
                entryId:entryId
                ,parentFolderId:parentFolderId
            }]);
        };
        service.moveEntryToTrash = function(entryId) {
            return SessionService.invoke('/bookmarksentry/move-entry-to-trash',[{
                entryId:entryId
            }]);
        };
        service.openEntry = function(entry) {
            return SessionService.invoke('/bookmarksentry/open-entry',[{
                entry:entry
            }]);
        };
        service.openEntry = function(entryId) {
            return SessionService.invoke('/bookmarksentry/open-entry',[{
                entryId:entryId
            }]);
        };
        service.restoreEntryFromTrash = function(entryId) {
            return SessionService.invoke('/bookmarksentry/restore-entry-from-trash',[{
                entryId:entryId
            }]);
        };
        service.search = function(groupId,creatorUserId,status,start,end) {
            return SessionService.invoke('/bookmarksentry/search',[{
                groupId:groupId
                ,creatorUserId:creatorUserId
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.subscribeEntry = function(entryId) {
            return SessionService.invoke('/bookmarksentry/subscribe-entry',[{
                entryId:entryId
            }]);
        };
        service.unsubscribeEntry = function(entryId) {
            return SessionService.invoke('/bookmarksentry/unsubscribe-entry',[{
                entryId:entryId
            }]);
        };
        service.updateEntry = function(entryId,groupId,folderId,name,url,description,serviceContext) {
            return SessionService.invoke('/bookmarksentry/update-entry',[{
                entryId:entryId
                ,groupId:groupId
                ,folderId:folderId
                ,name:name
                ,url:url
                ,description:description
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('BookmarksfolderService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addFolder = function(parentFolderId,name,description,serviceContext) {
            return SessionService.invoke('/bookmarksfolder/add-folder',[{
                parentFolderId:parentFolderId
                ,name:name
                ,description:description
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteFolder = function(folderId) {
            return SessionService.invoke('/bookmarksfolder/delete-folder',[{
                folderId:folderId
            }]);
        };
        service.deleteFolder = function(folderId,includeTrashedEntries) {
            return SessionService.invoke('/bookmarksfolder/delete-folder',[{
                folderId:folderId
                ,includeTrashedEntries:includeTrashedEntries
            }]);
        };
        service.getFolder = function(folderId) {
            return SessionService.invoke('/bookmarksfolder/get-folder',[{
                folderId:folderId
            }]);
        };
        service.getFolderIds = function(groupId,folderId) {
            return SessionService.invoke('/bookmarksfolder/get-folder-ids',[{
                groupId:groupId
                ,folderId:folderId
            }]);
        };
        service.getFolders = function(groupId) {
            return SessionService.invoke('/bookmarksfolder/get-folders',[{
                groupId:groupId
            }]);
        };
        service.getFolders = function(groupId,parentFolderId) {
            return SessionService.invoke('/bookmarksfolder/get-folders',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
            }]);
        };
        service.getFolders = function(groupId,parentFolderId,start,end) {
            return SessionService.invoke('/bookmarksfolder/get-folders',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
                ,start:start
                ,end:end
            }]);
        };
        service.getFolders = function(groupId,parentFolderId,status,start,end) {
            return SessionService.invoke('/bookmarksfolder/get-folders',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.getFoldersAndEntries = function(groupId,folderId) {
            return SessionService.invoke('/bookmarksfolder/get-folders-and-entries',[{
                groupId:groupId
                ,folderId:folderId
            }]);
        };
        service.getFoldersAndEntries = function(groupId,folderId,status) {
            return SessionService.invoke('/bookmarksfolder/get-folders-and-entries',[{
                groupId:groupId
                ,folderId:folderId
                ,status:status
            }]);
        };
        service.getFoldersAndEntries = function(groupId,folderId,status,start,end) {
            return SessionService.invoke('/bookmarksfolder/get-folders-and-entries',[{
                groupId:groupId
                ,folderId:folderId
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.getFoldersAndEntriesCount = function(groupId,folderId) {
            return SessionService.invoke('/bookmarksfolder/get-folders-and-entries-count',[{
                groupId:groupId
                ,folderId:folderId
            }]);
        };
        service.getFoldersAndEntriesCount = function(groupId,folderId,status) {
            return SessionService.invoke('/bookmarksfolder/get-folders-and-entries-count',[{
                groupId:groupId
                ,folderId:folderId
                ,status:status
            }]);
        };
        service.getFoldersCount = function(groupId,parentFolderId) {
            return SessionService.invoke('/bookmarksfolder/get-folders-count',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
            }]);
        };
        service.getFoldersCount = function(groupId,parentFolderId,status) {
            return SessionService.invoke('/bookmarksfolder/get-folders-count',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
                ,status:status
            }]);
        };
        service.getSubfolderIds = function(folderIds,groupId,folderId) {
            return SessionService.invoke('/bookmarksfolder/get-subfolder-ids',[{
                folderIds:folderIds
                ,groupId:groupId
                ,folderId:folderId
            }]);
        };
        service.getSubfolderIds = function(groupId,folderId,recurse) {
            return SessionService.invoke('/bookmarksfolder/get-subfolder-ids',[{
                groupId:groupId
                ,folderId:folderId
                ,recurse:recurse
            }]);
        };
        service.moveFolder = function(folderId,parentFolderId) {
            return SessionService.invoke('/bookmarksfolder/move-folder',[{
                folderId:folderId
                ,parentFolderId:parentFolderId
            }]);
        };
        service.moveFolderFromTrash = function(folderId,parentFolderId) {
            return SessionService.invoke('/bookmarksfolder/move-folder-from-trash',[{
                folderId:folderId
                ,parentFolderId:parentFolderId
            }]);
        };
        service.moveFolderToTrash = function(folderId) {
            return SessionService.invoke('/bookmarksfolder/move-folder-to-trash',[{
                folderId:folderId
            }]);
        };
        service.restoreFolderFromTrash = function(folderId) {
            return SessionService.invoke('/bookmarksfolder/restore-folder-from-trash',[{
                folderId:folderId
            }]);
        };
        service.subscribeFolder = function(groupId,folderId) {
            return SessionService.invoke('/bookmarksfolder/subscribe-folder',[{
                groupId:groupId
                ,folderId:folderId
            }]);
        };
        service.unsubscribeFolder = function(groupId,folderId) {
            return SessionService.invoke('/bookmarksfolder/unsubscribe-folder',[{
                groupId:groupId
                ,folderId:folderId
            }]);
        };
        service.updateFolder = function(folderId,parentFolderId,name,description,mergeWithParentFolder,serviceContext) {
            return SessionService.invoke('/bookmarksfolder/update-folder',[{
                folderId:folderId
                ,parentFolderId:parentFolderId
                ,name:name
                ,description:description
                ,mergeWithParentFolder:mergeWithParentFolder
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('ClassnameService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.fetchClassName = function(value) {
            return SessionService.invoke('/classname/fetch-class-name',[{
                value:value
            }]);
        };
        service.fetchClassNameId = function(clazz) {
            return SessionService.invoke('/classname/fetch-class-name-id',[{
                clazz:clazz
            }]);
        };
        service.fetchClassNameId = function(value) {
            return SessionService.invoke('/classname/fetch-class-name-id',[{
                value:value
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('CompanyService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.deleteLogo = function(companyId) {
            return SessionService.invoke('/company/delete-logo',[{
                companyId:companyId
            }]);
        };
        service.getCompanyById = function(companyId) {
            return SessionService.invoke('/company/get-company-by-id',[{
                companyId:companyId
            }]);
        };
        service.getCompanyByLogoId = function(logoId) {
            return SessionService.invoke('/company/get-company-by-logo-id',[{
                logoId:logoId
            }]);
        };
        service.getCompanyByMx = function(mx) {
            return SessionService.invoke('/company/get-company-by-mx',[{
                mx:mx
            }]);
        };
        service.getCompanyByVirtualHost = function(virtualHost) {
            return SessionService.invoke('/company/get-company-by-virtual-host',[{
                virtualHost:virtualHost
            }]);
        };
        service.getCompanyByWebId = function(webId) {
            return SessionService.invoke('/company/get-company-by-web-id',[{
                webId:webId
            }]);
        };
        service.updateCompany = function(companyId,virtualHost,mx,homeURL,name,legalName,legalId,legalType,sicCode,tickerSymbol,industry,type,size) {
            return SessionService.invoke('/company/update-company',[{
                companyId:companyId
                ,virtualHost:virtualHost
                ,mx:mx
                ,homeURL:homeURL
                ,name:name
                ,legalName:legalName
                ,legalId:legalId
                ,legalType:legalType
                ,sicCode:sicCode
                ,tickerSymbol:tickerSymbol
                ,industry:industry
                ,type:type
                ,size:size
            }]);
        };
        service.updateCompany = function(companyId,virtualHost,mx,maxUsers,active) {
            return SessionService.invoke('/company/update-company',[{
                companyId:companyId
                ,virtualHost:virtualHost
                ,mx:mx
                ,maxUsers:maxUsers
                ,active:active
            }]);
        };
        service.updateDisplay = function(companyId,languageId,timeZoneId) {
            return SessionService.invoke('/company/update-display',[{
                companyId:companyId
                ,languageId:languageId
                ,timeZoneId:timeZoneId
            }]);
        };
        service.updateLogo = function(companyId,bytes) {
            return SessionService.invoke('/company/update-logo',[{
                companyId:companyId
                ,bytes:bytes
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('ContactService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.getContact = function(contactId) {
            return SessionService.invoke('/contact/get-contact',[{
                contactId:contactId
            }]);
        };
        service.getContacts = function(classNameId,classPK,start,end,orderByComparator) {
            return SessionService.invoke('/contact/get-contacts',[{
                classNameId:classNameId
                ,classPK:classPK
                ,start:start
                ,end:end
                ,orderByComparator:orderByComparator
            }]);
        };
        service.getContactsCount = function(classNameId,classPK) {
            return SessionService.invoke('/contact/get-contacts-count',[{
                classNameId:classNameId
                ,classPK:classPK
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('CountryService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addCountry = function(name,a2,a3,number,idd,active) {
            return SessionService.invoke('/country/add-country',[{
                name:name
                ,a2:a2
                ,a3:a3
                ,number:number
                ,idd:idd
                ,active:active
            }]);
        };
        service.fetchCountry = function(countryId) {
            return SessionService.invoke('/country/fetch-country',[{
                countryId:countryId
            }]);
        };
        service.fetchCountryByA2 = function(a2) {
            return SessionService.invoke('/country/fetch-country-by-a2',[{
                a2:a2
            }]);
        };
        service.fetchCountryByA3 = function(a3) {
            return SessionService.invoke('/country/fetch-country-by-a3',[{
                a3:a3
            }]);
        };
        service.getCountries = function() {
            return SessionService.invoke('/country/get-countries',[{
                
            }]);
        };
        service.getCountries = function(active) {
            return SessionService.invoke('/country/get-countries',[{
                active:active
            }]);
        };
        service.getCountry = function(countryId) {
            return SessionService.invoke('/country/get-country',[{
                countryId:countryId
            }]);
        };
        service.getCountryByA2 = function(a2) {
            return SessionService.invoke('/country/get-country-by-a2',[{
                a2:a2
            }]);
        };
        service.getCountryByA3 = function(a3) {
            return SessionService.invoke('/country/get-country-by-a3',[{
                a3:a3
            }]);
        };
        service.getCountryByName = function(name) {
            return SessionService.invoke('/country/get-country-by-name',[{
                name:name
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('DdlrecordService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addRecord = function(groupId,recordSetId,displayIndex,fields,serviceContext) {
            return SessionService.invoke('/ddlrecord/add-record',[{
                groupId:groupId
                ,recordSetId:recordSetId
                ,displayIndex:displayIndex
                ,fields:fields
                ,serviceContext:serviceContext
            }]);
        };
        service.addRecord = function(groupId,recordSetId,displayIndex,fieldsMap,serviceContext) {
            return SessionService.invoke('/ddlrecord/add-record',[{
                groupId:groupId
                ,recordSetId:recordSetId
                ,displayIndex:displayIndex
                ,fieldsMap:fieldsMap
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteRecord = function(recordId) {
            return SessionService.invoke('/ddlrecord/delete-record',[{
                recordId:recordId
            }]);
        };
        service.deleteRecordLocale = function(recordId,locale,serviceContext) {
            return SessionService.invoke('/ddlrecord/delete-record-locale',[{
                recordId:recordId
                ,locale:locale
                ,serviceContext:serviceContext
            }]);
        };
        service.getRecord = function(recordId) {
            return SessionService.invoke('/ddlrecord/get-record',[{
                recordId:recordId
            }]);
        };
        service.revertRecordVersion = function(recordId,version,serviceContext) {
            return SessionService.invoke('/ddlrecord/revert-record-version',[{
                recordId:recordId
                ,version:version
                ,serviceContext:serviceContext
            }]);
        };
        service.updateRecord = function(recordId,displayIndex,fieldsMap,mergeFields,serviceContext) {
            return SessionService.invoke('/ddlrecord/update-record',[{
                recordId:recordId
                ,displayIndex:displayIndex
                ,fieldsMap:fieldsMap
                ,mergeFields:mergeFields
                ,serviceContext:serviceContext
            }]);
        };
        service.updateRecord = function(recordId,majorVersion,displayIndex,fields,mergeFields,serviceContext) {
            return SessionService.invoke('/ddlrecord/update-record',[{
                recordId:recordId
                ,majorVersion:majorVersion
                ,displayIndex:displayIndex
                ,fields:fields
                ,mergeFields:mergeFields
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('DdlrecordsetService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addRecordSet = function(groupId,ddmStructureId,recordSetKey,nameMap,descriptionMap,minDisplayRows,scope,serviceContext) {
            return SessionService.invoke('/ddlrecordset/add-record-set',[{
                groupId:groupId
                ,ddmStructureId:ddmStructureId
                ,recordSetKey:recordSetKey
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,minDisplayRows:minDisplayRows
                ,scope:scope
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteRecordSet = function(recordSetId) {
            return SessionService.invoke('/ddlrecordset/delete-record-set',[{
                recordSetId:recordSetId
            }]);
        };
        service.getRecordSet = function(recordSetId) {
            return SessionService.invoke('/ddlrecordset/get-record-set',[{
                recordSetId:recordSetId
            }]);
        };
        service.search = function(companyId,groupId,keywords,scope,start,end,orderByComparator) {
            return SessionService.invoke('/ddlrecordset/search',[{
                companyId:companyId
                ,groupId:groupId
                ,keywords:keywords
                ,scope:scope
                ,start:start
                ,end:end
                ,orderByComparator:orderByComparator
            }]);
        };
        service.search = function(companyId,groupId,name,description,scope,andOperator,start,end,orderByComparator) {
            return SessionService.invoke('/ddlrecordset/search',[{
                companyId:companyId
                ,groupId:groupId
                ,name:name
                ,description:description
                ,scope:scope
                ,andOperator:andOperator
                ,start:start
                ,end:end
                ,orderByComparator:orderByComparator
            }]);
        };
        service.searchCount = function(companyId,groupId,keywords,scope) {
            return SessionService.invoke('/ddlrecordset/search-count',[{
                companyId:companyId
                ,groupId:groupId
                ,keywords:keywords
                ,scope:scope
            }]);
        };
        service.searchCount = function(companyId,groupId,name,description,scope,andOperator) {
            return SessionService.invoke('/ddlrecordset/search-count',[{
                companyId:companyId
                ,groupId:groupId
                ,name:name
                ,description:description
                ,scope:scope
                ,andOperator:andOperator
            }]);
        };
        service.updateMinDisplayRows = function(recordSetId,minDisplayRows,serviceContext) {
            return SessionService.invoke('/ddlrecordset/update-min-display-rows',[{
                recordSetId:recordSetId
                ,minDisplayRows:minDisplayRows
                ,serviceContext:serviceContext
            }]);
        };
        service.updateRecordSet = function(recordSetId,ddmStructureId,nameMap,descriptionMap,minDisplayRows,serviceContext) {
            return SessionService.invoke('/ddlrecordset/update-record-set',[{
                recordSetId:recordSetId
                ,ddmStructureId:ddmStructureId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,minDisplayRows:minDisplayRows
                ,serviceContext:serviceContext
            }]);
        };
        service.updateRecordSet = function(groupId,ddmStructureId,recordSetKey,nameMap,descriptionMap,minDisplayRows,serviceContext) {
            return SessionService.invoke('/ddlrecordset/update-record-set',[{
                groupId:groupId
                ,ddmStructureId:ddmStructureId
                ,recordSetKey:recordSetKey
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,minDisplayRows:minDisplayRows
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('DdmstructureService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addStructure = function(groupId,parentStructureId,classNameId,structureKey,nameMap,descriptionMap,xsd,storageType,type,serviceContext) {
            return SessionService.invoke('/ddmstructure/add-structure',[{
                groupId:groupId
                ,parentStructureId:parentStructureId
                ,classNameId:classNameId
                ,structureKey:structureKey
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,xsd:xsd
                ,storageType:storageType
                ,type:type
                ,serviceContext:serviceContext
            }]);
        };
        service.addStructure = function(userId,groupId,parentStructureKey,classNameId,structureKey,nameMap,descriptionMap,xsd,storageType,type,serviceContext) {
            return SessionService.invoke('/ddmstructure/add-structure',[{
                userId:userId
                ,groupId:groupId
                ,parentStructureKey:parentStructureKey
                ,classNameId:classNameId
                ,structureKey:structureKey
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,xsd:xsd
                ,storageType:storageType
                ,type:type
                ,serviceContext:serviceContext
            }]);
        };
        service.addStructure = function(userId,groupId,classNameId,nameMap,descriptionMap,xsd,serviceContext) {
            return SessionService.invoke('/ddmstructure/add-structure',[{
                userId:userId
                ,groupId:groupId
                ,classNameId:classNameId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,xsd:xsd
                ,serviceContext:serviceContext
            }]);
        };
        service.copyStructure = function(structureId,serviceContext) {
            return SessionService.invoke('/ddmstructure/copy-structure',[{
                structureId:structureId
                ,serviceContext:serviceContext
            }]);
        };
        service.copyStructure = function(structureId,nameMap,descriptionMap,serviceContext) {
            return SessionService.invoke('/ddmstructure/copy-structure',[{
                structureId:structureId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteStructure = function(structureId) {
            return SessionService.invoke('/ddmstructure/delete-structure',[{
                structureId:structureId
            }]);
        };
        service.fetchStructure = function(groupId,classNameId,structureKey) {
            return SessionService.invoke('/ddmstructure/fetch-structure',[{
                groupId:groupId
                ,classNameId:classNameId
                ,structureKey:structureKey
            }]);
        };
        service.getStructure = function(structureId) {
            return SessionService.invoke('/ddmstructure/get-structure',[{
                structureId:structureId
            }]);
        };
        service.getStructure = function(groupId,classNameId,structureKey) {
            return SessionService.invoke('/ddmstructure/get-structure',[{
                groupId:groupId
                ,classNameId:classNameId
                ,structureKey:structureKey
            }]);
        };
        service.getStructure = function(groupId,classNameId,structureKey,includeGlobalStructures) {
            return SessionService.invoke('/ddmstructure/get-structure',[{
                groupId:groupId
                ,classNameId:classNameId
                ,structureKey:structureKey
                ,includeGlobalStructures:includeGlobalStructures
            }]);
        };
        service.getStructures = function(groupId) {
            return SessionService.invoke('/ddmstructure/get-structures',[{
                groupId:groupId
            }]);
        };
        service.getStructures = function(groupIds) {
            return SessionService.invoke('/ddmstructure/get-structures',[{
                groupIds:groupIds
            }]);
        };
        service.getStructures = function(groupIds,classNameId) {
            return SessionService.invoke('/ddmstructure/get-structures',[{
                groupIds:groupIds
                ,classNameId:classNameId
            }]);
        };
        service.getStructures = function(groupIds,classNameId,start,end) {
            return SessionService.invoke('/ddmstructure/get-structures',[{
                groupIds:groupIds
                ,classNameId:classNameId
                ,start:start
                ,end:end
            }]);
        };
        service.search = function(companyId,groupIds,classNameIds,name,description,storageType,type,andOperator,start,end,orderByComparator) {
            return SessionService.invoke('/ddmstructure/search',[{
                companyId:companyId
                ,groupIds:groupIds
                ,classNameIds:classNameIds
                ,name:name
                ,description:description
                ,storageType:storageType
                ,type:type
                ,andOperator:andOperator
                ,start:start
                ,end:end
                ,orderByComparator:orderByComparator
            }]);
        };
        service.search = function(companyId,groupIds,classNameIds,keywords,start,end,orderByComparator) {
            return SessionService.invoke('/ddmstructure/search',[{
                companyId:companyId
                ,groupIds:groupIds
                ,classNameIds:classNameIds
                ,keywords:keywords
                ,start:start
                ,end:end
                ,orderByComparator:orderByComparator
            }]);
        };
        service.searchCount = function(companyId,groupIds,classNameIds,keywords) {
            return SessionService.invoke('/ddmstructure/search-count',[{
                companyId:companyId
                ,groupIds:groupIds
                ,classNameIds:classNameIds
                ,keywords:keywords
            }]);
        };
        service.searchCount = function(companyId,groupIds,classNameIds,name,description,storageType,type,andOperator) {
            return SessionService.invoke('/ddmstructure/search-count',[{
                companyId:companyId
                ,groupIds:groupIds
                ,classNameIds:classNameIds
                ,name:name
                ,description:description
                ,storageType:storageType
                ,type:type
                ,andOperator:andOperator
            }]);
        };
        service.updateStructure = function(structureId,parentStructureId,nameMap,descriptionMap,xsd,serviceContext) {
            return SessionService.invoke('/ddmstructure/update-structure',[{
                structureId:structureId
                ,parentStructureId:parentStructureId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,xsd:xsd
                ,serviceContext:serviceContext
            }]);
        };
        service.updateStructure = function(groupId,parentStructureId,classNameId,structureKey,nameMap,descriptionMap,xsd,serviceContext) {
            return SessionService.invoke('/ddmstructure/update-structure',[{
                groupId:groupId
                ,parentStructureId:parentStructureId
                ,classNameId:classNameId
                ,structureKey:structureKey
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,xsd:xsd
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('DdmtemplateService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addTemplate = function(groupId,classNameId,classPK,nameMap,descriptionMap,type,mode,language,script,serviceContext) {
            return SessionService.invoke('/ddmtemplate/add-template',[{
                groupId:groupId
                ,classNameId:classNameId
                ,classPK:classPK
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,type:type
                ,mode:mode
                ,language:language
                ,script:script
                ,serviceContext:serviceContext
            }]);
        };
        service.addTemplate = function(groupId,classNameId,classPK,templateKey,nameMap,descriptionMap,type,mode,language,script,cacheable,smallImage,smallImageURL,smallImageFile,serviceContext) {
            return SessionService.invoke('/ddmtemplate/add-template',[{
                groupId:groupId
                ,classNameId:classNameId
                ,classPK:classPK
                ,templateKey:templateKey
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,type:type
                ,mode:mode
                ,language:language
                ,script:script
                ,cacheable:cacheable
                ,smallImage:smallImage
                ,smallImageURL:smallImageURL
                ,smallImageFile:smallImageFile
                ,serviceContext:serviceContext
            }]);
        };
        service.copyTemplate = function(templateId,serviceContext) {
            return SessionService.invoke('/ddmtemplate/copy-template',[{
                templateId:templateId
                ,serviceContext:serviceContext
            }]);
        };
        service.copyTemplate = function(templateId,nameMap,descriptionMap,serviceContext) {
            return SessionService.invoke('/ddmtemplate/copy-template',[{
                templateId:templateId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,serviceContext:serviceContext
            }]);
        };
        service.copyTemplates = function(classNameId,classPK,newClassPK,type,serviceContext) {
            return SessionService.invoke('/ddmtemplate/copy-templates',[{
                classNameId:classNameId
                ,classPK:classPK
                ,newClassPK:newClassPK
                ,type:type
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteTemplate = function(templateId) {
            return SessionService.invoke('/ddmtemplate/delete-template',[{
                templateId:templateId
            }]);
        };
        service.fetchTemplate = function(groupId,classNameId,templateKey) {
            return SessionService.invoke('/ddmtemplate/fetch-template',[{
                groupId:groupId
                ,classNameId:classNameId
                ,templateKey:templateKey
            }]);
        };
        service.getTemplate = function(templateId) {
            return SessionService.invoke('/ddmtemplate/get-template',[{
                templateId:templateId
            }]);
        };
        service.getTemplate = function(groupId,classNameId,templateKey) {
            return SessionService.invoke('/ddmtemplate/get-template',[{
                groupId:groupId
                ,classNameId:classNameId
                ,templateKey:templateKey
            }]);
        };
        service.getTemplate = function(groupId,classNameId,templateKey,includeGlobalTemplates) {
            return SessionService.invoke('/ddmtemplate/get-template',[{
                groupId:groupId
                ,classNameId:classNameId
                ,templateKey:templateKey
                ,includeGlobalTemplates:includeGlobalTemplates
            }]);
        };
        service.getTemplates = function(groupId,classNameId) {
            return SessionService.invoke('/ddmtemplate/get-templates',[{
                groupId:groupId
                ,classNameId:classNameId
            }]);
        };
        service.getTemplates = function(groupId,classNameId,classPK) {
            return SessionService.invoke('/ddmtemplate/get-templates',[{
                groupId:groupId
                ,classNameId:classNameId
                ,classPK:classPK
            }]);
        };
        service.getTemplates = function(groupId,classNameId,classPK,type) {
            return SessionService.invoke('/ddmtemplate/get-templates',[{
                groupId:groupId
                ,classNameId:classNameId
                ,classPK:classPK
                ,type:type
            }]);
        };
        service.getTemplates = function(groupId,classNameId,classPK,type,mode) {
            return SessionService.invoke('/ddmtemplate/get-templates',[{
                groupId:groupId
                ,classNameId:classNameId
                ,classPK:classPK
                ,type:type
                ,mode:mode
            }]);
        };
        service.getTemplatesByClassPk = function(groupId,classPK) {
            return SessionService.invoke('/ddmtemplate/get-templates-by-class-pk',[{
                groupId:groupId
                ,classPK:classPK
            }]);
        };
        service.getTemplatesByStructureClassNameId = function(groupId,structureClassNameId,start,end,orderByComparator) {
            return SessionService.invoke('/ddmtemplate/get-templates-by-structure-class-name-id',[{
                groupId:groupId
                ,structureClassNameId:structureClassNameId
                ,start:start
                ,end:end
                ,orderByComparator:orderByComparator
            }]);
        };
        service.getTemplatesByStructureClassNameIdCount = function(groupId,structureClassNameId) {
            return SessionService.invoke('/ddmtemplate/get-templates-by-structure-class-name-id-count',[{
                groupId:groupId
                ,structureClassNameId:structureClassNameId
            }]);
        };
        service.search = function(companyId,groupId,classNameId,classPK,keywords,type,mode,start,end,orderByComparator) {
            return SessionService.invoke('/ddmtemplate/search',[{
                companyId:companyId
                ,groupId:groupId
                ,classNameId:classNameId
                ,classPK:classPK
                ,keywords:keywords
                ,type:type
                ,mode:mode
                ,start:start
                ,end:end
                ,orderByComparator:orderByComparator
            }]);
        };
        service.search = function(companyId,groupIds,classNameIds,classPKs,keywords,type,mode,start,end,orderByComparator) {
            return SessionService.invoke('/ddmtemplate/search',[{
                companyId:companyId
                ,groupIds:groupIds
                ,classNameIds:classNameIds
                ,classPKs:classPKs
                ,keywords:keywords
                ,type:type
                ,mode:mode
                ,start:start
                ,end:end
                ,orderByComparator:orderByComparator
            }]);
        };
        service.search = function(companyId,groupId,classNameId,classPK,name,description,type,mode,language,andOperator,start,end,orderByComparator) {
            return SessionService.invoke('/ddmtemplate/search',[{
                companyId:companyId
                ,groupId:groupId
                ,classNameId:classNameId
                ,classPK:classPK
                ,name:name
                ,description:description
                ,type:type
                ,mode:mode
                ,language:language
                ,andOperator:andOperator
                ,start:start
                ,end:end
                ,orderByComparator:orderByComparator
            }]);
        };
        service.search = function(companyId,groupIds,classNameIds,classPKs,name,description,type,mode,language,andOperator,start,end,orderByComparator) {
            return SessionService.invoke('/ddmtemplate/search',[{
                companyId:companyId
                ,groupIds:groupIds
                ,classNameIds:classNameIds
                ,classPKs:classPKs
                ,name:name
                ,description:description
                ,type:type
                ,mode:mode
                ,language:language
                ,andOperator:andOperator
                ,start:start
                ,end:end
                ,orderByComparator:orderByComparator
            }]);
        };
        service.searchCount = function(companyId,groupId,classNameId,classPK,name,description,type,mode,language,andOperator) {
            return SessionService.invoke('/ddmtemplate/search-count',[{
                companyId:companyId
                ,groupId:groupId
                ,classNameId:classNameId
                ,classPK:classPK
                ,name:name
                ,description:description
                ,type:type
                ,mode:mode
                ,language:language
                ,andOperator:andOperator
            }]);
        };
        service.searchCount = function(companyId,groupIds,classNameIds,classPKs,name,description,type,mode,language,andOperator) {
            return SessionService.invoke('/ddmtemplate/search-count',[{
                companyId:companyId
                ,groupIds:groupIds
                ,classNameIds:classNameIds
                ,classPKs:classPKs
                ,name:name
                ,description:description
                ,type:type
                ,mode:mode
                ,language:language
                ,andOperator:andOperator
            }]);
        };
        service.searchCount = function(companyId,groupId,classNameId,classPK,keywords,type,mode) {
            return SessionService.invoke('/ddmtemplate/search-count',[{
                companyId:companyId
                ,groupId:groupId
                ,classNameId:classNameId
                ,classPK:classPK
                ,keywords:keywords
                ,type:type
                ,mode:mode
            }]);
        };
        service.searchCount = function(companyId,groupIds,classNameIds,classPKs,keywords,type,mode) {
            return SessionService.invoke('/ddmtemplate/search-count',[{
                companyId:companyId
                ,groupIds:groupIds
                ,classNameIds:classNameIds
                ,classPKs:classPKs
                ,keywords:keywords
                ,type:type
                ,mode:mode
            }]);
        };
        service.updateTemplate = function(templateId,classPK,nameMap,descriptionMap,type,mode,language,script,cacheable,smallImage,smallImageURL,smallImageFile,serviceContext) {
            return SessionService.invoke('/ddmtemplate/update-template',[{
                templateId:templateId
                ,classPK:classPK
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,type:type
                ,mode:mode
                ,language:language
                ,script:script
                ,cacheable:cacheable
                ,smallImage:smallImage
                ,smallImageURL:smallImageURL
                ,smallImageFile:smallImageFile
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('DlappService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addFileEntry = function(repositoryId,folderId,sourceFileName,mimeType,title,description,changeLog,bytes,serviceContext) {
            return SessionService.invoke('/dlapp/add-file-entry',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,sourceFileName:sourceFileName
                ,mimeType:mimeType
                ,title:title
                ,description:description
                ,changeLog:changeLog
                ,bytes:bytes
                ,serviceContext:serviceContext
            }]);
        };
        service.addFileEntry = function(repositoryId,folderId,sourceFileName,mimeType,title,description,changeLog,file,serviceContext) {
            return SessionService.invoke('/dlapp/add-file-entry',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,sourceFileName:sourceFileName
                ,mimeType:mimeType
                ,title:title
                ,description:description
                ,changeLog:changeLog
                ,file:file
                ,serviceContext:serviceContext
            }]);
        };
        service.addFileShortcut = function(repositoryId,folderId,toFileEntryId,serviceContext) {
            return SessionService.invoke('/dlapp/add-file-shortcut',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,toFileEntryId:toFileEntryId
                ,serviceContext:serviceContext
            }]);
        };
        service.addFolder = function(repositoryId,parentFolderId,name,description,serviceContext) {
            return SessionService.invoke('/dlapp/add-folder',[{
                repositoryId:repositoryId
                ,parentFolderId:parentFolderId
                ,name:name
                ,description:description
                ,serviceContext:serviceContext
            }]);
        };
        service.addTempFileEntry = function(groupId,folderId,fileName,tempFolderName,file,mimeType) {
            return SessionService.invoke('/dlapp/add-temp-file-entry',[{
                groupId:groupId
                ,folderId:folderId
                ,fileName:fileName
                ,tempFolderName:tempFolderName
                ,file:file
                ,mimeType:mimeType
            }]);
        };
        service.cancelCheckOut = function(fileEntryId) {
            return SessionService.invoke('/dlapp/cancel-check-out',[{
                fileEntryId:fileEntryId
            }]);
        };
        service.checkInFileEntry = function(fileEntryId,lockUuid) {
            return SessionService.invoke('/dlapp/check-in-file-entry',[{
                fileEntryId:fileEntryId
                ,lockUuid:lockUuid
            }]);
        };
        service.checkInFileEntry = function(fileEntryId,lockUuid,serviceContext) {
            return SessionService.invoke('/dlapp/check-in-file-entry',[{
                fileEntryId:fileEntryId
                ,lockUuid:lockUuid
                ,serviceContext:serviceContext
            }]);
        };
        service.checkInFileEntry = function(fileEntryId,majorVersion,changeLog,serviceContext) {
            return SessionService.invoke('/dlapp/check-in-file-entry',[{
                fileEntryId:fileEntryId
                ,majorVersion:majorVersion
                ,changeLog:changeLog
                ,serviceContext:serviceContext
            }]);
        };
        service.checkOutFileEntry = function(fileEntryId,serviceContext) {
            return SessionService.invoke('/dlapp/check-out-file-entry',[{
                fileEntryId:fileEntryId
                ,serviceContext:serviceContext
            }]);
        };
        service.checkOutFileEntry = function(fileEntryId,owner,expirationTime,serviceContext) {
            return SessionService.invoke('/dlapp/check-out-file-entry',[{
                fileEntryId:fileEntryId
                ,owner:owner
                ,expirationTime:expirationTime
                ,serviceContext:serviceContext
            }]);
        };
        service.copyFolder = function(repositoryId,sourceFolderId,parentFolderId,name,description,serviceContext) {
            return SessionService.invoke('/dlapp/copy-folder',[{
                repositoryId:repositoryId
                ,sourceFolderId:sourceFolderId
                ,parentFolderId:parentFolderId
                ,name:name
                ,description:description
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteFileEntry = function(fileEntryId) {
            return SessionService.invoke('/dlapp/delete-file-entry',[{
                fileEntryId:fileEntryId
            }]);
        };
        service.deleteFileEntryByTitle = function(repositoryId,folderId,title) {
            return SessionService.invoke('/dlapp/delete-file-entry-by-title',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,title:title
            }]);
        };
        service.deleteFileShortcut = function(fileShortcutId) {
            return SessionService.invoke('/dlapp/delete-file-shortcut',[{
                fileShortcutId:fileShortcutId
            }]);
        };
        service.deleteFileVersion = function(fileEntryId,version) {
            return SessionService.invoke('/dlapp/delete-file-version',[{
                fileEntryId:fileEntryId
                ,version:version
            }]);
        };
        service.deleteFolder = function(folderId) {
            return SessionService.invoke('/dlapp/delete-folder',[{
                folderId:folderId
            }]);
        };
        service.deleteFolder = function(repositoryId,parentFolderId,name) {
            return SessionService.invoke('/dlapp/delete-folder',[{
                repositoryId:repositoryId
                ,parentFolderId:parentFolderId
                ,name:name
            }]);
        };
        service.deleteTempFileEntry = function(groupId,folderId,fileName,tempFolderName) {
            return SessionService.invoke('/dlapp/delete-temp-file-entry',[{
                groupId:groupId
                ,folderId:folderId
                ,fileName:fileName
                ,tempFolderName:tempFolderName
            }]);
        };
        service.getFileEntries = function(repositoryId,folderId) {
            return SessionService.invoke('/dlapp/get-file-entries',[{
                repositoryId:repositoryId
                ,folderId:folderId
            }]);
        };
        service.getFileEntries = function(repositoryId,folderId,fileEntryTypeId) {
            return SessionService.invoke('/dlapp/get-file-entries',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,fileEntryTypeId:fileEntryTypeId
            }]);
        };
        service.getFileEntries = function(repositoryId,folderId,mimeTypes) {
            return SessionService.invoke('/dlapp/get-file-entries',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,mimeTypes:mimeTypes
            }]);
        };
        service.getFileEntries = function(repositoryId,folderId,start,end) {
            return SessionService.invoke('/dlapp/get-file-entries',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,start:start
                ,end:end
            }]);
        };
        service.getFileEntries = function(repositoryId,folderId,fileEntryTypeId,start,end) {
            return SessionService.invoke('/dlapp/get-file-entries',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,fileEntryTypeId:fileEntryTypeId
                ,start:start
                ,end:end
            }]);
        };
        service.getFileEntries = function(repositoryId,folderId,start,end,obc) {
            return SessionService.invoke('/dlapp/get-file-entries',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getFileEntries = function(repositoryId,folderId,fileEntryTypeId,start,end,obc) {
            return SessionService.invoke('/dlapp/get-file-entries',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,fileEntryTypeId:fileEntryTypeId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getFileEntriesAndFileShortcuts = function(repositoryId,folderId,status,start,end) {
            return SessionService.invoke('/dlapp/get-file-entries-and-file-shortcuts',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.getFileEntriesAndFileShortcutsCount = function(repositoryId,folderId,status) {
            return SessionService.invoke('/dlapp/get-file-entries-and-file-shortcuts-count',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,status:status
            }]);
        };
        service.getFileEntriesAndFileShortcutsCount = function(repositoryId,folderId,status,mimeTypes) {
            return SessionService.invoke('/dlapp/get-file-entries-and-file-shortcuts-count',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,status:status
                ,mimeTypes:mimeTypes
            }]);
        };
        service.getFileEntriesCount = function(repositoryId,folderId) {
            return SessionService.invoke('/dlapp/get-file-entries-count',[{
                repositoryId:repositoryId
                ,folderId:folderId
            }]);
        };
        service.getFileEntriesCount = function(repositoryId,folderId,fileEntryTypeId) {
            return SessionService.invoke('/dlapp/get-file-entries-count',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,fileEntryTypeId:fileEntryTypeId
            }]);
        };
        service.getFileEntry = function(fileEntryId) {
            return SessionService.invoke('/dlapp/get-file-entry',[{
                fileEntryId:fileEntryId
            }]);
        };
        service.getFileEntry = function(groupId,folderId,title) {
            return SessionService.invoke('/dlapp/get-file-entry',[{
                groupId:groupId
                ,folderId:folderId
                ,title:title
            }]);
        };
        service.getFileEntryByUuidAndGroupId = function(uuid,groupId) {
            return SessionService.invoke('/dlapp/get-file-entry-by-uuid-and-group-id',[{
                uuid:uuid
                ,groupId:groupId
            }]);
        };
        service.getFileShortcut = function(fileShortcutId) {
            return SessionService.invoke('/dlapp/get-file-shortcut',[{
                fileShortcutId:fileShortcutId
            }]);
        };
        service.getFolder = function(folderId) {
            return SessionService.invoke('/dlapp/get-folder',[{
                folderId:folderId
            }]);
        };
        service.getFolder = function(repositoryId,parentFolderId,name) {
            return SessionService.invoke('/dlapp/get-folder',[{
                repositoryId:repositoryId
                ,parentFolderId:parentFolderId
                ,name:name
            }]);
        };
        service.getFolders = function(repositoryId,parentFolderId) {
            return SessionService.invoke('/dlapp/get-folders',[{
                repositoryId:repositoryId
                ,parentFolderId:parentFolderId
            }]);
        };
        service.getFolders = function(repositoryId,parentFolderId,includeMountFolders) {
            return SessionService.invoke('/dlapp/get-folders',[{
                repositoryId:repositoryId
                ,parentFolderId:parentFolderId
                ,includeMountFolders:includeMountFolders
            }]);
        };
        service.getFolders = function(repositoryId,parentFolderId,start,end) {
            return SessionService.invoke('/dlapp/get-folders',[{
                repositoryId:repositoryId
                ,parentFolderId:parentFolderId
                ,start:start
                ,end:end
            }]);
        };
        service.getFolders = function(repositoryId,parentFolderId,includeMountFolders,start,end) {
            return SessionService.invoke('/dlapp/get-folders',[{
                repositoryId:repositoryId
                ,parentFolderId:parentFolderId
                ,includeMountFolders:includeMountFolders
                ,start:start
                ,end:end
            }]);
        };
        service.getFolders = function(repositoryId,parentFolderId,start,end,obc) {
            return SessionService.invoke('/dlapp/get-folders',[{
                repositoryId:repositoryId
                ,parentFolderId:parentFolderId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getFolders = function(repositoryId,parentFolderId,includeMountFolders,start,end,obc) {
            return SessionService.invoke('/dlapp/get-folders',[{
                repositoryId:repositoryId
                ,parentFolderId:parentFolderId
                ,includeMountFolders:includeMountFolders
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getFolders = function(repositoryId,parentFolderId,status,includeMountFolders,start,end,obc) {
            return SessionService.invoke('/dlapp/get-folders',[{
                repositoryId:repositoryId
                ,parentFolderId:parentFolderId
                ,status:status
                ,includeMountFolders:includeMountFolders
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getFoldersAndFileEntriesAndFileShortcuts = function(repositoryId,folderId,status,includeMountFolders,start,end) {
            return SessionService.invoke('/dlapp/get-folders-and-file-entries-and-file-shortcuts',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,status:status
                ,includeMountFolders:includeMountFolders
                ,start:start
                ,end:end
            }]);
        };
        service.getFoldersAndFileEntriesAndFileShortcuts = function(repositoryId,folderId,status,includeMountFolders,start,end,obc) {
            return SessionService.invoke('/dlapp/get-folders-and-file-entries-and-file-shortcuts',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,status:status
                ,includeMountFolders:includeMountFolders
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getFoldersAndFileEntriesAndFileShortcuts = function(repositoryId,folderId,status,mimeTypes,includeMountFolders,start,end,obc) {
            return SessionService.invoke('/dlapp/get-folders-and-file-entries-and-file-shortcuts',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,status:status
                ,mimeTypes:mimeTypes
                ,includeMountFolders:includeMountFolders
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getFoldersAndFileEntriesAndFileShortcutsCount = function(repositoryId,folderId,status,includeMountFolders) {
            return SessionService.invoke('/dlapp/get-folders-and-file-entries-and-file-shortcuts-count',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,status:status
                ,includeMountFolders:includeMountFolders
            }]);
        };
        service.getFoldersAndFileEntriesAndFileShortcutsCount = function(repositoryId,folderId,status,mimeTypes,includeMountFolders) {
            return SessionService.invoke('/dlapp/get-folders-and-file-entries-and-file-shortcuts-count',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,status:status
                ,mimeTypes:mimeTypes
                ,includeMountFolders:includeMountFolders
            }]);
        };
        service.getFoldersCount = function(repositoryId,parentFolderId) {
            return SessionService.invoke('/dlapp/get-folders-count',[{
                repositoryId:repositoryId
                ,parentFolderId:parentFolderId
            }]);
        };
        service.getFoldersCount = function(repositoryId,parentFolderId,includeMountFolders) {
            return SessionService.invoke('/dlapp/get-folders-count',[{
                repositoryId:repositoryId
                ,parentFolderId:parentFolderId
                ,includeMountFolders:includeMountFolders
            }]);
        };
        service.getFoldersCount = function(repositoryId,parentFolderId,status,includeMountFolders) {
            return SessionService.invoke('/dlapp/get-folders-count',[{
                repositoryId:repositoryId
                ,parentFolderId:parentFolderId
                ,status:status
                ,includeMountFolders:includeMountFolders
            }]);
        };
        service.getFoldersFileEntriesCount = function(repositoryId,folderIds,status) {
            return SessionService.invoke('/dlapp/get-folders-file-entries-count',[{
                repositoryId:repositoryId
                ,folderIds:folderIds
                ,status:status
            }]);
        };
        service.getGroupFileEntries = function(groupId,userId,start,end) {
            return SessionService.invoke('/dlapp/get-group-file-entries',[{
                groupId:groupId
                ,userId:userId
                ,start:start
                ,end:end
            }]);
        };
        service.getGroupFileEntries = function(groupId,userId,rootFolderId,start,end) {
            return SessionService.invoke('/dlapp/get-group-file-entries',[{
                groupId:groupId
                ,userId:userId
                ,rootFolderId:rootFolderId
                ,start:start
                ,end:end
            }]);
        };
        service.getGroupFileEntries = function(groupId,userId,start,end,obc) {
            return SessionService.invoke('/dlapp/get-group-file-entries',[{
                groupId:groupId
                ,userId:userId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getGroupFileEntries = function(groupId,userId,rootFolderId,start,end,obc) {
            return SessionService.invoke('/dlapp/get-group-file-entries',[{
                groupId:groupId
                ,userId:userId
                ,rootFolderId:rootFolderId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getGroupFileEntries = function(groupId,userId,rootFolderId,mimeTypes,status,start,end,obc) {
            return SessionService.invoke('/dlapp/get-group-file-entries',[{
                groupId:groupId
                ,userId:userId
                ,rootFolderId:rootFolderId
                ,mimeTypes:mimeTypes
                ,status:status
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getGroupFileEntriesCount = function(groupId,userId) {
            return SessionService.invoke('/dlapp/get-group-file-entries-count',[{
                groupId:groupId
                ,userId:userId
            }]);
        };
        service.getGroupFileEntriesCount = function(groupId,userId,rootFolderId) {
            return SessionService.invoke('/dlapp/get-group-file-entries-count',[{
                groupId:groupId
                ,userId:userId
                ,rootFolderId:rootFolderId
            }]);
        };
        service.getGroupFileEntriesCount = function(groupId,userId,rootFolderId,mimeTypes,status) {
            return SessionService.invoke('/dlapp/get-group-file-entries-count',[{
                groupId:groupId
                ,userId:userId
                ,rootFolderId:rootFolderId
                ,mimeTypes:mimeTypes
                ,status:status
            }]);
        };
        service.getMountFolders = function(repositoryId,parentFolderId) {
            return SessionService.invoke('/dlapp/get-mount-folders',[{
                repositoryId:repositoryId
                ,parentFolderId:parentFolderId
            }]);
        };
        service.getMountFolders = function(repositoryId,parentFolderId,start,end) {
            return SessionService.invoke('/dlapp/get-mount-folders',[{
                repositoryId:repositoryId
                ,parentFolderId:parentFolderId
                ,start:start
                ,end:end
            }]);
        };
        service.getMountFolders = function(repositoryId,parentFolderId,start,end,obc) {
            return SessionService.invoke('/dlapp/get-mount-folders',[{
                repositoryId:repositoryId
                ,parentFolderId:parentFolderId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getMountFoldersCount = function(repositoryId,parentFolderId) {
            return SessionService.invoke('/dlapp/get-mount-folders-count',[{
                repositoryId:repositoryId
                ,parentFolderId:parentFolderId
            }]);
        };
        service.getSubfolderIds = function(repositoryId,folderId) {
            return SessionService.invoke('/dlapp/get-subfolder-ids',[{
                repositoryId:repositoryId
                ,folderId:folderId
            }]);
        };
        service.getSubfolderIds = function(repositoryId,folderId,recurse) {
            return SessionService.invoke('/dlapp/get-subfolder-ids',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,recurse:recurse
            }]);
        };
        service.getSubfolderIds = function(repositoryId,folderIds,folderId) {
            return SessionService.invoke('/dlapp/get-subfolder-ids',[{
                repositoryId:repositoryId
                ,folderIds:folderIds
                ,folderId:folderId
            }]);
        };
        service.getTempFileEntryNames = function(groupId,folderId,tempFolderName) {
            return SessionService.invoke('/dlapp/get-temp-file-entry-names',[{
                groupId:groupId
                ,folderId:folderId
                ,tempFolderName:tempFolderName
            }]);
        };
        service.lockFileEntry = function(fileEntryId) {
            return SessionService.invoke('/dlapp/lock-file-entry',[{
                fileEntryId:fileEntryId
            }]);
        };
        service.lockFileEntry = function(fileEntryId,owner,expirationTime) {
            return SessionService.invoke('/dlapp/lock-file-entry',[{
                fileEntryId:fileEntryId
                ,owner:owner
                ,expirationTime:expirationTime
            }]);
        };
        service.lockFolder = function(repositoryId,folderId) {
            return SessionService.invoke('/dlapp/lock-folder',[{
                repositoryId:repositoryId
                ,folderId:folderId
            }]);
        };
        service.lockFolder = function(repositoryId,folderId,owner,inheritable,expirationTime) {
            return SessionService.invoke('/dlapp/lock-folder',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,owner:owner
                ,inheritable:inheritable
                ,expirationTime:expirationTime
            }]);
        };
        service.moveFileEntry = function(fileEntryId,newFolderId,serviceContext) {
            return SessionService.invoke('/dlapp/move-file-entry',[{
                fileEntryId:fileEntryId
                ,newFolderId:newFolderId
                ,serviceContext:serviceContext
            }]);
        };
        service.moveFileEntryFromTrash = function(fileEntryId,newFolderId,serviceContext) {
            return SessionService.invoke('/dlapp/move-file-entry-from-trash',[{
                fileEntryId:fileEntryId
                ,newFolderId:newFolderId
                ,serviceContext:serviceContext
            }]);
        };
        service.moveFileEntryToTrash = function(fileEntryId) {
            return SessionService.invoke('/dlapp/move-file-entry-to-trash',[{
                fileEntryId:fileEntryId
            }]);
        };
        service.moveFileShortcutFromTrash = function(fileShortcutId,newFolderId,serviceContext) {
            return SessionService.invoke('/dlapp/move-file-shortcut-from-trash',[{
                fileShortcutId:fileShortcutId
                ,newFolderId:newFolderId
                ,serviceContext:serviceContext
            }]);
        };
        service.moveFileShortcutToTrash = function(fileShortcutId) {
            return SessionService.invoke('/dlapp/move-file-shortcut-to-trash',[{
                fileShortcutId:fileShortcutId
            }]);
        };
        service.moveFolder = function(folderId,parentFolderId,serviceContext) {
            return SessionService.invoke('/dlapp/move-folder',[{
                folderId:folderId
                ,parentFolderId:parentFolderId
                ,serviceContext:serviceContext
            }]);
        };
        service.moveFolderFromTrash = function(folderId,parentFolderId,serviceContext) {
            return SessionService.invoke('/dlapp/move-folder-from-trash',[{
                folderId:folderId
                ,parentFolderId:parentFolderId
                ,serviceContext:serviceContext
            }]);
        };
        service.moveFolderToTrash = function(folderId) {
            return SessionService.invoke('/dlapp/move-folder-to-trash',[{
                folderId:folderId
            }]);
        };
        service.refreshFileEntryLock = function(lockUuid,companyId,expirationTime) {
            return SessionService.invoke('/dlapp/refresh-file-entry-lock',[{
                lockUuid:lockUuid
                ,companyId:companyId
                ,expirationTime:expirationTime
            }]);
        };
        service.refreshFolderLock = function(lockUuid,companyId,expirationTime) {
            return SessionService.invoke('/dlapp/refresh-folder-lock',[{
                lockUuid:lockUuid
                ,companyId:companyId
                ,expirationTime:expirationTime
            }]);
        };
        service.restoreFileEntryFromTrash = function(fileEntryId) {
            return SessionService.invoke('/dlapp/restore-file-entry-from-trash',[{
                fileEntryId:fileEntryId
            }]);
        };
        service.restoreFileShortcutFromTrash = function(fileShortcutId) {
            return SessionService.invoke('/dlapp/restore-file-shortcut-from-trash',[{
                fileShortcutId:fileShortcutId
            }]);
        };
        service.restoreFolderFromTrash = function(folderId) {
            return SessionService.invoke('/dlapp/restore-folder-from-trash',[{
                folderId:folderId
            }]);
        };
        service.revertFileEntry = function(fileEntryId,version,serviceContext) {
            return SessionService.invoke('/dlapp/revert-file-entry',[{
                fileEntryId:fileEntryId
                ,version:version
                ,serviceContext:serviceContext
            }]);
        };
        service.search = function(repositoryId,searchContext) {
            return SessionService.invoke('/dlapp/search',[{
                repositoryId:repositoryId
                ,searchContext:searchContext
            }]);
        };
        service.search = function(repositoryId,searchContext,query) {
            return SessionService.invoke('/dlapp/search',[{
                repositoryId:repositoryId
                ,searchContext:searchContext
                ,query:query
            }]);
        };
        service.search = function(repositoryId,creatorUserId,status,start,end) {
            return SessionService.invoke('/dlapp/search',[{
                repositoryId:repositoryId
                ,creatorUserId:creatorUserId
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.search = function(repositoryId,creatorUserId,folderId,mimeTypes,status,start,end) {
            return SessionService.invoke('/dlapp/search',[{
                repositoryId:repositoryId
                ,creatorUserId:creatorUserId
                ,folderId:folderId
                ,mimeTypes:mimeTypes
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.subscribeFileEntryType = function(groupId,fileEntryTypeId) {
            return SessionService.invoke('/dlapp/subscribe-file-entry-type',[{
                groupId:groupId
                ,fileEntryTypeId:fileEntryTypeId
            }]);
        };
        service.subscribeFolder = function(groupId,folderId) {
            return SessionService.invoke('/dlapp/subscribe-folder',[{
                groupId:groupId
                ,folderId:folderId
            }]);
        };
        service.unlockFileEntry = function(fileEntryId) {
            return SessionService.invoke('/dlapp/unlock-file-entry',[{
                fileEntryId:fileEntryId
            }]);
        };
        service.unlockFileEntry = function(fileEntryId,lockUuid) {
            return SessionService.invoke('/dlapp/unlock-file-entry',[{
                fileEntryId:fileEntryId
                ,lockUuid:lockUuid
            }]);
        };
        service.unlockFolder = function(repositoryId,folderId,lockUuid) {
            return SessionService.invoke('/dlapp/unlock-folder',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,lockUuid:lockUuid
            }]);
        };
        service.unlockFolder = function(repositoryId,parentFolderId,name,lockUuid) {
            return SessionService.invoke('/dlapp/unlock-folder',[{
                repositoryId:repositoryId
                ,parentFolderId:parentFolderId
                ,name:name
                ,lockUuid:lockUuid
            }]);
        };
        service.unsubscribeFileEntryType = function(groupId,fileEntryTypeId) {
            return SessionService.invoke('/dlapp/unsubscribe-file-entry-type',[{
                groupId:groupId
                ,fileEntryTypeId:fileEntryTypeId
            }]);
        };
        service.unsubscribeFolder = function(groupId,folderId) {
            return SessionService.invoke('/dlapp/unsubscribe-folder',[{
                groupId:groupId
                ,folderId:folderId
            }]);
        };
        service.updateFileEntry = function(fileEntryId,sourceFileName,mimeType,title,description,changeLog,majorVersion,bytes,serviceContext) {
            return SessionService.invoke('/dlapp/update-file-entry',[{
                fileEntryId:fileEntryId
                ,sourceFileName:sourceFileName
                ,mimeType:mimeType
                ,title:title
                ,description:description
                ,changeLog:changeLog
                ,majorVersion:majorVersion
                ,bytes:bytes
                ,serviceContext:serviceContext
            }]);
        };
        service.updateFileEntry = function(fileEntryId,sourceFileName,mimeType,title,description,changeLog,majorVersion,file,serviceContext) {
            return SessionService.invoke('/dlapp/update-file-entry',[{
                fileEntryId:fileEntryId
                ,sourceFileName:sourceFileName
                ,mimeType:mimeType
                ,title:title
                ,description:description
                ,changeLog:changeLog
                ,majorVersion:majorVersion
                ,file:file
                ,serviceContext:serviceContext
            }]);
        };
        service.updateFileEntryAndCheckIn = function(fileEntryId,sourceFileName,mimeType,title,description,changeLog,majorVersion,file,serviceContext) {
            return SessionService.invoke('/dlapp/update-file-entry-and-check-in',[{
                fileEntryId:fileEntryId
                ,sourceFileName:sourceFileName
                ,mimeType:mimeType
                ,title:title
                ,description:description
                ,changeLog:changeLog
                ,majorVersion:majorVersion
                ,file:file
                ,serviceContext:serviceContext
            }]);
        };
        service.updateFileShortcut = function(fileShortcutId,folderId,toFileEntryId,serviceContext) {
            return SessionService.invoke('/dlapp/update-file-shortcut',[{
                fileShortcutId:fileShortcutId
                ,folderId:folderId
                ,toFileEntryId:toFileEntryId
                ,serviceContext:serviceContext
            }]);
        };
        service.updateFolder = function(folderId,name,description,serviceContext) {
            return SessionService.invoke('/dlapp/update-folder',[{
                folderId:folderId
                ,name:name
                ,description:description
                ,serviceContext:serviceContext
            }]);
        };
        service.verifyFileEntryCheckOut = function(repositoryId,fileEntryId,lockUuid) {
            return SessionService.invoke('/dlapp/verify-file-entry-check-out',[{
                repositoryId:repositoryId
                ,fileEntryId:fileEntryId
                ,lockUuid:lockUuid
            }]);
        };
        service.verifyFileEntryLock = function(repositoryId,fileEntryId,lockUuid) {
            return SessionService.invoke('/dlapp/verify-file-entry-lock',[{
                repositoryId:repositoryId
                ,fileEntryId:fileEntryId
                ,lockUuid:lockUuid
            }]);
        };
        service.verifyInheritableLock = function(repositoryId,folderId,lockUuid) {
            return SessionService.invoke('/dlapp/verify-inheritable-lock',[{
                repositoryId:repositoryId
                ,folderId:folderId
                ,lockUuid:lockUuid
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('DlfileentryService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.cancelCheckOut = function(fileEntryId) {
            return SessionService.invoke('/dlfileentry/cancel-check-out',[{
                fileEntryId:fileEntryId
            }]);
        };
        service.checkInFileEntry = function(fileEntryId,lockUuid) {
            return SessionService.invoke('/dlfileentry/check-in-file-entry',[{
                fileEntryId:fileEntryId
                ,lockUuid:lockUuid
            }]);
        };
        service.checkInFileEntry = function(fileEntryId,lockUuid,serviceContext) {
            return SessionService.invoke('/dlfileentry/check-in-file-entry',[{
                fileEntryId:fileEntryId
                ,lockUuid:lockUuid
                ,serviceContext:serviceContext
            }]);
        };
        service.checkInFileEntry = function(fileEntryId,major,changeLog,serviceContext) {
            return SessionService.invoke('/dlfileentry/check-in-file-entry',[{
                fileEntryId:fileEntryId
                ,major:major
                ,changeLog:changeLog
                ,serviceContext:serviceContext
            }]);
        };
        service.checkOutFileEntry = function(fileEntryId) {
            return SessionService.invoke('/dlfileentry/check-out-file-entry',[{
                fileEntryId:fileEntryId
            }]);
        };
        service.checkOutFileEntry = function(fileEntryId,serviceContext) {
            return SessionService.invoke('/dlfileentry/check-out-file-entry',[{
                fileEntryId:fileEntryId
                ,serviceContext:serviceContext
            }]);
        };
        service.checkOutFileEntry = function(fileEntryId,owner,expirationTime) {
            return SessionService.invoke('/dlfileentry/check-out-file-entry',[{
                fileEntryId:fileEntryId
                ,owner:owner
                ,expirationTime:expirationTime
            }]);
        };
        service.checkOutFileEntry = function(fileEntryId,owner,expirationTime,serviceContext) {
            return SessionService.invoke('/dlfileentry/check-out-file-entry',[{
                fileEntryId:fileEntryId
                ,owner:owner
                ,expirationTime:expirationTime
                ,serviceContext:serviceContext
            }]);
        };
        service.copyFileEntry = function(groupId,repositoryId,fileEntryId,destFolderId,serviceContext) {
            return SessionService.invoke('/dlfileentry/copy-file-entry',[{
                groupId:groupId
                ,repositoryId:repositoryId
                ,fileEntryId:fileEntryId
                ,destFolderId:destFolderId
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteFileEntry = function(fileEntryId) {
            return SessionService.invoke('/dlfileentry/delete-file-entry',[{
                fileEntryId:fileEntryId
            }]);
        };
        service.deleteFileEntry = function(groupId,folderId,title) {
            return SessionService.invoke('/dlfileentry/delete-file-entry',[{
                groupId:groupId
                ,folderId:folderId
                ,title:title
            }]);
        };
        service.deleteFileVersion = function(fileEntryId,version) {
            return SessionService.invoke('/dlfileentry/delete-file-version',[{
                fileEntryId:fileEntryId
                ,version:version
            }]);
        };
        service.fetchFileEntryByImageId = function(imageId) {
            return SessionService.invoke('/dlfileentry/fetch-file-entry-by-image-id',[{
                imageId:imageId
            }]);
        };
        service.getFileEntries = function(groupId,folderId,start,end,obc) {
            return SessionService.invoke('/dlfileentry/get-file-entries',[{
                groupId:groupId
                ,folderId:folderId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getFileEntries = function(groupId,folderId,fileEntryTypeId,start,end,obc) {
            return SessionService.invoke('/dlfileentry/get-file-entries',[{
                groupId:groupId
                ,folderId:folderId
                ,fileEntryTypeId:fileEntryTypeId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getFileEntries = function(groupId,folderId,mimeTypes,start,end,obc) {
            return SessionService.invoke('/dlfileentry/get-file-entries',[{
                groupId:groupId
                ,folderId:folderId
                ,mimeTypes:mimeTypes
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getFileEntries = function(groupId,folderId,status,start,end,obc) {
            return SessionService.invoke('/dlfileentry/get-file-entries',[{
                groupId:groupId
                ,folderId:folderId
                ,status:status
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getFileEntriesCount = function(groupId,folderId) {
            return SessionService.invoke('/dlfileentry/get-file-entries-count',[{
                groupId:groupId
                ,folderId:folderId
            }]);
        };
        service.getFileEntriesCount = function(groupId,folderId,fileEntryTypeId) {
            return SessionService.invoke('/dlfileentry/get-file-entries-count',[{
                groupId:groupId
                ,folderId:folderId
                ,fileEntryTypeId:fileEntryTypeId
            }]);
        };
        service.getFileEntriesCount = function(groupId,folderId,mimeTypes) {
            return SessionService.invoke('/dlfileentry/get-file-entries-count',[{
                groupId:groupId
                ,folderId:folderId
                ,mimeTypes:mimeTypes
            }]);
        };
        service.getFileEntriesCount = function(groupId,folderId,status) {
            return SessionService.invoke('/dlfileentry/get-file-entries-count',[{
                groupId:groupId
                ,folderId:folderId
                ,status:status
            }]);
        };
        service.getFileEntry = function(fileEntryId) {
            return SessionService.invoke('/dlfileentry/get-file-entry',[{
                fileEntryId:fileEntryId
            }]);
        };
        service.getFileEntry = function(groupId,folderId,title) {
            return SessionService.invoke('/dlfileentry/get-file-entry',[{
                groupId:groupId
                ,folderId:folderId
                ,title:title
            }]);
        };
        service.getFileEntryByUuidAndGroupId = function(uuid,groupId) {
            return SessionService.invoke('/dlfileentry/get-file-entry-by-uuid-and-group-id',[{
                uuid:uuid
                ,groupId:groupId
            }]);
        };
        service.getFileEntryLock = function(fileEntryId) {
            return SessionService.invoke('/dlfileentry/get-file-entry-lock',[{
                fileEntryId:fileEntryId
            }]);
        };
        service.getFoldersFileEntriesCount = function(groupId,folderIds,status) {
            return SessionService.invoke('/dlfileentry/get-folders-file-entries-count',[{
                groupId:groupId
                ,folderIds:folderIds
                ,status:status
            }]);
        };
        service.getGroupFileEntries = function(groupId,userId,rootFolderId,start,end,obc) {
            return SessionService.invoke('/dlfileentry/get-group-file-entries',[{
                groupId:groupId
                ,userId:userId
                ,rootFolderId:rootFolderId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getGroupFileEntries = function(groupId,userId,rootFolderId,mimeTypes,status,start,end,obc) {
            return SessionService.invoke('/dlfileentry/get-group-file-entries',[{
                groupId:groupId
                ,userId:userId
                ,rootFolderId:rootFolderId
                ,mimeTypes:mimeTypes
                ,status:status
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getGroupFileEntries = function(groupId,userId,repositoryId,rootFolderId,mimeTypes,status,start,end,obc) {
            return SessionService.invoke('/dlfileentry/get-group-file-entries',[{
                groupId:groupId
                ,userId:userId
                ,repositoryId:repositoryId
                ,rootFolderId:rootFolderId
                ,mimeTypes:mimeTypes
                ,status:status
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getGroupFileEntriesCount = function(groupId,userId,rootFolderId) {
            return SessionService.invoke('/dlfileentry/get-group-file-entries-count',[{
                groupId:groupId
                ,userId:userId
                ,rootFolderId:rootFolderId
            }]);
        };
        service.getGroupFileEntriesCount = function(groupId,userId,rootFolderId,mimeTypes,status) {
            return SessionService.invoke('/dlfileentry/get-group-file-entries-count',[{
                groupId:groupId
                ,userId:userId
                ,rootFolderId:rootFolderId
                ,mimeTypes:mimeTypes
                ,status:status
            }]);
        };
        service.getGroupFileEntriesCount = function(groupId,userId,repositoryId,rootFolderId,mimeTypes,status) {
            return SessionService.invoke('/dlfileentry/get-group-file-entries-count',[{
                groupId:groupId
                ,userId:userId
                ,repositoryId:repositoryId
                ,rootFolderId:rootFolderId
                ,mimeTypes:mimeTypes
                ,status:status
            }]);
        };
        service.hasFileEntryLock = function(fileEntryId) {
            return SessionService.invoke('/dlfileentry/has-file-entry-lock',[{
                fileEntryId:fileEntryId
            }]);
        };
        service.isFileEntryCheckedOut = function(fileEntryId) {
            return SessionService.invoke('/dlfileentry/is-file-entry-checked-out',[{
                fileEntryId:fileEntryId
            }]);
        };
        service.moveFileEntry = function(fileEntryId,newFolderId,serviceContext) {
            return SessionService.invoke('/dlfileentry/move-file-entry',[{
                fileEntryId:fileEntryId
                ,newFolderId:newFolderId
                ,serviceContext:serviceContext
            }]);
        };
        service.refreshFileEntryLock = function(lockUuid,companyId,expirationTime) {
            return SessionService.invoke('/dlfileentry/refresh-file-entry-lock',[{
                lockUuid:lockUuid
                ,companyId:companyId
                ,expirationTime:expirationTime
            }]);
        };
        service.revertFileEntry = function(fileEntryId,version,serviceContext) {
            return SessionService.invoke('/dlfileentry/revert-file-entry',[{
                fileEntryId:fileEntryId
                ,version:version
                ,serviceContext:serviceContext
            }]);
        };
        service.search = function(groupId,creatorUserId,status,start,end) {
            return SessionService.invoke('/dlfileentry/search',[{
                groupId:groupId
                ,creatorUserId:creatorUserId
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.search = function(groupId,creatorUserId,folderId,mimeTypes,status,start,end) {
            return SessionService.invoke('/dlfileentry/search',[{
                groupId:groupId
                ,creatorUserId:creatorUserId
                ,folderId:folderId
                ,mimeTypes:mimeTypes
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.verifyFileEntryCheckOut = function(fileEntryId,lockUuid) {
            return SessionService.invoke('/dlfileentry/verify-file-entry-check-out',[{
                fileEntryId:fileEntryId
                ,lockUuid:lockUuid
            }]);
        };
        service.verifyFileEntryLock = function(fileEntryId,lockUuid) {
            return SessionService.invoke('/dlfileentry/verify-file-entry-lock',[{
                fileEntryId:fileEntryId
                ,lockUuid:lockUuid
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('DlfileentrytypeService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addFileEntryType = function(groupId,name,description,ddmStructureIds,serviceContext) {
            return SessionService.invoke('/dlfileentrytype/add-file-entry-type',[{
                groupId:groupId
                ,name:name
                ,description:description
                ,ddmStructureIds:ddmStructureIds
                ,serviceContext:serviceContext
            }]);
        };
        service.addFileEntryType = function(groupId,fileEntryTypeKey,nameMap,descriptionMap,ddmStructureIds,serviceContext) {
            return SessionService.invoke('/dlfileentrytype/add-file-entry-type',[{
                groupId:groupId
                ,fileEntryTypeKey:fileEntryTypeKey
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,ddmStructureIds:ddmStructureIds
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteFileEntryType = function(fileEntryTypeId) {
            return SessionService.invoke('/dlfileentrytype/delete-file-entry-type',[{
                fileEntryTypeId:fileEntryTypeId
            }]);
        };
        service.getFileEntryType = function(fileEntryTypeId) {
            return SessionService.invoke('/dlfileentrytype/get-file-entry-type',[{
                fileEntryTypeId:fileEntryTypeId
            }]);
        };
        service.getFileEntryTypes = function(groupIds) {
            return SessionService.invoke('/dlfileentrytype/get-file-entry-types',[{
                groupIds:groupIds
            }]);
        };
        service.getFileEntryTypes = function(groupIds,start,end) {
            return SessionService.invoke('/dlfileentrytype/get-file-entry-types',[{
                groupIds:groupIds
                ,start:start
                ,end:end
            }]);
        };
        service.getFileEntryTypesCount = function(groupIds) {
            return SessionService.invoke('/dlfileentrytype/get-file-entry-types-count',[{
                groupIds:groupIds
            }]);
        };
        service.getFolderFileEntryTypes = function(groupIds,folderId,inherited) {
            return SessionService.invoke('/dlfileentrytype/get-folder-file-entry-types',[{
                groupIds:groupIds
                ,folderId:folderId
                ,inherited:inherited
            }]);
        };
        service.search = function(companyId,groupIds,keywords,includeBasicFileEntryType,start,end,orderByComparator) {
            return SessionService.invoke('/dlfileentrytype/search',[{
                companyId:companyId
                ,groupIds:groupIds
                ,keywords:keywords
                ,includeBasicFileEntryType:includeBasicFileEntryType
                ,start:start
                ,end:end
                ,orderByComparator:orderByComparator
            }]);
        };
        service.searchCount = function(companyId,groupIds,keywords,includeBasicFileEntryType) {
            return SessionService.invoke('/dlfileentrytype/search-count',[{
                companyId:companyId
                ,groupIds:groupIds
                ,keywords:keywords
                ,includeBasicFileEntryType:includeBasicFileEntryType
            }]);
        };
        service.updateFileEntryType = function(fileEntryTypeId,name,description,ddmStructureIds,serviceContext) {
            return SessionService.invoke('/dlfileentrytype/update-file-entry-type',[{
                fileEntryTypeId:fileEntryTypeId
                ,name:name
                ,description:description
                ,ddmStructureIds:ddmStructureIds
                ,serviceContext:serviceContext
            }]);
        };
        service.updateFileEntryType = function(fileEntryTypeId,nameMap,descriptionMap,ddmStructureIds,serviceContext) {
            return SessionService.invoke('/dlfileentrytype/update-file-entry-type',[{
                fileEntryTypeId:fileEntryTypeId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,ddmStructureIds:ddmStructureIds
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('DlfileshortcutService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addFileShortcut = function(groupId,folderId,toFileEntryId,serviceContext) {
            return SessionService.invoke('/dlfileshortcut/add-file-shortcut',[{
                groupId:groupId
                ,folderId:folderId
                ,toFileEntryId:toFileEntryId
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteFileShortcut = function(fileShortcutId) {
            return SessionService.invoke('/dlfileshortcut/delete-file-shortcut',[{
                fileShortcutId:fileShortcutId
            }]);
        };
        service.getFileShortcut = function(fileShortcutId) {
            return SessionService.invoke('/dlfileshortcut/get-file-shortcut',[{
                fileShortcutId:fileShortcutId
            }]);
        };
        service.updateFileShortcut = function(fileShortcutId,folderId,toFileEntryId,serviceContext) {
            return SessionService.invoke('/dlfileshortcut/update-file-shortcut',[{
                fileShortcutId:fileShortcutId
                ,folderId:folderId
                ,toFileEntryId:toFileEntryId
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('DlfileversionService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.getFileVersion = function(fileVersionId) {
            return SessionService.invoke('/dlfileversion/get-file-version',[{
                fileVersionId:fileVersionId
            }]);
        };
        service.getFileVersions = function(fileEntryId,status) {
            return SessionService.invoke('/dlfileversion/get-file-versions',[{
                fileEntryId:fileEntryId
                ,status:status
            }]);
        };
        service.getFileVersionsCount = function(fileEntryId,status) {
            return SessionService.invoke('/dlfileversion/get-file-versions-count',[{
                fileEntryId:fileEntryId
                ,status:status
            }]);
        };
        service.getLatestFileVersion = function(fileEntryId) {
            return SessionService.invoke('/dlfileversion/get-latest-file-version',[{
                fileEntryId:fileEntryId
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('DlfolderService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addFolder = function(groupId,repositoryId,mountPoint,parentFolderId,name,description,serviceContext) {
            return SessionService.invoke('/dlfolder/add-folder',[{
                groupId:groupId
                ,repositoryId:repositoryId
                ,mountPoint:mountPoint
                ,parentFolderId:parentFolderId
                ,name:name
                ,description:description
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteFolder = function(folderId) {
            return SessionService.invoke('/dlfolder/delete-folder',[{
                folderId:folderId
            }]);
        };
        service.deleteFolder = function(folderId,includeTrashedEntries) {
            return SessionService.invoke('/dlfolder/delete-folder',[{
                folderId:folderId
                ,includeTrashedEntries:includeTrashedEntries
            }]);
        };
        service.deleteFolder = function(groupId,parentFolderId,name) {
            return SessionService.invoke('/dlfolder/delete-folder',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
                ,name:name
            }]);
        };
        service.getFileEntriesAndFileShortcuts = function(groupId,folderId,status,start,end) {
            return SessionService.invoke('/dlfolder/get-file-entries-and-file-shortcuts',[{
                groupId:groupId
                ,folderId:folderId
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.getFileEntriesAndFileShortcutsCount = function(groupId,folderId,status) {
            return SessionService.invoke('/dlfolder/get-file-entries-and-file-shortcuts-count',[{
                groupId:groupId
                ,folderId:folderId
                ,status:status
            }]);
        };
        service.getFileEntriesAndFileShortcutsCount = function(groupId,folderId,status,mimeTypes) {
            return SessionService.invoke('/dlfolder/get-file-entries-and-file-shortcuts-count',[{
                groupId:groupId
                ,folderId:folderId
                ,status:status
                ,mimeTypes:mimeTypes
            }]);
        };
        service.getFolder = function(folderId) {
            return SessionService.invoke('/dlfolder/get-folder',[{
                folderId:folderId
            }]);
        };
        service.getFolder = function(groupId,parentFolderId,name) {
            return SessionService.invoke('/dlfolder/get-folder',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
                ,name:name
            }]);
        };
        service.getFolderIds = function(groupId,folderId) {
            return SessionService.invoke('/dlfolder/get-folder-ids',[{
                groupId:groupId
                ,folderId:folderId
            }]);
        };
        service.getFolders = function(groupId,parentFolderId,start,end,obc) {
            return SessionService.invoke('/dlfolder/get-folders',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getFolders = function(groupId,parentFolderId,status,includeMountfolders,start,end,obc) {
            return SessionService.invoke('/dlfolder/get-folders',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
                ,status:status
                ,includeMountfolders:includeMountfolders
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getFoldersAndFileEntriesAndFileShortcuts = function(groupId,folderId,status,includeMountFolders,start,end,obc) {
            return SessionService.invoke('/dlfolder/get-folders-and-file-entries-and-file-shortcuts',[{
                groupId:groupId
                ,folderId:folderId
                ,status:status
                ,includeMountFolders:includeMountFolders
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getFoldersAndFileEntriesAndFileShortcuts = function(groupId,folderId,status,mimeTypes,includeMountFolders,start,end,obc) {
            return SessionService.invoke('/dlfolder/get-folders-and-file-entries-and-file-shortcuts',[{
                groupId:groupId
                ,folderId:folderId
                ,status:status
                ,mimeTypes:mimeTypes
                ,includeMountFolders:includeMountFolders
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getFoldersAndFileEntriesAndFileShortcutsCount = function(groupId,folderId,status,includeMountFolders) {
            return SessionService.invoke('/dlfolder/get-folders-and-file-entries-and-file-shortcuts-count',[{
                groupId:groupId
                ,folderId:folderId
                ,status:status
                ,includeMountFolders:includeMountFolders
            }]);
        };
        service.getFoldersAndFileEntriesAndFileShortcutsCount = function(groupId,folderId,status,mimeTypes,includeMountFolders) {
            return SessionService.invoke('/dlfolder/get-folders-and-file-entries-and-file-shortcuts-count',[{
                groupId:groupId
                ,folderId:folderId
                ,status:status
                ,mimeTypes:mimeTypes
                ,includeMountFolders:includeMountFolders
            }]);
        };
        service.getFoldersCount = function(groupId,parentFolderId) {
            return SessionService.invoke('/dlfolder/get-folders-count',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
            }]);
        };
        service.getFoldersCount = function(groupId,parentFolderId,status,includeMountfolders) {
            return SessionService.invoke('/dlfolder/get-folders-count',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
                ,status:status
                ,includeMountfolders:includeMountfolders
            }]);
        };
        service.getMountFolders = function(groupId,parentFolderId,start,end,obc) {
            return SessionService.invoke('/dlfolder/get-mount-folders',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getMountFoldersCount = function(groupId,parentFolderId) {
            return SessionService.invoke('/dlfolder/get-mount-folders-count',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
            }]);
        };
        service.getSubfolderIds = function(folderIds,groupId,folderId) {
            return SessionService.invoke('/dlfolder/get-subfolder-ids',[{
                folderIds:folderIds
                ,groupId:groupId
                ,folderId:folderId
            }]);
        };
        service.getSubfolderIds = function(groupId,folderId,recurse) {
            return SessionService.invoke('/dlfolder/get-subfolder-ids',[{
                groupId:groupId
                ,folderId:folderId
                ,recurse:recurse
            }]);
        };
        service.hasFolderLock = function(folderId) {
            return SessionService.invoke('/dlfolder/has-folder-lock',[{
                folderId:folderId
            }]);
        };
        service.hasInheritableLock = function(folderId) {
            return SessionService.invoke('/dlfolder/has-inheritable-lock',[{
                folderId:folderId
            }]);
        };
        service.isFolderLocked = function(folderId) {
            return SessionService.invoke('/dlfolder/is-folder-locked',[{
                folderId:folderId
            }]);
        };
        service.lockFolder = function(folderId) {
            return SessionService.invoke('/dlfolder/lock-folder',[{
                folderId:folderId
            }]);
        };
        service.lockFolder = function(folderId,owner,inheritable,expirationTime) {
            return SessionService.invoke('/dlfolder/lock-folder',[{
                folderId:folderId
                ,owner:owner
                ,inheritable:inheritable
                ,expirationTime:expirationTime
            }]);
        };
        service.moveFolder = function(folderId,parentFolderId,serviceContext) {
            return SessionService.invoke('/dlfolder/move-folder',[{
                folderId:folderId
                ,parentFolderId:parentFolderId
                ,serviceContext:serviceContext
            }]);
        };
        service.refreshFolderLock = function(lockUuid,companyId,expirationTime) {
            return SessionService.invoke('/dlfolder/refresh-folder-lock',[{
                lockUuid:lockUuid
                ,companyId:companyId
                ,expirationTime:expirationTime
            }]);
        };
        service.unlockFolder = function(folderId,lockUuid) {
            return SessionService.invoke('/dlfolder/unlock-folder',[{
                folderId:folderId
                ,lockUuid:lockUuid
            }]);
        };
        service.unlockFolder = function(groupId,parentFolderId,name,lockUuid) {
            return SessionService.invoke('/dlfolder/unlock-folder',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
                ,name:name
                ,lockUuid:lockUuid
            }]);
        };
        service.updateFolder = function(folderId,name,description,defaultFileEntryTypeId,fileEntryTypeIds,overrideFileEntryTypes,serviceContext) {
            return SessionService.invoke('/dlfolder/update-folder',[{
                folderId:folderId
                ,name:name
                ,description:description
                ,defaultFileEntryTypeId:defaultFileEntryTypeId
                ,fileEntryTypeIds:fileEntryTypeIds
                ,overrideFileEntryTypes:overrideFileEntryTypes
                ,serviceContext:serviceContext
            }]);
        };
        service.verifyInheritableLock = function(folderId,lockUuid) {
            return SessionService.invoke('/dlfolder/verify-inheritable-lock',[{
                folderId:folderId
                ,lockUuid:lockUuid
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('EmailaddressService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addEmailAddress = function(className,classPK,address,typeId,primary) {
            return SessionService.invoke('/emailaddress/add-email-address',[{
                className:className
                ,classPK:classPK
                ,address:address
                ,typeId:typeId
                ,primary:primary
            }]);
        };
        service.addEmailAddress = function(className,classPK,address,typeId,primary,serviceContext) {
            return SessionService.invoke('/emailaddress/add-email-address',[{
                className:className
                ,classPK:classPK
                ,address:address
                ,typeId:typeId
                ,primary:primary
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteEmailAddress = function(emailAddressId) {
            return SessionService.invoke('/emailaddress/delete-email-address',[{
                emailAddressId:emailAddressId
            }]);
        };
        service.getEmailAddress = function(emailAddressId) {
            return SessionService.invoke('/emailaddress/get-email-address',[{
                emailAddressId:emailAddressId
            }]);
        };
        service.getEmailAddresses = function(className,classPK) {
            return SessionService.invoke('/emailaddress/get-email-addresses',[{
                className:className
                ,classPK:classPK
            }]);
        };
        service.updateEmailAddress = function(emailAddressId,address,typeId,primary) {
            return SessionService.invoke('/emailaddress/update-email-address',[{
                emailAddressId:emailAddressId
                ,address:address
                ,typeId:typeId
                ,primary:primary
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('ExpandocolumnService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addColumn = function(tableId,name,type) {
            return SessionService.invoke('/expandocolumn/add-column',[{
                tableId:tableId
                ,name:name
                ,type:type
            }]);
        };
        service.addColumn = function(tableId,name,type,defaultData) {
            return SessionService.invoke('/expandocolumn/add-column',[{
                tableId:tableId
                ,name:name
                ,type:type
                ,defaultData:defaultData
            }]);
        };
        service.deleteColumn = function(columnId) {
            return SessionService.invoke('/expandocolumn/delete-column',[{
                columnId:columnId
            }]);
        };
        service.updateColumn = function(columnId,name,type) {
            return SessionService.invoke('/expandocolumn/update-column',[{
                columnId:columnId
                ,name:name
                ,type:type
            }]);
        };
        service.updateColumn = function(columnId,name,type,defaultData) {
            return SessionService.invoke('/expandocolumn/update-column',[{
                columnId:columnId
                ,name:name
                ,type:type
                ,defaultData:defaultData
            }]);
        };
        service.updateTypeSettings = function(columnId,typeSettings) {
            return SessionService.invoke('/expandocolumn/update-type-settings',[{
                columnId:columnId
                ,typeSettings:typeSettings
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('ExpandovalueService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addValue = function(companyId,className,tableName,columnName,classPK,data) {
            return SessionService.invoke('/expandovalue/add-value',[{
                companyId:companyId
                ,className:className
                ,tableName:tableName
                ,columnName:columnName
                ,classPK:classPK
                ,data:data
            }]);
        };
        service.addValues = function(companyId,className,tableName,classPK,attributeValues) {
            return SessionService.invoke('/expandovalue/add-values',[{
                companyId:companyId
                ,className:className
                ,tableName:tableName
                ,classPK:classPK
                ,attributeValues:attributeValues
            }]);
        };
        service.getData = function(companyId,className,tableName,columnName,classPK) {
            return SessionService.invoke('/expandovalue/get-data',[{
                companyId:companyId
                ,className:className
                ,tableName:tableName
                ,columnName:columnName
                ,classPK:classPK
            }]);
        };
        service.getData = function(companyId,className,tableName,columnNames,classPK) {
            return SessionService.invoke('/expandovalue/get-data',[{
                companyId:companyId
                ,className:className
                ,tableName:tableName
                ,columnNames:columnNames
                ,classPK:classPK
            }]);
        };
        service.getJsonData = function(companyId,className,tableName,columnName,classPK) {
            return SessionService.invoke('/expandovalue/get-json-data',[{
                companyId:companyId
                ,className:className
                ,tableName:tableName
                ,columnName:columnName
                ,classPK:classPK
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('FlagsentryService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addEntry = function(className,classPK,reporterEmailAddress,reportedUserId,contentTitle,contentURL,reason,serviceContext) {
            return SessionService.invoke('/flagsentry/add-entry',[{
                className:className
                ,classPK:classPK
                ,reporterEmailAddress:reporterEmailAddress
                ,reportedUserId:reportedUserId
                ,contentTitle:contentTitle
                ,contentURL:contentURL
                ,reason:reason
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('GroupService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addGroup = function(parentGroupId,liveGroupId,name,description,type,manualMembership,membershipRestriction,friendlyURL,site,active,serviceContext) {
            return SessionService.invoke('/group/add-group',[{
                parentGroupId:parentGroupId
                ,liveGroupId:liveGroupId
                ,name:name
                ,description:description
                ,type:type
                ,manualMembership:manualMembership
                ,membershipRestriction:membershipRestriction
                ,friendlyURL:friendlyURL
                ,site:site
                ,active:active
                ,serviceContext:serviceContext
            }]);
        };
        service.addGroup = function(name,description,type,friendlyURL,site,active,serviceContext) {
            return SessionService.invoke('/group/add-group',[{
                name:name
                ,description:description
                ,type:type
                ,friendlyURL:friendlyURL
                ,site:site
                ,active:active
                ,serviceContext:serviceContext
            }]);
        };
        service.addGroup = function(parentGroupId,name,description,type,friendlyURL,site,active,serviceContext) {
            return SessionService.invoke('/group/add-group',[{
                parentGroupId:parentGroupId
                ,name:name
                ,description:description
                ,type:type
                ,friendlyURL:friendlyURL
                ,site:site
                ,active:active
                ,serviceContext:serviceContext
            }]);
        };
        service.addRoleGroups = function(roleId,groupIds) {
            return SessionService.invoke('/group/add-role-groups',[{
                roleId:roleId
                ,groupIds:groupIds
            }]);
        };
        service.checkRemoteStagingGroup = function(groupId) {
            return SessionService.invoke('/group/check-remote-staging-group',[{
                groupId:groupId
            }]);
        };
        service.deleteGroup = function(groupId) {
            return SessionService.invoke('/group/delete-group',[{
                groupId:groupId
            }]);
        };
        service.disableStaging = function(groupId) {
            return SessionService.invoke('/group/disable-staging',[{
                groupId:groupId
            }]);
        };
        service.enableStaging = function(groupId) {
            return SessionService.invoke('/group/enable-staging',[{
                groupId:groupId
            }]);
        };
        service.getCompanyGroup = function(companyId) {
            return SessionService.invoke('/group/get-company-group',[{
                companyId:companyId
            }]);
        };
        service.getGroup = function(groupId) {
            return SessionService.invoke('/group/get-group',[{
                groupId:groupId
            }]);
        };
        service.getGroup = function(companyId,name) {
            return SessionService.invoke('/group/get-group',[{
                companyId:companyId
                ,name:name
            }]);
        };
        service.getGroups = function(companyId,parentGroupId,site) {
            return SessionService.invoke('/group/get-groups',[{
                companyId:companyId
                ,parentGroupId:parentGroupId
                ,site:site
            }]);
        };
        service.getManageableSiteGroups = function(portlets,max) {
            return SessionService.invoke('/group/get-manageable-site-groups',[{
                portlets:portlets
                ,max:max
            }]);
        };
        service.getManageableSites = function(portlets,max) {
            return SessionService.invoke('/group/get-manageable-sites',[{
                portlets:portlets
                ,max:max
            }]);
        };
        service.getOrganizationsGroups = function(organizations) {
            return SessionService.invoke('/group/get-organizations-groups',[{
                organizations:organizations
            }]);
        };
        service.getUserGroup = function(companyId,userId) {
            return SessionService.invoke('/group/get-user-group',[{
                companyId:companyId
                ,userId:userId
            }]);
        };
        service.getUserGroupsGroups = function(userGroups) {
            return SessionService.invoke('/group/get-user-groups-groups',[{
                userGroups:userGroups
            }]);
        };
        service.getUserOrganizationsGroups = function(userId,start,end) {
            return SessionService.invoke('/group/get-user-organizations-groups',[{
                userId:userId
                ,start:start
                ,end:end
            }]);
        };
        service.getUserPlaces = function(classNames,max) {
            return SessionService.invoke('/group/get-user-places',[{
                classNames:classNames
                ,max:max
            }]);
        };
        service.getUserPlaces = function(userId,classNames,max) {
            return SessionService.invoke('/group/get-user-places',[{
                userId:userId
                ,classNames:classNames
                ,max:max
            }]);
        };
        service.getUserPlaces = function(userId,classNames,includeControlPanel,max) {
            return SessionService.invoke('/group/get-user-places',[{
                userId:userId
                ,classNames:classNames
                ,includeControlPanel:includeControlPanel
                ,max:max
            }]);
        };
        service.getUserPlacesCount = function() {
            return SessionService.invoke('/group/get-user-places-count',[{
                
            }]);
        };
        service.getUserSites = function() {
            return SessionService.invoke('/group/get-user-sites',[{
                
            }]);
        };
        service.getUserSitesGroups = function() {
            return SessionService.invoke('/group/get-user-sites-groups',[{
                
            }]);
        };
        service.getUserSitesGroups = function(classNames,max) {
            return SessionService.invoke('/group/get-user-sites-groups',[{
                classNames:classNames
                ,max:max
            }]);
        };
        service.getUserSitesGroups = function(userId,classNames,max) {
            return SessionService.invoke('/group/get-user-sites-groups',[{
                userId:userId
                ,classNames:classNames
                ,max:max
            }]);
        };
        service.getUserSitesGroups = function(userId,classNames,includeControlPanel,max) {
            return SessionService.invoke('/group/get-user-sites-groups',[{
                userId:userId
                ,classNames:classNames
                ,includeControlPanel:includeControlPanel
                ,max:max
            }]);
        };
        service.getUserSitesGroupsCount = function() {
            return SessionService.invoke('/group/get-user-sites-groups-count',[{
                
            }]);
        };
        service.hasUserGroup = function(userId,groupId) {
            return SessionService.invoke('/group/has-user-group',[{
                userId:userId
                ,groupId:groupId
            }]);
        };
        service.search = function(companyId,name,description,params,start,end) {
            return SessionService.invoke('/group/search',[{
                companyId:companyId
                ,name:name
                ,description:description
                ,params:params
                ,start:start
                ,end:end
            }]);
        };
        service.search = function(companyId,classNameIds,keywords,params,start,end,obc) {
            return SessionService.invoke('/group/search',[{
                companyId:companyId
                ,classNameIds:classNameIds
                ,keywords:keywords
                ,params:params
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.search = function(companyId,classNameIds,name,description,params,andOperator,start,end,obc) {
            return SessionService.invoke('/group/search',[{
                companyId:companyId
                ,classNameIds:classNameIds
                ,name:name
                ,description:description
                ,params:params
                ,andOperator:andOperator
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.searchCount = function(companyId,name,description,params) {
            return SessionService.invoke('/group/search-count',[{
                companyId:companyId
                ,name:name
                ,description:description
                ,params:params
            }]);
        };
        service.setRoleGroups = function(roleId,groupIds) {
            return SessionService.invoke('/group/set-role-groups',[{
                roleId:roleId
                ,groupIds:groupIds
            }]);
        };
        service.unsetRoleGroups = function(roleId,groupIds) {
            return SessionService.invoke('/group/unset-role-groups',[{
                roleId:roleId
                ,groupIds:groupIds
            }]);
        };
        service.updateFriendlyUrl = function(groupId,friendlyURL) {
            return SessionService.invoke('/group/update-friendly-url',[{
                groupId:groupId
                ,friendlyURL:friendlyURL
            }]);
        };
        service.updateGroup = function(groupId,parentGroupId,name,description,type,manualMembership,membershipRestriction,friendlyURL,active,serviceContext) {
            return SessionService.invoke('/group/update-group',[{
                groupId:groupId
                ,parentGroupId:parentGroupId
                ,name:name
                ,description:description
                ,type:type
                ,manualMembership:manualMembership
                ,membershipRestriction:membershipRestriction
                ,friendlyURL:friendlyURL
                ,active:active
                ,serviceContext:serviceContext
            }]);
        };
        service.updateGroup = function(groupId,typeSettings) {
            return SessionService.invoke('/group/update-group',[{
                groupId:groupId
                ,typeSettings:typeSettings
            }]);
        };
        service.updateStagedPortlets = function(groupId,stagedPortletIds) {
            return SessionService.invoke('/group/update-staged-portlets',[{
                groupId:groupId
                ,stagedPortletIds:stagedPortletIds
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('ImageService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.getImage = function(imageId) {
            return SessionService.invoke('/image/get-image',[{
                imageId:imageId
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('JournalarticleService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addArticle = function(groupId,folderId,classNameId,classPK,articleId,autoArticleId,titleMap,descriptionMap,content,type,ddmStructureKey,ddmTemplateKey,layoutUuid,displayDateMonth,displayDateDay,displayDateYear,displayDateHour,displayDateMinute,expirationDateMonth,expirationDateDay,expirationDateYear,expirationDateHour,expirationDateMinute,neverExpire,reviewDateMonth,reviewDateDay,reviewDateYear,reviewDateHour,reviewDateMinute,neverReview,indexable,articleURL,serviceContext) {
            return SessionService.invoke('/journalarticle/add-article',[{
                groupId:groupId
                ,folderId:folderId
                ,classNameId:classNameId
                ,classPK:classPK
                ,articleId:articleId
                ,autoArticleId:autoArticleId
                ,titleMap:titleMap
                ,descriptionMap:descriptionMap
                ,content:content
                ,type:type
                ,ddmStructureKey:ddmStructureKey
                ,ddmTemplateKey:ddmTemplateKey
                ,layoutUuid:layoutUuid
                ,displayDateMonth:displayDateMonth
                ,displayDateDay:displayDateDay
                ,displayDateYear:displayDateYear
                ,displayDateHour:displayDateHour
                ,displayDateMinute:displayDateMinute
                ,expirationDateMonth:expirationDateMonth
                ,expirationDateDay:expirationDateDay
                ,expirationDateYear:expirationDateYear
                ,expirationDateHour:expirationDateHour
                ,expirationDateMinute:expirationDateMinute
                ,neverExpire:neverExpire
                ,reviewDateMonth:reviewDateMonth
                ,reviewDateDay:reviewDateDay
                ,reviewDateYear:reviewDateYear
                ,reviewDateHour:reviewDateHour
                ,reviewDateMinute:reviewDateMinute
                ,neverReview:neverReview
                ,indexable:indexable
                ,articleURL:articleURL
                ,serviceContext:serviceContext
            }]);
        };
        service.addArticle = function(groupId,folderId,classNameId,classPK,articleId,autoArticleId,titleMap,descriptionMap,content,type,ddmStructureKey,ddmTemplateKey,layoutUuid,displayDateMonth,displayDateDay,displayDateYear,displayDateHour,displayDateMinute,expirationDateMonth,expirationDateDay,expirationDateYear,expirationDateHour,expirationDateMinute,neverExpire,reviewDateMonth,reviewDateDay,reviewDateYear,reviewDateHour,reviewDateMinute,neverReview,indexable,smallImage,smallImageURL,smallFile,images,articleURL,serviceContext) {
            return SessionService.invoke('/journalarticle/add-article',[{
                groupId:groupId
                ,folderId:folderId
                ,classNameId:classNameId
                ,classPK:classPK
                ,articleId:articleId
                ,autoArticleId:autoArticleId
                ,titleMap:titleMap
                ,descriptionMap:descriptionMap
                ,content:content
                ,type:type
                ,ddmStructureKey:ddmStructureKey
                ,ddmTemplateKey:ddmTemplateKey
                ,layoutUuid:layoutUuid
                ,displayDateMonth:displayDateMonth
                ,displayDateDay:displayDateDay
                ,displayDateYear:displayDateYear
                ,displayDateHour:displayDateHour
                ,displayDateMinute:displayDateMinute
                ,expirationDateMonth:expirationDateMonth
                ,expirationDateDay:expirationDateDay
                ,expirationDateYear:expirationDateYear
                ,expirationDateHour:expirationDateHour
                ,expirationDateMinute:expirationDateMinute
                ,neverExpire:neverExpire
                ,reviewDateMonth:reviewDateMonth
                ,reviewDateDay:reviewDateDay
                ,reviewDateYear:reviewDateYear
                ,reviewDateHour:reviewDateHour
                ,reviewDateMinute:reviewDateMinute
                ,neverReview:neverReview
                ,indexable:indexable
                ,smallImage:smallImage
                ,smallImageURL:smallImageURL
                ,smallFile:smallFile
                ,images:images
                ,articleURL:articleURL
                ,serviceContext:serviceContext
            }]);
        };
        service.copyArticle = function(groupId,oldArticleId,newArticleId,autoArticleId,version) {
            return SessionService.invoke('/journalarticle/copy-article',[{
                groupId:groupId
                ,oldArticleId:oldArticleId
                ,newArticleId:newArticleId
                ,autoArticleId:autoArticleId
                ,version:version
            }]);
        };
        service.deleteArticle = function(groupId,articleId,articleURL,serviceContext) {
            return SessionService.invoke('/journalarticle/delete-article',[{
                groupId:groupId
                ,articleId:articleId
                ,articleURL:articleURL
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteArticle = function(groupId,articleId,version,articleURL,serviceContext) {
            return SessionService.invoke('/journalarticle/delete-article',[{
                groupId:groupId
                ,articleId:articleId
                ,version:version
                ,articleURL:articleURL
                ,serviceContext:serviceContext
            }]);
        };
        service.expireArticle = function(groupId,articleId,articleURL,serviceContext) {
            return SessionService.invoke('/journalarticle/expire-article',[{
                groupId:groupId
                ,articleId:articleId
                ,articleURL:articleURL
                ,serviceContext:serviceContext
            }]);
        };
        service.expireArticle = function(groupId,articleId,version,articleURL,serviceContext) {
            return SessionService.invoke('/journalarticle/expire-article',[{
                groupId:groupId
                ,articleId:articleId
                ,version:version
                ,articleURL:articleURL
                ,serviceContext:serviceContext
            }]);
        };
        service.getArticle = function(id) {
            return SessionService.invoke('/journalarticle/get-article',[{
                id:id
            }]);
        };
        service.getArticle = function(groupId,articleId) {
            return SessionService.invoke('/journalarticle/get-article',[{
                groupId:groupId
                ,articleId:articleId
            }]);
        };
        service.getArticle = function(groupId,articleId,version) {
            return SessionService.invoke('/journalarticle/get-article',[{
                groupId:groupId
                ,articleId:articleId
                ,version:version
            }]);
        };
        service.getArticle = function(groupId,className,classPK) {
            return SessionService.invoke('/journalarticle/get-article',[{
                groupId:groupId
                ,className:className
                ,classPK:classPK
            }]);
        };
        service.getArticleByUrlTitle = function(groupId,urlTitle) {
            return SessionService.invoke('/journalarticle/get-article-by-url-title',[{
                groupId:groupId
                ,urlTitle:urlTitle
            }]);
        };
        service.getArticleContent = function(groupId,articleId,languageId,themeDisplay) {
            return SessionService.invoke('/journalarticle/get-article-content',[{
                groupId:groupId
                ,articleId:articleId
                ,languageId:languageId
                ,themeDisplay:themeDisplay
            }]);
        };
        service.getArticleContent = function(groupId,articleId,version,languageId,themeDisplay) {
            return SessionService.invoke('/journalarticle/get-article-content',[{
                groupId:groupId
                ,articleId:articleId
                ,version:version
                ,languageId:languageId
                ,themeDisplay:themeDisplay
            }]);
        };
        service.getArticles = function(groupId,folderId) {
            return SessionService.invoke('/journalarticle/get-articles',[{
                groupId:groupId
                ,folderId:folderId
            }]);
        };
        service.getArticles = function(groupId,folderId,start,end,obc) {
            return SessionService.invoke('/journalarticle/get-articles',[{
                groupId:groupId
                ,folderId:folderId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getArticlesByArticleId = function(groupId,articleId,start,end,obc) {
            return SessionService.invoke('/journalarticle/get-articles-by-article-id',[{
                groupId:groupId
                ,articleId:articleId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getArticlesByLayoutUuid = function(groupId,layoutUuid) {
            return SessionService.invoke('/journalarticle/get-articles-by-layout-uuid',[{
                groupId:groupId
                ,layoutUuid:layoutUuid
            }]);
        };
        service.getArticlesByStructureId = function(groupId,ddmStructureKey,start,end,obc) {
            return SessionService.invoke('/journalarticle/get-articles-by-structure-id',[{
                groupId:groupId
                ,ddmStructureKey:ddmStructureKey
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getArticlesByStructureId = function(groupId,classNameId,ddmStructureKey,status,start,end,obc) {
            return SessionService.invoke('/journalarticle/get-articles-by-structure-id',[{
                groupId:groupId
                ,classNameId:classNameId
                ,ddmStructureKey:ddmStructureKey
                ,status:status
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getArticlesCount = function(groupId,folderId) {
            return SessionService.invoke('/journalarticle/get-articles-count',[{
                groupId:groupId
                ,folderId:folderId
            }]);
        };
        service.getArticlesCount = function(groupId,folderId,status) {
            return SessionService.invoke('/journalarticle/get-articles-count',[{
                groupId:groupId
                ,folderId:folderId
                ,status:status
            }]);
        };
        service.getArticlesCountByArticleId = function(groupId,articleId) {
            return SessionService.invoke('/journalarticle/get-articles-count-by-article-id',[{
                groupId:groupId
                ,articleId:articleId
            }]);
        };
        service.getArticlesCountByStructureId = function(groupId,ddmStructureKey) {
            return SessionService.invoke('/journalarticle/get-articles-count-by-structure-id',[{
                groupId:groupId
                ,ddmStructureKey:ddmStructureKey
            }]);
        };
        service.getArticlesCountByStructureId = function(groupId,classNameId,ddmStructureKey,status) {
            return SessionService.invoke('/journalarticle/get-articles-count-by-structure-id',[{
                groupId:groupId
                ,classNameId:classNameId
                ,ddmStructureKey:ddmStructureKey
                ,status:status
            }]);
        };
        service.getDisplayArticleByUrlTitle = function(groupId,urlTitle) {
            return SessionService.invoke('/journalarticle/get-display-article-by-url-title',[{
                groupId:groupId
                ,urlTitle:urlTitle
            }]);
        };
        service.getFoldersAndArticlesCount = function(groupId,folderIds) {
            return SessionService.invoke('/journalarticle/get-folders-and-articles-count',[{
                groupId:groupId
                ,folderIds:folderIds
            }]);
        };
        service.getGroupArticles = function(groupId,userId,rootFolderId,start,end,orderByComparator) {
            return SessionService.invoke('/journalarticle/get-group-articles',[{
                groupId:groupId
                ,userId:userId
                ,rootFolderId:rootFolderId
                ,start:start
                ,end:end
                ,orderByComparator:orderByComparator
            }]);
        };
        service.getGroupArticles = function(groupId,userId,rootFolderId,status,start,end,orderByComparator) {
            return SessionService.invoke('/journalarticle/get-group-articles',[{
                groupId:groupId
                ,userId:userId
                ,rootFolderId:rootFolderId
                ,status:status
                ,start:start
                ,end:end
                ,orderByComparator:orderByComparator
            }]);
        };
        service.getGroupArticlesCount = function(groupId,userId,rootFolderId) {
            return SessionService.invoke('/journalarticle/get-group-articles-count',[{
                groupId:groupId
                ,userId:userId
                ,rootFolderId:rootFolderId
            }]);
        };
        service.getGroupArticlesCount = function(groupId,userId,rootFolderId,status) {
            return SessionService.invoke('/journalarticle/get-group-articles-count',[{
                groupId:groupId
                ,userId:userId
                ,rootFolderId:rootFolderId
                ,status:status
            }]);
        };
        service.getLatestArticle = function(resourcePrimKey) {
            return SessionService.invoke('/journalarticle/get-latest-article',[{
                resourcePrimKey:resourcePrimKey
            }]);
        };
        service.getLatestArticle = function(groupId,articleId,status) {
            return SessionService.invoke('/journalarticle/get-latest-article',[{
                groupId:groupId
                ,articleId:articleId
                ,status:status
            }]);
        };
        service.getLatestArticle = function(groupId,className,classPK) {
            return SessionService.invoke('/journalarticle/get-latest-article',[{
                groupId:groupId
                ,className:className
                ,classPK:classPK
            }]);
        };
        service.moveArticle = function(groupId,articleId,newFolderId) {
            return SessionService.invoke('/journalarticle/move-article',[{
                groupId:groupId
                ,articleId:articleId
                ,newFolderId:newFolderId
            }]);
        };
        service.moveArticleFromTrash = function(groupId,articleId,newFolderId,serviceContext) {
            return SessionService.invoke('/journalarticle/move-article-from-trash',[{
                groupId:groupId
                ,articleId:articleId
                ,newFolderId:newFolderId
                ,serviceContext:serviceContext
            }]);
        };
        service.moveArticleFromTrash = function(groupId,resourcePrimKey,newFolderId,serviceContext) {
            return SessionService.invoke('/journalarticle/move-article-from-trash',[{
                groupId:groupId
                ,resourcePrimKey:resourcePrimKey
                ,newFolderId:newFolderId
                ,serviceContext:serviceContext
            }]);
        };
        service.moveArticleToTrash = function(groupId,articleId) {
            return SessionService.invoke('/journalarticle/move-article-to-trash',[{
                groupId:groupId
                ,articleId:articleId
            }]);
        };
        service.removeArticleLocale = function(companyId,languageId) {
            return SessionService.invoke('/journalarticle/remove-article-locale',[{
                companyId:companyId
                ,languageId:languageId
            }]);
        };
        service.removeArticleLocale = function(groupId,articleId,version,languageId) {
            return SessionService.invoke('/journalarticle/remove-article-locale',[{
                groupId:groupId
                ,articleId:articleId
                ,version:version
                ,languageId:languageId
            }]);
        };
        service.restoreArticleFromTrash = function(resourcePrimKey) {
            return SessionService.invoke('/journalarticle/restore-article-from-trash',[{
                resourcePrimKey:resourcePrimKey
            }]);
        };
        service.restoreArticleFromTrash = function(groupId,articleId) {
            return SessionService.invoke('/journalarticle/restore-article-from-trash',[{
                groupId:groupId
                ,articleId:articleId
            }]);
        };
        service.search = function(companyId,groupId,folderIds,classNameId,keywords,version,type,ddmStructureKey,ddmTemplateKey,displayDateGT,displayDateLT,status,reviewDate,start,end,obc) {
            return SessionService.invoke('/journalarticle/search',[{
                companyId:companyId
                ,groupId:groupId
                ,folderIds:folderIds
                ,classNameId:classNameId
                ,keywords:keywords
                ,version:version
                ,type:type
                ,ddmStructureKey:ddmStructureKey
                ,ddmTemplateKey:ddmTemplateKey
                ,displayDateGT:displayDateGT
                ,displayDateLT:displayDateLT
                ,status:status
                ,reviewDate:reviewDate
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.search = function(companyId,groupId,folderIds,classNameId,articleId,version,title,description,content,type,ddmStructureKey,ddmTemplateKey,displayDateGT,displayDateLT,status,reviewDate,andOperator,start,end,obc) {
            return SessionService.invoke('/journalarticle/search',[{
                companyId:companyId
                ,groupId:groupId
                ,folderIds:folderIds
                ,classNameId:classNameId
                ,articleId:articleId
                ,version:version
                ,title:title
                ,description:description
                ,content:content
                ,type:type
                ,ddmStructureKey:ddmStructureKey
                ,ddmTemplateKey:ddmTemplateKey
                ,displayDateGT:displayDateGT
                ,displayDateLT:displayDateLT
                ,status:status
                ,reviewDate:reviewDate
                ,andOperator:andOperator
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.search = function(companyId,groupId,folderIds,classNameId,articleId,version,title,description,content,type,ddmStructureKeys,ddmTemplateKeys,displayDateGT,displayDateLT,status,reviewDate,andOperator,start,end,obc) {
            return SessionService.invoke('/journalarticle/search',[{
                companyId:companyId
                ,groupId:groupId
                ,folderIds:folderIds
                ,classNameId:classNameId
                ,articleId:articleId
                ,version:version
                ,title:title
                ,description:description
                ,content:content
                ,type:type
                ,ddmStructureKeys:ddmStructureKeys
                ,ddmTemplateKeys:ddmTemplateKeys
                ,displayDateGT:displayDateGT
                ,displayDateLT:displayDateLT
                ,status:status
                ,reviewDate:reviewDate
                ,andOperator:andOperator
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.search = function(groupId,creatorUserId,status,start,end) {
            return SessionService.invoke('/journalarticle/search',[{
                groupId:groupId
                ,creatorUserId:creatorUserId
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.searchCount = function(companyId,groupId,folderIds,classNameId,keywords,version,type,ddmStructureKey,ddmTemplateKey,displayDateGT,displayDateLT,status,reviewDate) {
            return SessionService.invoke('/journalarticle/search-count',[{
                companyId:companyId
                ,groupId:groupId
                ,folderIds:folderIds
                ,classNameId:classNameId
                ,keywords:keywords
                ,version:version
                ,type:type
                ,ddmStructureKey:ddmStructureKey
                ,ddmTemplateKey:ddmTemplateKey
                ,displayDateGT:displayDateGT
                ,displayDateLT:displayDateLT
                ,status:status
                ,reviewDate:reviewDate
            }]);
        };
        service.searchCount = function(companyId,groupId,folderIds,classNameId,articleId,version,title,description,content,type,ddmStructureKey,ddmTemplateKey,displayDateGT,displayDateLT,status,reviewDate,andOperator) {
            return SessionService.invoke('/journalarticle/search-count',[{
                companyId:companyId
                ,groupId:groupId
                ,folderIds:folderIds
                ,classNameId:classNameId
                ,articleId:articleId
                ,version:version
                ,title:title
                ,description:description
                ,content:content
                ,type:type
                ,ddmStructureKey:ddmStructureKey
                ,ddmTemplateKey:ddmTemplateKey
                ,displayDateGT:displayDateGT
                ,displayDateLT:displayDateLT
                ,status:status
                ,reviewDate:reviewDate
                ,andOperator:andOperator
            }]);
        };
        service.searchCount = function(companyId,groupId,folderIds,classNameId,articleId,version,title,description,content,type,ddmStructureKeys,ddmTemplateKeys,displayDateGT,displayDateLT,status,reviewDate,andOperator) {
            return SessionService.invoke('/journalarticle/search-count',[{
                companyId:companyId
                ,groupId:groupId
                ,folderIds:folderIds
                ,classNameId:classNameId
                ,articleId:articleId
                ,version:version
                ,title:title
                ,description:description
                ,content:content
                ,type:type
                ,ddmStructureKeys:ddmStructureKeys
                ,ddmTemplateKeys:ddmTemplateKeys
                ,displayDateGT:displayDateGT
                ,displayDateLT:displayDateLT
                ,status:status
                ,reviewDate:reviewDate
                ,andOperator:andOperator
            }]);
        };
        service.subscribe = function(groupId) {
            return SessionService.invoke('/journalarticle/subscribe',[{
                groupId:groupId
            }]);
        };
        service.unsubscribe = function(groupId) {
            return SessionService.invoke('/journalarticle/unsubscribe',[{
                groupId:groupId
            }]);
        };
        service.updateArticle = function(userId,groupId,folderId,articleId,version,titleMap,descriptionMap,content,layoutUuid,serviceContext) {
            return SessionService.invoke('/journalarticle/update-article',[{
                userId:userId
                ,groupId:groupId
                ,folderId:folderId
                ,articleId:articleId
                ,version:version
                ,titleMap:titleMap
                ,descriptionMap:descriptionMap
                ,content:content
                ,layoutUuid:layoutUuid
                ,serviceContext:serviceContext
            }]);
        };
        service.updateArticle = function(groupId,folderId,articleId,version,titleMap,descriptionMap,content,type,ddmStructureKey,ddmTemplateKey,layoutUuid,displayDateMonth,displayDateDay,displayDateYear,displayDateHour,displayDateMinute,expirationDateMonth,expirationDateDay,expirationDateYear,expirationDateHour,expirationDateMinute,neverExpire,reviewDateMonth,reviewDateDay,reviewDateYear,reviewDateHour,reviewDateMinute,neverReview,indexable,smallImage,smallImageURL,smallFile,images,articleURL,serviceContext) {
            return SessionService.invoke('/journalarticle/update-article',[{
                groupId:groupId
                ,folderId:folderId
                ,articleId:articleId
                ,version:version
                ,titleMap:titleMap
                ,descriptionMap:descriptionMap
                ,content:content
                ,type:type
                ,ddmStructureKey:ddmStructureKey
                ,ddmTemplateKey:ddmTemplateKey
                ,layoutUuid:layoutUuid
                ,displayDateMonth:displayDateMonth
                ,displayDateDay:displayDateDay
                ,displayDateYear:displayDateYear
                ,displayDateHour:displayDateHour
                ,displayDateMinute:displayDateMinute
                ,expirationDateMonth:expirationDateMonth
                ,expirationDateDay:expirationDateDay
                ,expirationDateYear:expirationDateYear
                ,expirationDateHour:expirationDateHour
                ,expirationDateMinute:expirationDateMinute
                ,neverExpire:neverExpire
                ,reviewDateMonth:reviewDateMonth
                ,reviewDateDay:reviewDateDay
                ,reviewDateYear:reviewDateYear
                ,reviewDateHour:reviewDateHour
                ,reviewDateMinute:reviewDateMinute
                ,neverReview:neverReview
                ,indexable:indexable
                ,smallImage:smallImage
                ,smallImageURL:smallImageURL
                ,smallFile:smallFile
                ,images:images
                ,articleURL:articleURL
                ,serviceContext:serviceContext
            }]);
        };
        service.updateArticle = function(groupId,folderId,articleId,version,content,serviceContext) {
            return SessionService.invoke('/journalarticle/update-article',[{
                groupId:groupId
                ,folderId:folderId
                ,articleId:articleId
                ,version:version
                ,content:content
                ,serviceContext:serviceContext
            }]);
        };
        service.updateArticleTranslation = function(groupId,articleId,version,locale,title,description,content,images) {
            return SessionService.invoke('/journalarticle/update-article-translation',[{
                groupId:groupId
                ,articleId:articleId
                ,version:version
                ,locale:locale
                ,title:title
                ,description:description
                ,content:content
                ,images:images
            }]);
        };
        service.updateArticleTranslation = function(groupId,articleId,version,locale,title,description,content,images,serviceContext) {
            return SessionService.invoke('/journalarticle/update-article-translation',[{
                groupId:groupId
                ,articleId:articleId
                ,version:version
                ,locale:locale
                ,title:title
                ,description:description
                ,content:content
                ,images:images
                ,serviceContext:serviceContext
            }]);
        };
        service.updateContent = function(groupId,articleId,version,content) {
            return SessionService.invoke('/journalarticle/update-content',[{
                groupId:groupId
                ,articleId:articleId
                ,version:version
                ,content:content
            }]);
        };
        service.updateStatus = function(groupId,articleId,version,status,articleURL,serviceContext) {
            return SessionService.invoke('/journalarticle/update-status',[{
                groupId:groupId
                ,articleId:articleId
                ,version:version
                ,status:status
                ,articleURL:articleURL
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('JournalfeedService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addFeed = function(groupId,feedId,autoFeedId,name,description,type,structureId,templateId,rendererTemplateId,delta,orderByCol,orderByType,targetLayoutFriendlyUrl,targetPortletId,contentField,feedType,feedVersion,serviceContext) {
            return SessionService.invoke('/journalfeed/add-feed',[{
                groupId:groupId
                ,feedId:feedId
                ,autoFeedId:autoFeedId
                ,name:name
                ,description:description
                ,type:type
                ,structureId:structureId
                ,templateId:templateId
                ,rendererTemplateId:rendererTemplateId
                ,delta:delta
                ,orderByCol:orderByCol
                ,orderByType:orderByType
                ,targetLayoutFriendlyUrl:targetLayoutFriendlyUrl
                ,targetPortletId:targetPortletId
                ,contentField:contentField
                ,feedType:feedType
                ,feedVersion:feedVersion
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteFeed = function(feedId) {
            return SessionService.invoke('/journalfeed/delete-feed',[{
                feedId:feedId
            }]);
        };
        service.deleteFeed = function(groupId,feedId) {
            return SessionService.invoke('/journalfeed/delete-feed',[{
                groupId:groupId
                ,feedId:feedId
            }]);
        };
        service.getFeed = function(feedId) {
            return SessionService.invoke('/journalfeed/get-feed',[{
                feedId:feedId
            }]);
        };
        service.getFeed = function(groupId,feedId) {
            return SessionService.invoke('/journalfeed/get-feed',[{
                groupId:groupId
                ,feedId:feedId
            }]);
        };
        service.updateFeed = function(groupId,feedId,name,description,type,structureId,templateId,rendererTemplateId,delta,orderByCol,orderByType,targetLayoutFriendlyUrl,targetPortletId,contentField,feedType,feedVersion,serviceContext) {
            return SessionService.invoke('/journalfeed/update-feed',[{
                groupId:groupId
                ,feedId:feedId
                ,name:name
                ,description:description
                ,type:type
                ,structureId:structureId
                ,templateId:templateId
                ,rendererTemplateId:rendererTemplateId
                ,delta:delta
                ,orderByCol:orderByCol
                ,orderByType:orderByType
                ,targetLayoutFriendlyUrl:targetLayoutFriendlyUrl
                ,targetPortletId:targetPortletId
                ,contentField:contentField
                ,feedType:feedType
                ,feedVersion:feedVersion
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('JournalfolderService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addFolder = function(groupId,parentFolderId,name,description,serviceContext) {
            return SessionService.invoke('/journalfolder/add-folder',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
                ,name:name
                ,description:description
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteFolder = function(folderId) {
            return SessionService.invoke('/journalfolder/delete-folder',[{
                folderId:folderId
            }]);
        };
        service.deleteFolder = function(folderId,includeTrashedEntries) {
            return SessionService.invoke('/journalfolder/delete-folder',[{
                folderId:folderId
                ,includeTrashedEntries:includeTrashedEntries
            }]);
        };
        service.getFolder = function(folderId) {
            return SessionService.invoke('/journalfolder/get-folder',[{
                folderId:folderId
            }]);
        };
        service.getFolderIds = function(groupId,folderId) {
            return SessionService.invoke('/journalfolder/get-folder-ids',[{
                groupId:groupId
                ,folderId:folderId
            }]);
        };
        service.getFolders = function(groupId) {
            return SessionService.invoke('/journalfolder/get-folders',[{
                groupId:groupId
            }]);
        };
        service.getFolders = function(groupId,parentFolderId) {
            return SessionService.invoke('/journalfolder/get-folders',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
            }]);
        };
        service.getFolders = function(groupId,parentFolderId,status) {
            return SessionService.invoke('/journalfolder/get-folders',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
                ,status:status
            }]);
        };
        service.getFolders = function(groupId,parentFolderId,start,end) {
            return SessionService.invoke('/journalfolder/get-folders',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
                ,start:start
                ,end:end
            }]);
        };
        service.getFolders = function(groupId,parentFolderId,status,start,end) {
            return SessionService.invoke('/journalfolder/get-folders',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.getFoldersAndArticles = function(groupId,folderId,start,end,obc) {
            return SessionService.invoke('/journalfolder/get-folders-and-articles',[{
                groupId:groupId
                ,folderId:folderId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getFoldersAndArticles = function(groupId,folderId,status,start,end,obc) {
            return SessionService.invoke('/journalfolder/get-folders-and-articles',[{
                groupId:groupId
                ,folderId:folderId
                ,status:status
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getFoldersAndArticlesCount = function(groupId,folderId) {
            return SessionService.invoke('/journalfolder/get-folders-and-articles-count',[{
                groupId:groupId
                ,folderId:folderId
            }]);
        };
        service.getFoldersAndArticlesCount = function(groupId,folderId,status) {
            return SessionService.invoke('/journalfolder/get-folders-and-articles-count',[{
                groupId:groupId
                ,folderId:folderId
                ,status:status
            }]);
        };
        service.getFoldersAndArticlesCount = function(groupId,folderIds,status) {
            return SessionService.invoke('/journalfolder/get-folders-and-articles-count',[{
                groupId:groupId
                ,folderIds:folderIds
                ,status:status
            }]);
        };
        service.getFoldersCount = function(groupId,parentFolderId) {
            return SessionService.invoke('/journalfolder/get-folders-count',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
            }]);
        };
        service.getFoldersCount = function(groupId,parentFolderId,status) {
            return SessionService.invoke('/journalfolder/get-folders-count',[{
                groupId:groupId
                ,parentFolderId:parentFolderId
                ,status:status
            }]);
        };
        service.getSubfolderIds = function(folderIds,groupId,folderId) {
            return SessionService.invoke('/journalfolder/get-subfolder-ids',[{
                folderIds:folderIds
                ,groupId:groupId
                ,folderId:folderId
            }]);
        };
        service.getSubfolderIds = function(groupId,folderId,recurse) {
            return SessionService.invoke('/journalfolder/get-subfolder-ids',[{
                groupId:groupId
                ,folderId:folderId
                ,recurse:recurse
            }]);
        };
        service.moveFolder = function(folderId,parentFolderId,serviceContext) {
            return SessionService.invoke('/journalfolder/move-folder',[{
                folderId:folderId
                ,parentFolderId:parentFolderId
                ,serviceContext:serviceContext
            }]);
        };
        service.moveFolderFromTrash = function(folderId,parentFolderId,serviceContext) {
            return SessionService.invoke('/journalfolder/move-folder-from-trash',[{
                folderId:folderId
                ,parentFolderId:parentFolderId
                ,serviceContext:serviceContext
            }]);
        };
        service.moveFolderToTrash = function(folderId) {
            return SessionService.invoke('/journalfolder/move-folder-to-trash',[{
                folderId:folderId
            }]);
        };
        service.restoreFolderFromTrash = function(folderId) {
            return SessionService.invoke('/journalfolder/restore-folder-from-trash',[{
                folderId:folderId
            }]);
        };
        service.updateFolder = function(folderId,parentFolderId,name,description,mergeWithParentFolder,serviceContext) {
            return SessionService.invoke('/journalfolder/update-folder',[{
                folderId:folderId
                ,parentFolderId:parentFolderId
                ,name:name
                ,description:description
                ,mergeWithParentFolder:mergeWithParentFolder
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('JournalstructureService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addStructure = function(groupId,structureId,autoStructureId,parentStructureId,nameMap,descriptionMap,xsd,serviceContext) {
            return SessionService.invoke('/journalstructure/add-structure',[{
                groupId:groupId
                ,structureId:structureId
                ,autoStructureId:autoStructureId
                ,parentStructureId:parentStructureId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,xsd:xsd
                ,serviceContext:serviceContext
            }]);
        };
        service.copyStructure = function(groupId,oldStructureId,newStructureId,autoStructureId) {
            return SessionService.invoke('/journalstructure/copy-structure',[{
                groupId:groupId
                ,oldStructureId:oldStructureId
                ,newStructureId:newStructureId
                ,autoStructureId:autoStructureId
            }]);
        };
        service.deleteStructure = function(groupId,structureId) {
            return SessionService.invoke('/journalstructure/delete-structure',[{
                groupId:groupId
                ,structureId:structureId
            }]);
        };
        service.getStructure = function(groupId,structureId) {
            return SessionService.invoke('/journalstructure/get-structure',[{
                groupId:groupId
                ,structureId:structureId
            }]);
        };
        service.getStructure = function(groupId,structureId,includeGlobalStructures) {
            return SessionService.invoke('/journalstructure/get-structure',[{
                groupId:groupId
                ,structureId:structureId
                ,includeGlobalStructures:includeGlobalStructures
            }]);
        };
        service.getStructures = function(groupId) {
            return SessionService.invoke('/journalstructure/get-structures',[{
                groupId:groupId
            }]);
        };
        service.getStructures = function(groupIds) {
            return SessionService.invoke('/journalstructure/get-structures',[{
                groupIds:groupIds
            }]);
        };
        service.search = function(companyId,groupIds,keywords,start,end,obc) {
            return SessionService.invoke('/journalstructure/search',[{
                companyId:companyId
                ,groupIds:groupIds
                ,keywords:keywords
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.search = function(companyId,groupIds,structureId,name,description,andOperator,start,end,obc) {
            return SessionService.invoke('/journalstructure/search',[{
                companyId:companyId
                ,groupIds:groupIds
                ,structureId:structureId
                ,name:name
                ,description:description
                ,andOperator:andOperator
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.searchCount = function(companyId,groupIds,keywords) {
            return SessionService.invoke('/journalstructure/search-count',[{
                companyId:companyId
                ,groupIds:groupIds
                ,keywords:keywords
            }]);
        };
        service.searchCount = function(companyId,groupIds,structureId,name,description,andOperator) {
            return SessionService.invoke('/journalstructure/search-count',[{
                companyId:companyId
                ,groupIds:groupIds
                ,structureId:structureId
                ,name:name
                ,description:description
                ,andOperator:andOperator
            }]);
        };
        service.updateStructure = function(groupId,structureId,parentStructureId,nameMap,descriptionMap,xsd,serviceContext) {
            return SessionService.invoke('/journalstructure/update-structure',[{
                groupId:groupId
                ,structureId:structureId
                ,parentStructureId:parentStructureId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,xsd:xsd
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('JournaltemplateService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addTemplate = function(groupId,templateId,autoTemplateId,structureId,nameMap,descriptionMap,xsl,formatXsl,langType,cacheable,serviceContext) {
            return SessionService.invoke('/journaltemplate/add-template',[{
                groupId:groupId
                ,templateId:templateId
                ,autoTemplateId:autoTemplateId
                ,structureId:structureId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,xsl:xsl
                ,formatXsl:formatXsl
                ,langType:langType
                ,cacheable:cacheable
                ,serviceContext:serviceContext
            }]);
        };
        service.addTemplate = function(groupId,templateId,autoTemplateId,structureId,nameMap,descriptionMap,xsl,formatXsl,langType,cacheable,smallImage,smallImageURL,smallFile,serviceContext) {
            return SessionService.invoke('/journaltemplate/add-template',[{
                groupId:groupId
                ,templateId:templateId
                ,autoTemplateId:autoTemplateId
                ,structureId:structureId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,xsl:xsl
                ,formatXsl:formatXsl
                ,langType:langType
                ,cacheable:cacheable
                ,smallImage:smallImage
                ,smallImageURL:smallImageURL
                ,smallFile:smallFile
                ,serviceContext:serviceContext
            }]);
        };
        service.copyTemplate = function(groupId,oldTemplateId,newTemplateId,autoTemplateId) {
            return SessionService.invoke('/journaltemplate/copy-template',[{
                groupId:groupId
                ,oldTemplateId:oldTemplateId
                ,newTemplateId:newTemplateId
                ,autoTemplateId:autoTemplateId
            }]);
        };
        service.deleteTemplate = function(groupId,templateId) {
            return SessionService.invoke('/journaltemplate/delete-template',[{
                groupId:groupId
                ,templateId:templateId
            }]);
        };
        service.getStructureTemplates = function(groupId,structureId) {
            return SessionService.invoke('/journaltemplate/get-structure-templates',[{
                groupId:groupId
                ,structureId:structureId
            }]);
        };
        service.getTemplate = function(groupId,templateId) {
            return SessionService.invoke('/journaltemplate/get-template',[{
                groupId:groupId
                ,templateId:templateId
            }]);
        };
        service.getTemplate = function(groupId,templateId,includeGlobalTemplates) {
            return SessionService.invoke('/journaltemplate/get-template',[{
                groupId:groupId
                ,templateId:templateId
                ,includeGlobalTemplates:includeGlobalTemplates
            }]);
        };
        service.search = function(companyId,groupIds,templateId,structureId,structureIdComparator,name,description,andOperator,start,end,obc) {
            return SessionService.invoke('/journaltemplate/search',[{
                companyId:companyId
                ,groupIds:groupIds
                ,templateId:templateId
                ,structureId:structureId
                ,structureIdComparator:structureIdComparator
                ,name:name
                ,description:description
                ,andOperator:andOperator
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.search = function(companyId,groupIds,keywords,structureId,structureIdComparator,start,end,obc) {
            return SessionService.invoke('/journaltemplate/search',[{
                companyId:companyId
                ,groupIds:groupIds
                ,keywords:keywords
                ,structureId:structureId
                ,structureIdComparator:structureIdComparator
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.searchCount = function(companyId,groupIds,keywords,structureId,structureIdComparator) {
            return SessionService.invoke('/journaltemplate/search-count',[{
                companyId:companyId
                ,groupIds:groupIds
                ,keywords:keywords
                ,structureId:structureId
                ,structureIdComparator:structureIdComparator
            }]);
        };
        service.searchCount = function(companyId,groupIds,templateId,structureId,structureIdComparator,name,description,andOperator) {
            return SessionService.invoke('/journaltemplate/search-count',[{
                companyId:companyId
                ,groupIds:groupIds
                ,templateId:templateId
                ,structureId:structureId
                ,structureIdComparator:structureIdComparator
                ,name:name
                ,description:description
                ,andOperator:andOperator
            }]);
        };
        service.updateTemplate = function(groupId,templateId,structureId,nameMap,descriptionMap,xsl,formatXsl,langType,cacheable,serviceContext) {
            return SessionService.invoke('/journaltemplate/update-template',[{
                groupId:groupId
                ,templateId:templateId
                ,structureId:structureId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,xsl:xsl
                ,formatXsl:formatXsl
                ,langType:langType
                ,cacheable:cacheable
                ,serviceContext:serviceContext
            }]);
        };
        service.updateTemplate = function(groupId,templateId,structureId,nameMap,descriptionMap,xsl,formatXsl,langType,cacheable,smallImage,smallImageURL,smallFile,serviceContext) {
            return SessionService.invoke('/journaltemplate/update-template',[{
                groupId:groupId
                ,templateId:templateId
                ,structureId:structureId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,xsl:xsl
                ,formatXsl:formatXsl
                ,langType:langType
                ,cacheable:cacheable
                ,smallImage:smallImage
                ,smallImageURL:smallImageURL
                ,smallFile:smallFile
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('LayoutService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addLayout = function(groupId,privateLayout,parentLayoutId,name,title,description,type,hidden,friendlyURL,serviceContext) {
            return SessionService.invoke('/layout/add-layout',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,parentLayoutId:parentLayoutId
                ,name:name
                ,title:title
                ,description:description
                ,type:type
                ,hidden:hidden
                ,friendlyURL:friendlyURL
                ,serviceContext:serviceContext
            }]);
        };
        service.addLayout = function(groupId,privateLayout,parentLayoutId,localeNamesMap,localeTitlesMap,descriptionMap,keywordsMap,robotsMap,type,hidden,friendlyURL,serviceContext) {
            return SessionService.invoke('/layout/add-layout',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,parentLayoutId:parentLayoutId
                ,localeNamesMap:localeNamesMap
                ,localeTitlesMap:localeTitlesMap
                ,descriptionMap:descriptionMap
                ,keywordsMap:keywordsMap
                ,robotsMap:robotsMap
                ,type:type
                ,hidden:hidden
                ,friendlyURL:friendlyURL
                ,serviceContext:serviceContext
            }]);
        };
        service.addLayout = function(groupId,privateLayout,parentLayoutId,localeNamesMap,localeTitlesMap,descriptionMap,keywordsMap,robotsMap,type,typeSettings,hidden,friendlyURLMap,serviceContext) {
            return SessionService.invoke('/layout/add-layout',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,parentLayoutId:parentLayoutId
                ,localeNamesMap:localeNamesMap
                ,localeTitlesMap:localeTitlesMap
                ,descriptionMap:descriptionMap
                ,keywordsMap:keywordsMap
                ,robotsMap:robotsMap
                ,type:type
                ,typeSettings:typeSettings
                ,hidden:hidden
                ,friendlyURLMap:friendlyURLMap
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteLayout = function(plid,serviceContext) {
            return SessionService.invoke('/layout/delete-layout',[{
                plid:plid
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteLayout = function(groupId,privateLayout,layoutId,serviceContext) {
            return SessionService.invoke('/layout/delete-layout',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,layoutId:layoutId
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteTempFileEntry = function(groupId,fileName,tempFolderName) {
            return SessionService.invoke('/layout/delete-temp-file-entry',[{
                groupId:groupId
                ,fileName:fileName
                ,tempFolderName:tempFolderName
            }]);
        };
        service.exportLayouts = function(groupId,privateLayout,parameterMap,startDate,endDate) {
            return SessionService.invoke('/layout/export-layouts',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,parameterMap:parameterMap
                ,startDate:startDate
                ,endDate:endDate
            }]);
        };
        service.exportLayouts = function(groupId,privateLayout,layoutIds,parameterMap,startDate,endDate) {
            return SessionService.invoke('/layout/export-layouts',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,layoutIds:layoutIds
                ,parameterMap:parameterMap
                ,startDate:startDate
                ,endDate:endDate
            }]);
        };
        service.exportLayoutsAsFile = function(groupId,privateLayout,layoutIds,parameterMap,startDate,endDate) {
            return SessionService.invoke('/layout/export-layouts-as-file',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,layoutIds:layoutIds
                ,parameterMap:parameterMap
                ,startDate:startDate
                ,endDate:endDate
            }]);
        };
        service.exportLayoutsAsFileInBackground = function(taskName,groupId,privateLayout,layoutIds,parameterMap,startDate,endDate,fileName) {
            return SessionService.invoke('/layout/export-layouts-as-file-in-background',[{
                taskName:taskName
                ,groupId:groupId
                ,privateLayout:privateLayout
                ,layoutIds:layoutIds
                ,parameterMap:parameterMap
                ,startDate:startDate
                ,endDate:endDate
                ,fileName:fileName
            }]);
        };
        service.exportPortletInfo = function(companyId,portletId,parameterMap,startDate,endDate) {
            return SessionService.invoke('/layout/export-portlet-info',[{
                companyId:companyId
                ,portletId:portletId
                ,parameterMap:parameterMap
                ,startDate:startDate
                ,endDate:endDate
            }]);
        };
        service.exportPortletInfo = function(plid,groupId,portletId,parameterMap,startDate,endDate) {
            return SessionService.invoke('/layout/export-portlet-info',[{
                plid:plid
                ,groupId:groupId
                ,portletId:portletId
                ,parameterMap:parameterMap
                ,startDate:startDate
                ,endDate:endDate
            }]);
        };
        service.exportPortletInfoAsFile = function(portletId,parameterMap,startDate,endDate) {
            return SessionService.invoke('/layout/export-portlet-info-as-file',[{
                portletId:portletId
                ,parameterMap:parameterMap
                ,startDate:startDate
                ,endDate:endDate
            }]);
        };
        service.exportPortletInfoAsFile = function(plid,groupId,portletId,parameterMap,startDate,endDate) {
            return SessionService.invoke('/layout/export-portlet-info-as-file',[{
                plid:plid
                ,groupId:groupId
                ,portletId:portletId
                ,parameterMap:parameterMap
                ,startDate:startDate
                ,endDate:endDate
            }]);
        };
        service.exportPortletInfoAsFileInBackground = function(taskName,portletId,parameterMap,startDate,endDate,fileName) {
            return SessionService.invoke('/layout/export-portlet-info-as-file-in-background',[{
                taskName:taskName
                ,portletId:portletId
                ,parameterMap:parameterMap
                ,startDate:startDate
                ,endDate:endDate
                ,fileName:fileName
            }]);
        };
        service.exportPortletInfoAsFileInBackground = function(taskName,plid,groupId,portletId,parameterMap,startDate,endDate,fileName) {
            return SessionService.invoke('/layout/export-portlet-info-as-file-in-background',[{
                taskName:taskName
                ,plid:plid
                ,groupId:groupId
                ,portletId:portletId
                ,parameterMap:parameterMap
                ,startDate:startDate
                ,endDate:endDate
                ,fileName:fileName
            }]);
        };
        service.getAncestorLayouts = function(plid) {
            return SessionService.invoke('/layout/get-ancestor-layouts',[{
                plid:plid
            }]);
        };
        service.getDefaultPlid = function(groupId,scopeGroupId,portletId) {
            return SessionService.invoke('/layout/get-default-plid',[{
                groupId:groupId
                ,scopeGroupId:scopeGroupId
                ,portletId:portletId
            }]);
        };
        service.getDefaultPlid = function(groupId,scopeGroupId,privateLayout,portletId) {
            return SessionService.invoke('/layout/get-default-plid',[{
                groupId:groupId
                ,scopeGroupId:scopeGroupId
                ,privateLayout:privateLayout
                ,portletId:portletId
            }]);
        };
        service.getLayoutByUuidAndGroupId = function(uuid,groupId,privateLayout) {
            return SessionService.invoke('/layout/get-layout-by-uuid-and-group-id',[{
                uuid:uuid
                ,groupId:groupId
                ,privateLayout:privateLayout
            }]);
        };
        service.getLayoutName = function(groupId,privateLayout,layoutId,languageId) {
            return SessionService.invoke('/layout/get-layout-name',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,layoutId:layoutId
                ,languageId:languageId
            }]);
        };
        service.getLayoutReferences = function(companyId,portletId,preferencesKey,preferencesValue) {
            return SessionService.invoke('/layout/get-layout-references',[{
                companyId:companyId
                ,portletId:portletId
                ,preferencesKey:preferencesKey
                ,preferencesValue:preferencesValue
            }]);
        };
        service.getLayouts = function(groupId,privateLayout) {
            return SessionService.invoke('/layout/get-layouts',[{
                groupId:groupId
                ,privateLayout:privateLayout
            }]);
        };
        service.getLayouts = function(groupId,privateLayout,parentLayoutId) {
            return SessionService.invoke('/layout/get-layouts',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,parentLayoutId:parentLayoutId
            }]);
        };
        service.getLayouts = function(groupId,privateLayout,parentLayoutId,incomplete,start,end) {
            return SessionService.invoke('/layout/get-layouts',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,parentLayoutId:parentLayoutId
                ,incomplete:incomplete
                ,start:start
                ,end:end
            }]);
        };
        service.getLayoutsCount = function(groupId,privateLayout,parentLayoutId) {
            return SessionService.invoke('/layout/get-layouts-count',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,parentLayoutId:parentLayoutId
            }]);
        };
        service.getTempFileEntryNames = function(groupId,tempFolderName) {
            return SessionService.invoke('/layout/get-temp-file-entry-names',[{
                groupId:groupId
                ,tempFolderName:tempFolderName
            }]);
        };
        service.importLayouts = function(groupId,privateLayout,parameterMap,bytes) {
            return SessionService.invoke('/layout/import-layouts',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,parameterMap:parameterMap
                ,bytes:bytes
            }]);
        };
        service.importLayouts = function(groupId,privateLayout,parameterMap,file) {
            return SessionService.invoke('/layout/import-layouts',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,parameterMap:parameterMap
                ,file:file
            }]);
        };
        service.importLayoutsInBackground = function(taskName,groupId,privateLayout,parameterMap,file) {
            return SessionService.invoke('/layout/import-layouts-in-background',[{
                taskName:taskName
                ,groupId:groupId
                ,privateLayout:privateLayout
                ,parameterMap:parameterMap
                ,file:file
            }]);
        };
        service.importPortletInfo = function(portletId,parameterMap,file) {
            return SessionService.invoke('/layout/import-portlet-info',[{
                portletId:portletId
                ,parameterMap:parameterMap
                ,file:file
            }]);
        };
        service.importPortletInfo = function(plid,groupId,portletId,parameterMap,file) {
            return SessionService.invoke('/layout/import-portlet-info',[{
                plid:plid
                ,groupId:groupId
                ,portletId:portletId
                ,parameterMap:parameterMap
                ,file:file
            }]);
        };
        service.importPortletInfoInBackground = function(taskName,portletId,parameterMap,file) {
            return SessionService.invoke('/layout/import-portlet-info-in-background',[{
                taskName:taskName
                ,portletId:portletId
                ,parameterMap:parameterMap
                ,file:file
            }]);
        };
        service.importPortletInfoInBackground = function(taskName,plid,groupId,portletId,parameterMap,file) {
            return SessionService.invoke('/layout/import-portlet-info-in-background',[{
                taskName:taskName
                ,plid:plid
                ,groupId:groupId
                ,portletId:portletId
                ,parameterMap:parameterMap
                ,file:file
            }]);
        };
        service.schedulePublishToLive = function(sourceGroupId,targetGroupId,privateLayout,layoutIdMap,parameterMap,scope,startDate,endDate,groupName,cronText,schedulerStartDate,schedulerEndDate,description) {
            return SessionService.invoke('/layout/schedule-publish-to-live',[{
                sourceGroupId:sourceGroupId
                ,targetGroupId:targetGroupId
                ,privateLayout:privateLayout
                ,layoutIdMap:layoutIdMap
                ,parameterMap:parameterMap
                ,scope:scope
                ,startDate:startDate
                ,endDate:endDate
                ,groupName:groupName
                ,cronText:cronText
                ,schedulerStartDate:schedulerStartDate
                ,schedulerEndDate:schedulerEndDate
                ,description:description
            }]);
        };
        service.schedulePublishToRemote = function(sourceGroupId,privateLayout,layoutIdMap,parameterMap,remoteAddress,remotePort,remotePathContext,secureConnection,remoteGroupId,remotePrivateLayout,startDate,endDate,groupName,cronText,schedulerStartDate,schedulerEndDate,description) {
            return SessionService.invoke('/layout/schedule-publish-to-remote',[{
                sourceGroupId:sourceGroupId
                ,privateLayout:privateLayout
                ,layoutIdMap:layoutIdMap
                ,parameterMap:parameterMap
                ,remoteAddress:remoteAddress
                ,remotePort:remotePort
                ,remotePathContext:remotePathContext
                ,secureConnection:secureConnection
                ,remoteGroupId:remoteGroupId
                ,remotePrivateLayout:remotePrivateLayout
                ,startDate:startDate
                ,endDate:endDate
                ,groupName:groupName
                ,cronText:cronText
                ,schedulerStartDate:schedulerStartDate
                ,schedulerEndDate:schedulerEndDate
                ,description:description
            }]);
        };
        service.setLayouts = function(groupId,privateLayout,parentLayoutId,layoutIds,serviceContext) {
            return SessionService.invoke('/layout/set-layouts',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,parentLayoutId:parentLayoutId
                ,layoutIds:layoutIds
                ,serviceContext:serviceContext
            }]);
        };
        service.unschedulePublishToLive = function(groupId,jobName,groupName) {
            return SessionService.invoke('/layout/unschedule-publish-to-live',[{
                groupId:groupId
                ,jobName:jobName
                ,groupName:groupName
            }]);
        };
        service.unschedulePublishToRemote = function(groupId,jobName,groupName) {
            return SessionService.invoke('/layout/unschedule-publish-to-remote',[{
                groupId:groupId
                ,jobName:jobName
                ,groupName:groupName
            }]);
        };
        service.updateLayout = function(groupId,privateLayout,layoutId,parentLayoutId,localeNamesMap,localeTitlesMap,descriptionMap,keywordsMap,robotsMap,type,hidden,friendlyURL,iconImage,iconBytes,serviceContext) {
            return SessionService.invoke('/layout/update-layout',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,layoutId:layoutId
                ,parentLayoutId:parentLayoutId
                ,localeNamesMap:localeNamesMap
                ,localeTitlesMap:localeTitlesMap
                ,descriptionMap:descriptionMap
                ,keywordsMap:keywordsMap
                ,robotsMap:robotsMap
                ,type:type
                ,hidden:hidden
                ,friendlyURL:friendlyURL
                ,iconImage:iconImage
                ,iconBytes:iconBytes
                ,serviceContext:serviceContext
            }]);
        };
        service.updateLayout = function(groupId,privateLayout,layoutId,parentLayoutId,localeNamesMap,localeTitlesMap,descriptionMap,keywordsMap,robotsMap,type,hidden,friendlyURLMap,iconImage,iconBytes,serviceContext) {
            return SessionService.invoke('/layout/update-layout',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,layoutId:layoutId
                ,parentLayoutId:parentLayoutId
                ,localeNamesMap:localeNamesMap
                ,localeTitlesMap:localeTitlesMap
                ,descriptionMap:descriptionMap
                ,keywordsMap:keywordsMap
                ,robotsMap:robotsMap
                ,type:type
                ,hidden:hidden
                ,friendlyURLMap:friendlyURLMap
                ,iconImage:iconImage
                ,iconBytes:iconBytes
                ,serviceContext:serviceContext
            }]);
        };
        service.updateLayout = function(groupId,privateLayout,layoutId,typeSettings) {
            return SessionService.invoke('/layout/update-layout',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,layoutId:layoutId
                ,typeSettings:typeSettings
            }]);
        };
        service.updateLookAndFeel = function(groupId,privateLayout,layoutId,themeId,colorSchemeId,css,wapTheme) {
            return SessionService.invoke('/layout/update-look-and-feel',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,layoutId:layoutId
                ,themeId:themeId
                ,colorSchemeId:colorSchemeId
                ,css:css
                ,wapTheme:wapTheme
            }]);
        };
        service.updateName = function(plid,name,languageId) {
            return SessionService.invoke('/layout/update-name',[{
                plid:plid
                ,name:name
                ,languageId:languageId
            }]);
        };
        service.updateName = function(groupId,privateLayout,layoutId,name,languageId) {
            return SessionService.invoke('/layout/update-name',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,layoutId:layoutId
                ,name:name
                ,languageId:languageId
            }]);
        };
        service.updateParentLayoutId = function(plid,parentPlid) {
            return SessionService.invoke('/layout/update-parent-layout-id',[{
                plid:plid
                ,parentPlid:parentPlid
            }]);
        };
        service.updateParentLayoutId = function(groupId,privateLayout,layoutId,parentLayoutId) {
            return SessionService.invoke('/layout/update-parent-layout-id',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,layoutId:layoutId
                ,parentLayoutId:parentLayoutId
            }]);
        };
        service.updateParentLayoutIdAndPriority = function(plid,parentPlid,priority) {
            return SessionService.invoke('/layout/update-parent-layout-id-and-priority',[{
                plid:plid
                ,parentPlid:parentPlid
                ,priority:priority
            }]);
        };
        service.updatePriority = function(plid,priority) {
            return SessionService.invoke('/layout/update-priority',[{
                plid:plid
                ,priority:priority
            }]);
        };
        service.updatePriority = function(groupId,privateLayout,layoutId,priority) {
            return SessionService.invoke('/layout/update-priority',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,layoutId:layoutId
                ,priority:priority
            }]);
        };
        service.updatePriority = function(groupId,privateLayout,layoutId,nextLayoutId,previousLayoutId) {
            return SessionService.invoke('/layout/update-priority',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,layoutId:layoutId
                ,nextLayoutId:nextLayoutId
                ,previousLayoutId:previousLayoutId
            }]);
        };
        service.validateImportLayoutsFile = function(groupId,privateLayout,parameterMap,file) {
            return SessionService.invoke('/layout/validate-import-layouts-file',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,parameterMap:parameterMap
                ,file:file
            }]);
        };
        service.validateImportPortletInfo = function(plid,groupId,portletId,parameterMap,file) {
            return SessionService.invoke('/layout/validate-import-portlet-info',[{
                plid:plid
                ,groupId:groupId
                ,portletId:portletId
                ,parameterMap:parameterMap
                ,file:file
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('LayoutbranchService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addLayoutBranch = function(layoutRevisionId,name,description,master,serviceContext) {
            return SessionService.invoke('/layoutbranch/add-layout-branch',[{
                layoutRevisionId:layoutRevisionId
                ,name:name
                ,description:description
                ,master:master
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteLayoutBranch = function(layoutBranchId) {
            return SessionService.invoke('/layoutbranch/delete-layout-branch',[{
                layoutBranchId:layoutBranchId
            }]);
        };
        service.updateLayoutBranch = function(layoutBranchId,name,description,serviceContext) {
            return SessionService.invoke('/layoutbranch/update-layout-branch',[{
                layoutBranchId:layoutBranchId
                ,name:name
                ,description:description
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('LayoutprototypeService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addLayoutPrototype = function(nameMap,description,active) {
            return SessionService.invoke('/layoutprototype/add-layout-prototype',[{
                nameMap:nameMap
                ,description:description
                ,active:active
            }]);
        };
        service.addLayoutPrototype = function(nameMap,description,active,serviceContext) {
            return SessionService.invoke('/layoutprototype/add-layout-prototype',[{
                nameMap:nameMap
                ,description:description
                ,active:active
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteLayoutPrototype = function(layoutPrototypeId) {
            return SessionService.invoke('/layoutprototype/delete-layout-prototype',[{
                layoutPrototypeId:layoutPrototypeId
            }]);
        };
        service.getLayoutPrototype = function(layoutPrototypeId) {
            return SessionService.invoke('/layoutprototype/get-layout-prototype',[{
                layoutPrototypeId:layoutPrototypeId
            }]);
        };
        service.search = function(companyId,active,obc) {
            return SessionService.invoke('/layoutprototype/search',[{
                companyId:companyId
                ,active:active
                ,obc:obc
            }]);
        };
        service.updateLayoutPrototype = function(layoutPrototypeId,nameMap,description,active) {
            return SessionService.invoke('/layoutprototype/update-layout-prototype',[{
                layoutPrototypeId:layoutPrototypeId
                ,nameMap:nameMap
                ,description:description
                ,active:active
            }]);
        };
        service.updateLayoutPrototype = function(layoutPrototypeId,nameMap,description,active,serviceContext) {
            return SessionService.invoke('/layoutprototype/update-layout-prototype',[{
                layoutPrototypeId:layoutPrototypeId
                ,nameMap:nameMap
                ,description:description
                ,active:active
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('LayoutrevisionService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addLayoutRevision = function(userId,layoutSetBranchId,layoutBranchId,parentLayoutRevisionId,head,plid,portletPreferencesPlid,privateLayout,name,title,description,keywords,robots,typeSettings,iconImage,iconImageId,themeId,colorSchemeId,wapThemeId,wapColorSchemeId,css,serviceContext) {
            return SessionService.invoke('/layoutrevision/add-layout-revision',[{
                userId:userId
                ,layoutSetBranchId:layoutSetBranchId
                ,layoutBranchId:layoutBranchId
                ,parentLayoutRevisionId:parentLayoutRevisionId
                ,head:head
                ,plid:plid
                ,portletPreferencesPlid:portletPreferencesPlid
                ,privateLayout:privateLayout
                ,name:name
                ,title:title
                ,description:description
                ,keywords:keywords
                ,robots:robots
                ,typeSettings:typeSettings
                ,iconImage:iconImage
                ,iconImageId:iconImageId
                ,themeId:themeId
                ,colorSchemeId:colorSchemeId
                ,wapThemeId:wapThemeId
                ,wapColorSchemeId:wapColorSchemeId
                ,css:css
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('LayoutsetService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.updateLayoutSetPrototypeLinkEnabled = function(groupId,privateLayout,layoutSetPrototypeLinkEnabled,layoutSetPrototypeUuid) {
            return SessionService.invoke('/layoutset/update-layout-set-prototype-link-enabled',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,layoutSetPrototypeLinkEnabled:layoutSetPrototypeLinkEnabled
                ,layoutSetPrototypeUuid:layoutSetPrototypeUuid
            }]);
        };
        service.updateLogo = function(groupId,privateLayout,logo,bytes) {
            return SessionService.invoke('/layoutset/update-logo',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,logo:logo
                ,bytes:bytes
            }]);
        };
        service.updateLogo = function(groupId,privateLayout,logo,file) {
            return SessionService.invoke('/layoutset/update-logo',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,logo:logo
                ,file:file
            }]);
        };
        service.updateLookAndFeel = function(groupId,privateLayout,themeId,colorSchemeId,css,wapTheme) {
            return SessionService.invoke('/layoutset/update-look-and-feel',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,themeId:themeId
                ,colorSchemeId:colorSchemeId
                ,css:css
                ,wapTheme:wapTheme
            }]);
        };
        service.updateSettings = function(groupId,privateLayout,settings) {
            return SessionService.invoke('/layoutset/update-settings',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,settings:settings
            }]);
        };
        service.updateVirtualHost = function(groupId,privateLayout,virtualHost) {
            return SessionService.invoke('/layoutset/update-virtual-host',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,virtualHost:virtualHost
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('LayoutsetbranchService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addLayoutSetBranch = function(groupId,privateLayout,name,description,master,copyLayoutSetBranchId,serviceContext) {
            return SessionService.invoke('/layoutsetbranch/add-layout-set-branch',[{
                groupId:groupId
                ,privateLayout:privateLayout
                ,name:name
                ,description:description
                ,master:master
                ,copyLayoutSetBranchId:copyLayoutSetBranchId
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteLayoutSetBranch = function(layoutSetBranchId) {
            return SessionService.invoke('/layoutsetbranch/delete-layout-set-branch',[{
                layoutSetBranchId:layoutSetBranchId
            }]);
        };
        service.getLayoutSetBranches = function(groupId,privateLayout) {
            return SessionService.invoke('/layoutsetbranch/get-layout-set-branches',[{
                groupId:groupId
                ,privateLayout:privateLayout
            }]);
        };
        service.mergeLayoutSetBranch = function(layoutSetBranchId,mergeLayoutSetBranchId,serviceContext) {
            return SessionService.invoke('/layoutsetbranch/merge-layout-set-branch',[{
                layoutSetBranchId:layoutSetBranchId
                ,mergeLayoutSetBranchId:mergeLayoutSetBranchId
                ,serviceContext:serviceContext
            }]);
        };
        service.updateLayoutSetBranch = function(groupId,layoutSetBranchId,name,description,serviceContext) {
            return SessionService.invoke('/layoutsetbranch/update-layout-set-branch',[{
                groupId:groupId
                ,layoutSetBranchId:layoutSetBranchId
                ,name:name
                ,description:description
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('LayoutsetprototypeService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addLayoutSetPrototype = function(nameMap,description,active,layoutsUpdateable,serviceContext) {
            return SessionService.invoke('/layoutsetprototype/add-layout-set-prototype',[{
                nameMap:nameMap
                ,description:description
                ,active:active
                ,layoutsUpdateable:layoutsUpdateable
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteLayoutSetPrototype = function(layoutSetPrototypeId) {
            return SessionService.invoke('/layoutsetprototype/delete-layout-set-prototype',[{
                layoutSetPrototypeId:layoutSetPrototypeId
            }]);
        };
        service.getLayoutSetPrototype = function(layoutSetPrototypeId) {
            return SessionService.invoke('/layoutsetprototype/get-layout-set-prototype',[{
                layoutSetPrototypeId:layoutSetPrototypeId
            }]);
        };
        service.search = function(companyId,active,obc) {
            return SessionService.invoke('/layoutsetprototype/search',[{
                companyId:companyId
                ,active:active
                ,obc:obc
            }]);
        };
        service.updateLayoutSetPrototype = function(layoutSetPrototypeId,settings) {
            return SessionService.invoke('/layoutsetprototype/update-layout-set-prototype',[{
                layoutSetPrototypeId:layoutSetPrototypeId
                ,settings:settings
            }]);
        };
        service.updateLayoutSetPrototype = function(layoutSetPrototypeId,nameMap,description,active,layoutsUpdateable,serviceContext) {
            return SessionService.invoke('/layoutsetprototype/update-layout-set-prototype',[{
                layoutSetPrototypeId:layoutSetPrototypeId
                ,nameMap:nameMap
                ,description:description
                ,active:active
                ,layoutsUpdateable:layoutsUpdateable
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('ListtypeService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.getListType = function(listTypeId) {
            return SessionService.invoke('/listtype/get-list-type',[{
                listTypeId:listTypeId
            }]);
        };
        service.getListTypes = function(type) {
            return SessionService.invoke('/listtype/get-list-types',[{
                type:type
            }]);
        };
        service.validate = function(listTypeId,type) {
            return SessionService.invoke('/listtype/validate',[{
                listTypeId:listTypeId
                ,type:type
            }]);
        };
        service.validate = function(listTypeId,classNameId,type) {
            return SessionService.invoke('/listtype/validate',[{
                listTypeId:listTypeId
                ,classNameId:classNameId
                ,type:type
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('MbbanService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addBan = function(banUserId,serviceContext) {
            return SessionService.invoke('/mbban/add-ban',[{
                banUserId:banUserId
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteBan = function(banUserId,serviceContext) {
            return SessionService.invoke('/mbban/delete-ban',[{
                banUserId:banUserId
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('MbcategoryService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addCategory = function(parentCategoryId,name,description,displayStyle,emailAddress,inProtocol,inServerName,inServerPort,inUseSSL,inUserName,inPassword,inReadInterval,outEmailAddress,outCustom,outServerName,outServerPort,outUseSSL,outUserName,outPassword,mailingListActive,allowAnonymousEmail,serviceContext) {
            return SessionService.invoke('/mbcategory/add-category',[{
                parentCategoryId:parentCategoryId
                ,name:name
                ,description:description
                ,displayStyle:displayStyle
                ,emailAddress:emailAddress
                ,inProtocol:inProtocol
                ,inServerName:inServerName
                ,inServerPort:inServerPort
                ,inUseSSL:inUseSSL
                ,inUserName:inUserName
                ,inPassword:inPassword
                ,inReadInterval:inReadInterval
                ,outEmailAddress:outEmailAddress
                ,outCustom:outCustom
                ,outServerName:outServerName
                ,outServerPort:outServerPort
                ,outUseSSL:outUseSSL
                ,outUserName:outUserName
                ,outPassword:outPassword
                ,mailingListActive:mailingListActive
                ,allowAnonymousEmail:allowAnonymousEmail
                ,serviceContext:serviceContext
            }]);
        };
        service.addCategory = function(userId,parentCategoryId,name,description,serviceContext) {
            return SessionService.invoke('/mbcategory/add-category',[{
                userId:userId
                ,parentCategoryId:parentCategoryId
                ,name:name
                ,description:description
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteCategory = function(categoryId,includeTrashedEntries) {
            return SessionService.invoke('/mbcategory/delete-category',[{
                categoryId:categoryId
                ,includeTrashedEntries:includeTrashedEntries
            }]);
        };
        service.deleteCategory = function(groupId,categoryId) {
            return SessionService.invoke('/mbcategory/delete-category',[{
                groupId:groupId
                ,categoryId:categoryId
            }]);
        };
        service.getCategories = function(groupId) {
            return SessionService.invoke('/mbcategory/get-categories',[{
                groupId:groupId
            }]);
        };
        service.getCategories = function(groupId,status) {
            return SessionService.invoke('/mbcategory/get-categories',[{
                groupId:groupId
                ,status:status
            }]);
        };
        service.getCategories = function(groupId,parentCategoryId,start,end) {
            return SessionService.invoke('/mbcategory/get-categories',[{
                groupId:groupId
                ,parentCategoryId:parentCategoryId
                ,start:start
                ,end:end
            }]);
        };
        service.getCategories = function(groupId,parentCategoryIds,start,end) {
            return SessionService.invoke('/mbcategory/get-categories',[{
                groupId:groupId
                ,parentCategoryIds:parentCategoryIds
                ,start:start
                ,end:end
            }]);
        };
        service.getCategories = function(groupId,parentCategoryId,status,start,end) {
            return SessionService.invoke('/mbcategory/get-categories',[{
                groupId:groupId
                ,parentCategoryId:parentCategoryId
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.getCategories = function(groupId,parentCategoryIds,status,start,end) {
            return SessionService.invoke('/mbcategory/get-categories',[{
                groupId:groupId
                ,parentCategoryIds:parentCategoryIds
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.getCategoriesCount = function(groupId,parentCategoryId) {
            return SessionService.invoke('/mbcategory/get-categories-count',[{
                groupId:groupId
                ,parentCategoryId:parentCategoryId
            }]);
        };
        service.getCategoriesCount = function(groupId,parentCategoryIds) {
            return SessionService.invoke('/mbcategory/get-categories-count',[{
                groupId:groupId
                ,parentCategoryIds:parentCategoryIds
            }]);
        };
        service.getCategoriesCount = function(groupId,parentCategoryId,status) {
            return SessionService.invoke('/mbcategory/get-categories-count',[{
                groupId:groupId
                ,parentCategoryId:parentCategoryId
                ,status:status
            }]);
        };
        service.getCategoriesCount = function(groupId,parentCategoryIds,status) {
            return SessionService.invoke('/mbcategory/get-categories-count',[{
                groupId:groupId
                ,parentCategoryIds:parentCategoryIds
                ,status:status
            }]);
        };
        service.getCategory = function(categoryId) {
            return SessionService.invoke('/mbcategory/get-category',[{
                categoryId:categoryId
            }]);
        };
        service.getCategoryIds = function(groupId,categoryId) {
            return SessionService.invoke('/mbcategory/get-category-ids',[{
                groupId:groupId
                ,categoryId:categoryId
            }]);
        };
        service.getSubcategoryIds = function(categoryIds,groupId,categoryId) {
            return SessionService.invoke('/mbcategory/get-subcategory-ids',[{
                categoryIds:categoryIds
                ,groupId:groupId
                ,categoryId:categoryId
            }]);
        };
        service.getSubscribedCategories = function(groupId,userId,start,end) {
            return SessionService.invoke('/mbcategory/get-subscribed-categories',[{
                groupId:groupId
                ,userId:userId
                ,start:start
                ,end:end
            }]);
        };
        service.getSubscribedCategoriesCount = function(groupId,userId) {
            return SessionService.invoke('/mbcategory/get-subscribed-categories-count',[{
                groupId:groupId
                ,userId:userId
            }]);
        };
        service.moveCategory = function(categoryId,parentCategoryId,mergeWithParentCategory) {
            return SessionService.invoke('/mbcategory/move-category',[{
                categoryId:categoryId
                ,parentCategoryId:parentCategoryId
                ,mergeWithParentCategory:mergeWithParentCategory
            }]);
        };
        service.moveCategoryFromTrash = function(categoryId,newCategoryId) {
            return SessionService.invoke('/mbcategory/move-category-from-trash',[{
                categoryId:categoryId
                ,newCategoryId:newCategoryId
            }]);
        };
        service.moveCategoryToTrash = function(categoryId) {
            return SessionService.invoke('/mbcategory/move-category-to-trash',[{
                categoryId:categoryId
            }]);
        };
        service.restoreCategoryFromTrash = function(categoryId) {
            return SessionService.invoke('/mbcategory/restore-category-from-trash',[{
                categoryId:categoryId
            }]);
        };
        service.subscribeCategory = function(groupId,categoryId) {
            return SessionService.invoke('/mbcategory/subscribe-category',[{
                groupId:groupId
                ,categoryId:categoryId
            }]);
        };
        service.unsubscribeCategory = function(groupId,categoryId) {
            return SessionService.invoke('/mbcategory/unsubscribe-category',[{
                groupId:groupId
                ,categoryId:categoryId
            }]);
        };
        service.updateCategory = function(categoryId,parentCategoryId,name,description,displayStyle,emailAddress,inProtocol,inServerName,inServerPort,inUseSSL,inUserName,inPassword,inReadInterval,outEmailAddress,outCustom,outServerName,outServerPort,outUseSSL,outUserName,outPassword,mailingListActive,allowAnonymousEmail,mergeWithParentCategory,serviceContext) {
            return SessionService.invoke('/mbcategory/update-category',[{
                categoryId:categoryId
                ,parentCategoryId:parentCategoryId
                ,name:name
                ,description:description
                ,displayStyle:displayStyle
                ,emailAddress:emailAddress
                ,inProtocol:inProtocol
                ,inServerName:inServerName
                ,inServerPort:inServerPort
                ,inUseSSL:inUseSSL
                ,inUserName:inUserName
                ,inPassword:inPassword
                ,inReadInterval:inReadInterval
                ,outEmailAddress:outEmailAddress
                ,outCustom:outCustom
                ,outServerName:outServerName
                ,outServerPort:outServerPort
                ,outUseSSL:outUseSSL
                ,outUserName:outUserName
                ,outPassword:outPassword
                ,mailingListActive:mailingListActive
                ,allowAnonymousEmail:allowAnonymousEmail
                ,mergeWithParentCategory:mergeWithParentCategory
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('MbmessageService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addDiscussionMessage = function(groupId,className,classPK,permissionClassName,permissionClassPK,permissionOwnerId,threadId,parentMessageId,subject,body,serviceContext) {
            return SessionService.invoke('/mbmessage/add-discussion-message',[{
                groupId:groupId
                ,className:className
                ,classPK:classPK
                ,permissionClassName:permissionClassName
                ,permissionClassPK:permissionClassPK
                ,permissionOwnerId:permissionOwnerId
                ,threadId:threadId
                ,parentMessageId:parentMessageId
                ,subject:subject
                ,body:body
                ,serviceContext:serviceContext
            }]);
        };
        service.addMessage = function(groupId,categoryId,subject,body,format,inputStreamOVPs,anonymous,priority,allowPingbacks,serviceContext) {
            return SessionService.invoke('/mbmessage/add-message',[{
                groupId:groupId
                ,categoryId:categoryId
                ,subject:subject
                ,body:body
                ,format:format
                ,inputStreamOVPs:inputStreamOVPs
                ,anonymous:anonymous
                ,priority:priority
                ,allowPingbacks:allowPingbacks
                ,serviceContext:serviceContext
            }]);
        };
        service.addMessage = function(groupId,categoryId,threadId,parentMessageId,subject,body,format,inputStreamOVPs,anonymous,priority,allowPingbacks,serviceContext) {
            return SessionService.invoke('/mbmessage/add-message',[{
                groupId:groupId
                ,categoryId:categoryId
                ,threadId:threadId
                ,parentMessageId:parentMessageId
                ,subject:subject
                ,body:body
                ,format:format
                ,inputStreamOVPs:inputStreamOVPs
                ,anonymous:anonymous
                ,priority:priority
                ,allowPingbacks:allowPingbacks
                ,serviceContext:serviceContext
            }]);
        };
        service.addMessage = function(categoryId,subject,body,serviceContext) {
            return SessionService.invoke('/mbmessage/add-message',[{
                categoryId:categoryId
                ,subject:subject
                ,body:body
                ,serviceContext:serviceContext
            }]);
        };
        service.addMessage = function(parentMessageId,subject,body,format,inputStreamOVPs,anonymous,priority,allowPingbacks,serviceContext) {
            return SessionService.invoke('/mbmessage/add-message',[{
                parentMessageId:parentMessageId
                ,subject:subject
                ,body:body
                ,format:format
                ,inputStreamOVPs:inputStreamOVPs
                ,anonymous:anonymous
                ,priority:priority
                ,allowPingbacks:allowPingbacks
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteDiscussionMessage = function(groupId,className,classPK,permissionClassName,permissionClassPK,permissionOwnerId,messageId) {
            return SessionService.invoke('/mbmessage/delete-discussion-message',[{
                groupId:groupId
                ,className:className
                ,classPK:classPK
                ,permissionClassName:permissionClassName
                ,permissionClassPK:permissionClassPK
                ,permissionOwnerId:permissionOwnerId
                ,messageId:messageId
            }]);
        };
        service.deleteMessage = function(messageId) {
            return SessionService.invoke('/mbmessage/delete-message',[{
                messageId:messageId
            }]);
        };
        service.deleteMessageAttachments = function(messageId) {
            return SessionService.invoke('/mbmessage/delete-message-attachments',[{
                messageId:messageId
            }]);
        };
        service.getCategoryMessages = function(groupId,categoryId,status,start,end) {
            return SessionService.invoke('/mbmessage/get-category-messages',[{
                groupId:groupId
                ,categoryId:categoryId
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.getCategoryMessagesCount = function(groupId,categoryId,status) {
            return SessionService.invoke('/mbmessage/get-category-messages-count',[{
                groupId:groupId
                ,categoryId:categoryId
                ,status:status
            }]);
        };
        service.getCategoryMessagesRss = function(groupId,categoryId,status,max,type,version,displayStyle,feedURL,entryURL,themeDisplay) {
            return SessionService.invoke('/mbmessage/get-category-messages-rss',[{
                groupId:groupId
                ,categoryId:categoryId
                ,status:status
                ,max:max
                ,type:type
                ,version:version
                ,displayStyle:displayStyle
                ,feedURL:feedURL
                ,entryURL:entryURL
                ,themeDisplay:themeDisplay
            }]);
        };
        service.getCompanyMessagesRss = function(companyId,status,max,type,version,displayStyle,feedURL,entryURL,themeDisplay) {
            return SessionService.invoke('/mbmessage/get-company-messages-rss',[{
                companyId:companyId
                ,status:status
                ,max:max
                ,type:type
                ,version:version
                ,displayStyle:displayStyle
                ,feedURL:feedURL
                ,entryURL:entryURL
                ,themeDisplay:themeDisplay
            }]);
        };
        service.getGroupMessagesCount = function(groupId,status) {
            return SessionService.invoke('/mbmessage/get-group-messages-count',[{
                groupId:groupId
                ,status:status
            }]);
        };
        service.getGroupMessagesRss = function(groupId,userId,status,max,type,version,displayStyle,feedURL,entryURL,themeDisplay) {
            return SessionService.invoke('/mbmessage/get-group-messages-rss',[{
                groupId:groupId
                ,userId:userId
                ,status:status
                ,max:max
                ,type:type
                ,version:version
                ,displayStyle:displayStyle
                ,feedURL:feedURL
                ,entryURL:entryURL
                ,themeDisplay:themeDisplay
            }]);
        };
        service.getGroupMessagesRss = function(groupId,status,max,type,version,displayStyle,feedURL,entryURL,themeDisplay) {
            return SessionService.invoke('/mbmessage/get-group-messages-rss',[{
                groupId:groupId
                ,status:status
                ,max:max
                ,type:type
                ,version:version
                ,displayStyle:displayStyle
                ,feedURL:feedURL
                ,entryURL:entryURL
                ,themeDisplay:themeDisplay
            }]);
        };
        service.getMessage = function(messageId) {
            return SessionService.invoke('/mbmessage/get-message',[{
                messageId:messageId
            }]);
        };
        service.getMessageDisplay = function(messageId,status,threadView,includePrevAndNext) {
            return SessionService.invoke('/mbmessage/get-message-display',[{
                messageId:messageId
                ,status:status
                ,threadView:threadView
                ,includePrevAndNext:includePrevAndNext
            }]);
        };
        service.getThreadAnswersCount = function(groupId,categoryId,threadId) {
            return SessionService.invoke('/mbmessage/get-thread-answers-count',[{
                groupId:groupId
                ,categoryId:categoryId
                ,threadId:threadId
            }]);
        };
        service.getThreadMessages = function(groupId,categoryId,threadId,status,start,end) {
            return SessionService.invoke('/mbmessage/get-thread-messages',[{
                groupId:groupId
                ,categoryId:categoryId
                ,threadId:threadId
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.getThreadMessagesCount = function(groupId,categoryId,threadId,status) {
            return SessionService.invoke('/mbmessage/get-thread-messages-count',[{
                groupId:groupId
                ,categoryId:categoryId
                ,threadId:threadId
                ,status:status
            }]);
        };
        service.getThreadMessagesRss = function(threadId,status,max,type,version,displayStyle,feedURL,entryURL,themeDisplay) {
            return SessionService.invoke('/mbmessage/get-thread-messages-rss',[{
                threadId:threadId
                ,status:status
                ,max:max
                ,type:type
                ,version:version
                ,displayStyle:displayStyle
                ,feedURL:feedURL
                ,entryURL:entryURL
                ,themeDisplay:themeDisplay
            }]);
        };
        service.restoreMessageAttachmentFromTrash = function(messageId,fileName) {
            return SessionService.invoke('/mbmessage/restore-message-attachment-from-trash',[{
                messageId:messageId
                ,fileName:fileName
            }]);
        };
        service.subscribeMessage = function(messageId) {
            return SessionService.invoke('/mbmessage/subscribe-message',[{
                messageId:messageId
            }]);
        };
        service.unsubscribeMessage = function(messageId) {
            return SessionService.invoke('/mbmessage/unsubscribe-message',[{
                messageId:messageId
            }]);
        };
        service.updateAnswer = function(messageId,answer,cascade) {
            return SessionService.invoke('/mbmessage/update-answer',[{
                messageId:messageId
                ,answer:answer
                ,cascade:cascade
            }]);
        };
        service.updateDiscussionMessage = function(className,classPK,permissionClassName,permissionClassPK,permissionOwnerId,messageId,subject,body,serviceContext) {
            return SessionService.invoke('/mbmessage/update-discussion-message',[{
                className:className
                ,classPK:classPK
                ,permissionClassName:permissionClassName
                ,permissionClassPK:permissionClassPK
                ,permissionOwnerId:permissionOwnerId
                ,messageId:messageId
                ,subject:subject
                ,body:body
                ,serviceContext:serviceContext
            }]);
        };
        service.updateMessage = function(messageId,subject,body,inputStreamOVPs,existingFiles,priority,allowPingbacks,serviceContext) {
            return SessionService.invoke('/mbmessage/update-message',[{
                messageId:messageId
                ,subject:subject
                ,body:body
                ,inputStreamOVPs:inputStreamOVPs
                ,existingFiles:existingFiles
                ,priority:priority
                ,allowPingbacks:allowPingbacks
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('MbthreadService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.deleteThread = function(threadId) {
            return SessionService.invoke('/mbthread/delete-thread',[{
                threadId:threadId
            }]);
        };
        service.getGroupThreads = function(groupId,userId,status,start,end) {
            return SessionService.invoke('/mbthread/get-group-threads',[{
                groupId:groupId
                ,userId:userId
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.getGroupThreads = function(groupId,userId,modifiedDate,status,start,end) {
            return SessionService.invoke('/mbthread/get-group-threads',[{
                groupId:groupId
                ,userId:userId
                ,modifiedDate:modifiedDate
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.getGroupThreads = function(groupId,userId,status,subscribed,start,end) {
            return SessionService.invoke('/mbthread/get-group-threads',[{
                groupId:groupId
                ,userId:userId
                ,status:status
                ,subscribed:subscribed
                ,start:start
                ,end:end
            }]);
        };
        service.getGroupThreads = function(groupId,userId,status,subscribed,includeAnonymous,start,end) {
            return SessionService.invoke('/mbthread/get-group-threads',[{
                groupId:groupId
                ,userId:userId
                ,status:status
                ,subscribed:subscribed
                ,includeAnonymous:includeAnonymous
                ,start:start
                ,end:end
            }]);
        };
        service.getGroupThreadsCount = function(groupId,userId,status) {
            return SessionService.invoke('/mbthread/get-group-threads-count',[{
                groupId:groupId
                ,userId:userId
                ,status:status
            }]);
        };
        service.getGroupThreadsCount = function(groupId,userId,modifiedDate,status) {
            return SessionService.invoke('/mbthread/get-group-threads-count',[{
                groupId:groupId
                ,userId:userId
                ,modifiedDate:modifiedDate
                ,status:status
            }]);
        };
        service.getGroupThreadsCount = function(groupId,userId,status,subscribed) {
            return SessionService.invoke('/mbthread/get-group-threads-count',[{
                groupId:groupId
                ,userId:userId
                ,status:status
                ,subscribed:subscribed
            }]);
        };
        service.getGroupThreadsCount = function(groupId,userId,status,subscribed,includeAnonymous) {
            return SessionService.invoke('/mbthread/get-group-threads-count',[{
                groupId:groupId
                ,userId:userId
                ,status:status
                ,subscribed:subscribed
                ,includeAnonymous:includeAnonymous
            }]);
        };
        service.getThreads = function(groupId,categoryId,status,start,end) {
            return SessionService.invoke('/mbthread/get-threads',[{
                groupId:groupId
                ,categoryId:categoryId
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.getThreadsCount = function(groupId,categoryId,status) {
            return SessionService.invoke('/mbthread/get-threads-count',[{
                groupId:groupId
                ,categoryId:categoryId
                ,status:status
            }]);
        };
        service.lockThread = function(threadId) {
            return SessionService.invoke('/mbthread/lock-thread',[{
                threadId:threadId
            }]);
        };
        service.moveThread = function(categoryId,threadId) {
            return SessionService.invoke('/mbthread/move-thread',[{
                categoryId:categoryId
                ,threadId:threadId
            }]);
        };
        service.moveThreadFromTrash = function(categoryId,threadId) {
            return SessionService.invoke('/mbthread/move-thread-from-trash',[{
                categoryId:categoryId
                ,threadId:threadId
            }]);
        };
        service.moveThreadToTrash = function(threadId) {
            return SessionService.invoke('/mbthread/move-thread-to-trash',[{
                threadId:threadId
            }]);
        };
        service.restoreThreadFromTrash = function(threadId) {
            return SessionService.invoke('/mbthread/restore-thread-from-trash',[{
                threadId:threadId
            }]);
        };
        service.search = function(groupId,creatorUserId,status,start,end) {
            return SessionService.invoke('/mbthread/search',[{
                groupId:groupId
                ,creatorUserId:creatorUserId
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.search = function(groupId,creatorUserId,startDate,endDate,status,start,end) {
            return SessionService.invoke('/mbthread/search',[{
                groupId:groupId
                ,creatorUserId:creatorUserId
                ,startDate:startDate
                ,endDate:endDate
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.splitThread = function(messageId,subject,serviceContext) {
            return SessionService.invoke('/mbthread/split-thread',[{
                messageId:messageId
                ,subject:subject
                ,serviceContext:serviceContext
            }]);
        };
        service.unlockThread = function(threadId) {
            return SessionService.invoke('/mbthread/unlock-thread',[{
                threadId:threadId
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('MdractionService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addAction = function(ruleGroupInstanceId,nameMap,descriptionMap,type,typeSettings,serviceContext) {
            return SessionService.invoke('/mdraction/add-action',[{
                ruleGroupInstanceId:ruleGroupInstanceId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,type:type
                ,typeSettings:typeSettings
                ,serviceContext:serviceContext
            }]);
        };
        service.addAction = function(ruleGroupInstanceId,nameMap,descriptionMap,type,typeSettingsProperties,serviceContext) {
            return SessionService.invoke('/mdraction/add-action',[{
                ruleGroupInstanceId:ruleGroupInstanceId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,type:type
                ,typeSettingsProperties:typeSettingsProperties
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteAction = function(actionId) {
            return SessionService.invoke('/mdraction/delete-action',[{
                actionId:actionId
            }]);
        };
        service.fetchAction = function(actionId) {
            return SessionService.invoke('/mdraction/fetch-action',[{
                actionId:actionId
            }]);
        };
        service.getAction = function(actionId) {
            return SessionService.invoke('/mdraction/get-action',[{
                actionId:actionId
            }]);
        };
        service.updateAction = function(actionId,nameMap,descriptionMap,type,typeSettings,serviceContext) {
            return SessionService.invoke('/mdraction/update-action',[{
                actionId:actionId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,type:type
                ,typeSettings:typeSettings
                ,serviceContext:serviceContext
            }]);
        };
        service.updateAction = function(actionId,nameMap,descriptionMap,type,typeSettingsProperties,serviceContext) {
            return SessionService.invoke('/mdraction/update-action',[{
                actionId:actionId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,type:type
                ,typeSettingsProperties:typeSettingsProperties
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('MdrruleService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addRule = function(ruleGroupId,nameMap,descriptionMap,type,typeSettings,serviceContext) {
            return SessionService.invoke('/mdrrule/add-rule',[{
                ruleGroupId:ruleGroupId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,type:type
                ,typeSettings:typeSettings
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteRule = function(ruleId) {
            return SessionService.invoke('/mdrrule/delete-rule',[{
                ruleId:ruleId
            }]);
        };
        service.fetchRule = function(ruleId) {
            return SessionService.invoke('/mdrrule/fetch-rule',[{
                ruleId:ruleId
            }]);
        };
        service.getRule = function(ruleId) {
            return SessionService.invoke('/mdrrule/get-rule',[{
                ruleId:ruleId
            }]);
        };
        service.updateRule = function(ruleId,nameMap,descriptionMap,type,typeSettings,serviceContext) {
            return SessionService.invoke('/mdrrule/update-rule',[{
                ruleId:ruleId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,type:type
                ,typeSettings:typeSettings
                ,serviceContext:serviceContext
            }]);
        };
        service.updateRule = function(ruleId,nameMap,descriptionMap,type,typeSettingsProperties,serviceContext) {
            return SessionService.invoke('/mdrrule/update-rule',[{
                ruleId:ruleId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,type:type
                ,typeSettingsProperties:typeSettingsProperties
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('MdrrulegroupService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addRuleGroup = function(groupId,nameMap,descriptionMap,serviceContext) {
            return SessionService.invoke('/mdrrulegroup/add-rule-group',[{
                groupId:groupId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,serviceContext:serviceContext
            }]);
        };
        service.copyRuleGroup = function(ruleGroupId,groupId,serviceContext) {
            return SessionService.invoke('/mdrrulegroup/copy-rule-group',[{
                ruleGroupId:ruleGroupId
                ,groupId:groupId
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteRuleGroup = function(ruleGroupId) {
            return SessionService.invoke('/mdrrulegroup/delete-rule-group',[{
                ruleGroupId:ruleGroupId
            }]);
        };
        service.fetchRuleGroup = function(ruleGroupId) {
            return SessionService.invoke('/mdrrulegroup/fetch-rule-group',[{
                ruleGroupId:ruleGroupId
            }]);
        };
        service.getRuleGroup = function(ruleGroupId) {
            return SessionService.invoke('/mdrrulegroup/get-rule-group',[{
                ruleGroupId:ruleGroupId
            }]);
        };
        service.updateRuleGroup = function(ruleGroupId,nameMap,descriptionMap,serviceContext) {
            return SessionService.invoke('/mdrrulegroup/update-rule-group',[{
                ruleGroupId:ruleGroupId
                ,nameMap:nameMap
                ,descriptionMap:descriptionMap
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('MdrrulegroupinstanceService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addRuleGroupInstance = function(groupId,className,classPK,ruleGroupId,serviceContext) {
            return SessionService.invoke('/mdrrulegroupinstance/add-rule-group-instance',[{
                groupId:groupId
                ,className:className
                ,classPK:classPK
                ,ruleGroupId:ruleGroupId
                ,serviceContext:serviceContext
            }]);
        };
        service.addRuleGroupInstance = function(groupId,className,classPK,ruleGroupId,priority,serviceContext) {
            return SessionService.invoke('/mdrrulegroupinstance/add-rule-group-instance',[{
                groupId:groupId
                ,className:className
                ,classPK:classPK
                ,ruleGroupId:ruleGroupId
                ,priority:priority
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteRuleGroupInstance = function(ruleGroupInstanceId) {
            return SessionService.invoke('/mdrrulegroupinstance/delete-rule-group-instance',[{
                ruleGroupInstanceId:ruleGroupInstanceId
            }]);
        };
        service.getRuleGroupInstances = function(className,classPK,start,end,orderByComparator) {
            return SessionService.invoke('/mdrrulegroupinstance/get-rule-group-instances',[{
                className:className
                ,classPK:classPK
                ,start:start
                ,end:end
                ,orderByComparator:orderByComparator
            }]);
        };
        service.getRuleGroupInstancesCount = function(className,classPK) {
            return SessionService.invoke('/mdrrulegroupinstance/get-rule-group-instances-count',[{
                className:className
                ,classPK:classPK
            }]);
        };
        service.updateRuleGroupInstance = function(ruleGroupInstanceId,priority) {
            return SessionService.invoke('/mdrrulegroupinstance/update-rule-group-instance',[{
                ruleGroupInstanceId:ruleGroupInstanceId
                ,priority:priority
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('MembershiprequestService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addMembershipRequest = function(groupId,comments,serviceContext) {
            return SessionService.invoke('/membershiprequest/add-membership-request',[{
                groupId:groupId
                ,comments:comments
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteMembershipRequests = function(groupId,statusId) {
            return SessionService.invoke('/membershiprequest/delete-membership-requests',[{
                groupId:groupId
                ,statusId:statusId
            }]);
        };
        service.getMembershipRequest = function(membershipRequestId) {
            return SessionService.invoke('/membershiprequest/get-membership-request',[{
                membershipRequestId:membershipRequestId
            }]);
        };
        service.updateStatus = function(membershipRequestId,reviewComments,statusId,serviceContext) {
            return SessionService.invoke('/membershiprequest/update-status',[{
                membershipRequestId:membershipRequestId
                ,reviewComments:reviewComments
                ,statusId:statusId
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('OrganizationService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addGroupOrganizations = function(groupId,organizationIds) {
            return SessionService.invoke('/organization/add-group-organizations',[{
                groupId:groupId
                ,organizationIds:organizationIds
            }]);
        };
        service.addOrganization = function(parentOrganizationId,name,type,recursable,regionId,countryId,statusId,comments,site,serviceContext) {
            return SessionService.invoke('/organization/add-organization',[{
                parentOrganizationId:parentOrganizationId
                ,name:name
                ,type:type
                ,recursable:recursable
                ,regionId:regionId
                ,countryId:countryId
                ,statusId:statusId
                ,comments:comments
                ,site:site
                ,serviceContext:serviceContext
            }]);
        };
        service.addOrganization = function(parentOrganizationId,name,type,regionId,countryId,statusId,comments,site,addresses,emailAddresses,orgLabors,phones,websites,serviceContext) {
            return SessionService.invoke('/organization/add-organization',[{
                parentOrganizationId:parentOrganizationId
                ,name:name
                ,type:type
                ,regionId:regionId
                ,countryId:countryId
                ,statusId:statusId
                ,comments:comments
                ,site:site
                ,addresses:addresses
                ,emailAddresses:emailAddresses
                ,orgLabors:orgLabors
                ,phones:phones
                ,websites:websites
                ,serviceContext:serviceContext
            }]);
        };
        service.addOrganization = function(parentOrganizationId,name,type,recursable,regionId,countryId,statusId,comments,site,addresses,emailAddresses,orgLabors,phones,websites,serviceContext) {
            return SessionService.invoke('/organization/add-organization',[{
                parentOrganizationId:parentOrganizationId
                ,name:name
                ,type:type
                ,recursable:recursable
                ,regionId:regionId
                ,countryId:countryId
                ,statusId:statusId
                ,comments:comments
                ,site:site
                ,addresses:addresses
                ,emailAddresses:emailAddresses
                ,orgLabors:orgLabors
                ,phones:phones
                ,websites:websites
                ,serviceContext:serviceContext
            }]);
        };
        service.addOrganization = function(parentOrganizationId,name,type,regionId,countryId,statusId,comments,site,serviceContext) {
            return SessionService.invoke('/organization/add-organization',[{
                parentOrganizationId:parentOrganizationId
                ,name:name
                ,type:type
                ,regionId:regionId
                ,countryId:countryId
                ,statusId:statusId
                ,comments:comments
                ,site:site
                ,serviceContext:serviceContext
            }]);
        };
        service.addPasswordPolicyOrganizations = function(passwordPolicyId,organizationIds) {
            return SessionService.invoke('/organization/add-password-policy-organizations',[{
                passwordPolicyId:passwordPolicyId
                ,organizationIds:organizationIds
            }]);
        };
        service.deleteLogo = function(organizationId) {
            return SessionService.invoke('/organization/delete-logo',[{
                organizationId:organizationId
            }]);
        };
        service.deleteOrganization = function(organizationId) {
            return SessionService.invoke('/organization/delete-organization',[{
                organizationId:organizationId
            }]);
        };
        service.getManageableOrganizations = function(actionId,max) {
            return SessionService.invoke('/organization/get-manageable-organizations',[{
                actionId:actionId
                ,max:max
            }]);
        };
        service.getOrganization = function(organizationId) {
            return SessionService.invoke('/organization/get-organization',[{
                organizationId:organizationId
            }]);
        };
        service.getOrganizationId = function(companyId,name) {
            return SessionService.invoke('/organization/get-organization-id',[{
                companyId:companyId
                ,name:name
            }]);
        };
        service.getOrganizations = function(companyId,parentOrganizationId) {
            return SessionService.invoke('/organization/get-organizations',[{
                companyId:companyId
                ,parentOrganizationId:parentOrganizationId
            }]);
        };
        service.getOrganizations = function(companyId,parentOrganizationId,start,end) {
            return SessionService.invoke('/organization/get-organizations',[{
                companyId:companyId
                ,parentOrganizationId:parentOrganizationId
                ,start:start
                ,end:end
            }]);
        };
        service.getOrganizationsCount = function(companyId,parentOrganizationId) {
            return SessionService.invoke('/organization/get-organizations-count',[{
                companyId:companyId
                ,parentOrganizationId:parentOrganizationId
            }]);
        };
        service.getUserOrganizations = function(userId) {
            return SessionService.invoke('/organization/get-user-organizations',[{
                userId:userId
            }]);
        };
        service.setGroupOrganizations = function(groupId,organizationIds) {
            return SessionService.invoke('/organization/set-group-organizations',[{
                groupId:groupId
                ,organizationIds:organizationIds
            }]);
        };
        service.unsetGroupOrganizations = function(groupId,organizationIds) {
            return SessionService.invoke('/organization/unset-group-organizations',[{
                groupId:groupId
                ,organizationIds:organizationIds
            }]);
        };
        service.unsetPasswordPolicyOrganizations = function(passwordPolicyId,organizationIds) {
            return SessionService.invoke('/organization/unset-password-policy-organizations',[{
                passwordPolicyId:passwordPolicyId
                ,organizationIds:organizationIds
            }]);
        };
        service.updateOrganization = function(organizationId,parentOrganizationId,name,type,regionId,countryId,statusId,comments,site,serviceContext) {
            return SessionService.invoke('/organization/update-organization',[{
                organizationId:organizationId
                ,parentOrganizationId:parentOrganizationId
                ,name:name
                ,type:type
                ,regionId:regionId
                ,countryId:countryId
                ,statusId:statusId
                ,comments:comments
                ,site:site
                ,serviceContext:serviceContext
            }]);
        };
        service.updateOrganization = function(organizationId,parentOrganizationId,name,type,recursable,regionId,countryId,statusId,comments,site,serviceContext) {
            return SessionService.invoke('/organization/update-organization',[{
                organizationId:organizationId
                ,parentOrganizationId:parentOrganizationId
                ,name:name
                ,type:type
                ,recursable:recursable
                ,regionId:regionId
                ,countryId:countryId
                ,statusId:statusId
                ,comments:comments
                ,site:site
                ,serviceContext:serviceContext
            }]);
        };
        service.updateOrganization = function(organizationId,parentOrganizationId,name,type,regionId,countryId,statusId,comments,site,addresses,emailAddresses,orgLabors,phones,websites,serviceContext) {
            return SessionService.invoke('/organization/update-organization',[{
                organizationId:organizationId
                ,parentOrganizationId:parentOrganizationId
                ,name:name
                ,type:type
                ,regionId:regionId
                ,countryId:countryId
                ,statusId:statusId
                ,comments:comments
                ,site:site
                ,addresses:addresses
                ,emailAddresses:emailAddresses
                ,orgLabors:orgLabors
                ,phones:phones
                ,websites:websites
                ,serviceContext:serviceContext
            }]);
        };
        service.updateOrganization = function(organizationId,parentOrganizationId,name,type,recursable,regionId,countryId,statusId,comments,site,addresses,emailAddresses,orgLabors,phones,websites,serviceContext) {
            return SessionService.invoke('/organization/update-organization',[{
                organizationId:organizationId
                ,parentOrganizationId:parentOrganizationId
                ,name:name
                ,type:type
                ,recursable:recursable
                ,regionId:regionId
                ,countryId:countryId
                ,statusId:statusId
                ,comments:comments
                ,site:site
                ,addresses:addresses
                ,emailAddresses:emailAddresses
                ,orgLabors:orgLabors
                ,phones:phones
                ,websites:websites
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('OrglaborService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addOrgLabor = function(organizationId,typeId,sunOpen,sunClose,monOpen,monClose,tueOpen,tueClose,wedOpen,wedClose,thuOpen,thuClose,friOpen,friClose,satOpen,satClose) {
            return SessionService.invoke('/orglabor/add-org-labor',[{
                organizationId:organizationId
                ,typeId:typeId
                ,sunOpen:sunOpen
                ,sunClose:sunClose
                ,monOpen:monOpen
                ,monClose:monClose
                ,tueOpen:tueOpen
                ,tueClose:tueClose
                ,wedOpen:wedOpen
                ,wedClose:wedClose
                ,thuOpen:thuOpen
                ,thuClose:thuClose
                ,friOpen:friOpen
                ,friClose:friClose
                ,satOpen:satOpen
                ,satClose:satClose
            }]);
        };
        service.deleteOrgLabor = function(orgLaborId) {
            return SessionService.invoke('/orglabor/delete-org-labor',[{
                orgLaborId:orgLaborId
            }]);
        };
        service.getOrgLabor = function(orgLaborId) {
            return SessionService.invoke('/orglabor/get-org-labor',[{
                orgLaborId:orgLaborId
            }]);
        };
        service.getOrgLabors = function(organizationId) {
            return SessionService.invoke('/orglabor/get-org-labors',[{
                organizationId:organizationId
            }]);
        };
        service.updateOrgLabor = function(orgLaborId,typeId,sunOpen,sunClose,monOpen,monClose,tueOpen,tueClose,wedOpen,wedClose,thuOpen,thuClose,friOpen,friClose,satOpen,satClose) {
            return SessionService.invoke('/orglabor/update-org-labor',[{
                orgLaborId:orgLaborId
                ,typeId:typeId
                ,sunOpen:sunOpen
                ,sunClose:sunClose
                ,monOpen:monOpen
                ,monClose:monClose
                ,tueOpen:tueOpen
                ,tueClose:tueClose
                ,wedOpen:wedOpen
                ,wedClose:wedClose
                ,thuOpen:thuOpen
                ,thuClose:thuClose
                ,friOpen:friOpen
                ,friClose:friClose
                ,satOpen:satOpen
                ,satClose:satClose
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('PasswordpolicyService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addPasswordPolicy = function(name,description,changeable,changeRequired,minAge,checkSyntax,allowDictionaryWords,minAlphanumeric,minLength,minLowerCase,minNumbers,minSymbols,minUpperCase,history,historyCount,expireable,maxAge,warningTime,graceLimit,lockout,maxFailure,lockoutDuration,resetFailureCount,resetTicketMaxAge) {
            return SessionService.invoke('/passwordpolicy/add-password-policy',[{
                name:name
                ,description:description
                ,changeable:changeable
                ,changeRequired:changeRequired
                ,minAge:minAge
                ,checkSyntax:checkSyntax
                ,allowDictionaryWords:allowDictionaryWords
                ,minAlphanumeric:minAlphanumeric
                ,minLength:minLength
                ,minLowerCase:minLowerCase
                ,minNumbers:minNumbers
                ,minSymbols:minSymbols
                ,minUpperCase:minUpperCase
                ,history:history
                ,historyCount:historyCount
                ,expireable:expireable
                ,maxAge:maxAge
                ,warningTime:warningTime
                ,graceLimit:graceLimit
                ,lockout:lockout
                ,maxFailure:maxFailure
                ,lockoutDuration:lockoutDuration
                ,resetFailureCount:resetFailureCount
                ,resetTicketMaxAge:resetTicketMaxAge
            }]);
        };
        service.addPasswordPolicy = function(name,description,changeable,changeRequired,minAge,checkSyntax,allowDictionaryWords,minAlphanumeric,minLength,minLowerCase,minNumbers,minSymbols,minUpperCase,regex,history,historyCount,expireable,maxAge,warningTime,graceLimit,lockout,maxFailure,lockoutDuration,resetFailureCount,resetTicketMaxAge,serviceContext) {
            return SessionService.invoke('/passwordpolicy/add-password-policy',[{
                name:name
                ,description:description
                ,changeable:changeable
                ,changeRequired:changeRequired
                ,minAge:minAge
                ,checkSyntax:checkSyntax
                ,allowDictionaryWords:allowDictionaryWords
                ,minAlphanumeric:minAlphanumeric
                ,minLength:minLength
                ,minLowerCase:minLowerCase
                ,minNumbers:minNumbers
                ,minSymbols:minSymbols
                ,minUpperCase:minUpperCase
                ,regex:regex
                ,history:history
                ,historyCount:historyCount
                ,expireable:expireable
                ,maxAge:maxAge
                ,warningTime:warningTime
                ,graceLimit:graceLimit
                ,lockout:lockout
                ,maxFailure:maxFailure
                ,lockoutDuration:lockoutDuration
                ,resetFailureCount:resetFailureCount
                ,resetTicketMaxAge:resetTicketMaxAge
                ,serviceContext:serviceContext
            }]);
        };
        service.deletePasswordPolicy = function(passwordPolicyId) {
            return SessionService.invoke('/passwordpolicy/delete-password-policy',[{
                passwordPolicyId:passwordPolicyId
            }]);
        };
        service.updatePasswordPolicy = function(passwordPolicyId,name,description,changeable,changeRequired,minAge,checkSyntax,allowDictionaryWords,minAlphanumeric,minLength,minLowerCase,minNumbers,minSymbols,minUpperCase,history,historyCount,expireable,maxAge,warningTime,graceLimit,lockout,maxFailure,lockoutDuration,resetFailureCount,resetTicketMaxAge) {
            return SessionService.invoke('/passwordpolicy/update-password-policy',[{
                passwordPolicyId:passwordPolicyId
                ,name:name
                ,description:description
                ,changeable:changeable
                ,changeRequired:changeRequired
                ,minAge:minAge
                ,checkSyntax:checkSyntax
                ,allowDictionaryWords:allowDictionaryWords
                ,minAlphanumeric:minAlphanumeric
                ,minLength:minLength
                ,minLowerCase:minLowerCase
                ,minNumbers:minNumbers
                ,minSymbols:minSymbols
                ,minUpperCase:minUpperCase
                ,history:history
                ,historyCount:historyCount
                ,expireable:expireable
                ,maxAge:maxAge
                ,warningTime:warningTime
                ,graceLimit:graceLimit
                ,lockout:lockout
                ,maxFailure:maxFailure
                ,lockoutDuration:lockoutDuration
                ,resetFailureCount:resetFailureCount
                ,resetTicketMaxAge:resetTicketMaxAge
            }]);
        };
        service.updatePasswordPolicy = function(passwordPolicyId,name,description,changeable,changeRequired,minAge,checkSyntax,allowDictionaryWords,minAlphanumeric,minLength,minLowerCase,minNumbers,minSymbols,minUpperCase,regex,history,historyCount,expireable,maxAge,warningTime,graceLimit,lockout,maxFailure,lockoutDuration,resetFailureCount,resetTicketMaxAge,serviceContext) {
            return SessionService.invoke('/passwordpolicy/update-password-policy',[{
                passwordPolicyId:passwordPolicyId
                ,name:name
                ,description:description
                ,changeable:changeable
                ,changeRequired:changeRequired
                ,minAge:minAge
                ,checkSyntax:checkSyntax
                ,allowDictionaryWords:allowDictionaryWords
                ,minAlphanumeric:minAlphanumeric
                ,minLength:minLength
                ,minLowerCase:minLowerCase
                ,minNumbers:minNumbers
                ,minSymbols:minSymbols
                ,minUpperCase:minUpperCase
                ,regex:regex
                ,history:history
                ,historyCount:historyCount
                ,expireable:expireable
                ,maxAge:maxAge
                ,warningTime:warningTime
                ,graceLimit:graceLimit
                ,lockout:lockout
                ,maxFailure:maxFailure
                ,lockoutDuration:lockoutDuration
                ,resetFailureCount:resetFailureCount
                ,resetTicketMaxAge:resetTicketMaxAge
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('PermissionService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.checkPermission = function(groupId,name,primKey) {
            return SessionService.invoke('/permission/check-permission',[{
                groupId:groupId
                ,name:name
                ,primKey:primKey
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('PhoneService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addPhone = function(className,classPK,number,extension,typeId,primary) {
            return SessionService.invoke('/phone/add-phone',[{
                className:className
                ,classPK:classPK
                ,number:number
                ,extension:extension
                ,typeId:typeId
                ,primary:primary
            }]);
        };
        service.addPhone = function(className,classPK,number,extension,typeId,primary,serviceContext) {
            return SessionService.invoke('/phone/add-phone',[{
                className:className
                ,classPK:classPK
                ,number:number
                ,extension:extension
                ,typeId:typeId
                ,primary:primary
                ,serviceContext:serviceContext
            }]);
        };
        service.deletePhone = function(phoneId) {
            return SessionService.invoke('/phone/delete-phone',[{
                phoneId:phoneId
            }]);
        };
        service.getPhone = function(phoneId) {
            return SessionService.invoke('/phone/get-phone',[{
                phoneId:phoneId
            }]);
        };
        service.getPhones = function(className,classPK) {
            return SessionService.invoke('/phone/get-phones',[{
                className:className
                ,classPK:classPK
            }]);
        };
        service.updatePhone = function(phoneId,number,extension,typeId,primary) {
            return SessionService.invoke('/phone/update-phone',[{
                phoneId:phoneId
                ,number:number
                ,extension:extension
                ,typeId:typeId
                ,primary:primary
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('PluginsettingService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.updatePluginSetting = function(companyId,pluginId,pluginType,roles,active) {
            return SessionService.invoke('/pluginsetting/update-plugin-setting',[{
                companyId:companyId
                ,pluginId:pluginId
                ,pluginType:pluginType
                ,roles:roles
                ,active:active
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('PollsquestionService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addQuestion = function(titleMap,descriptionMap,expirationDateMonth,expirationDateDay,expirationDateYear,expirationDateHour,expirationDateMinute,neverExpire,choices,serviceContext) {
            return SessionService.invoke('/pollsquestion/add-question',[{
                titleMap:titleMap
                ,descriptionMap:descriptionMap
                ,expirationDateMonth:expirationDateMonth
                ,expirationDateDay:expirationDateDay
                ,expirationDateYear:expirationDateYear
                ,expirationDateHour:expirationDateHour
                ,expirationDateMinute:expirationDateMinute
                ,neverExpire:neverExpire
                ,choices:choices
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteQuestion = function(questionId) {
            return SessionService.invoke('/pollsquestion/delete-question',[{
                questionId:questionId
            }]);
        };
        service.getQuestion = function(questionId) {
            return SessionService.invoke('/pollsquestion/get-question',[{
                questionId:questionId
            }]);
        };
        service.updateQuestion = function(questionId,titleMap,descriptionMap,expirationDateMonth,expirationDateDay,expirationDateYear,expirationDateHour,expirationDateMinute,neverExpire,choices,serviceContext) {
            return SessionService.invoke('/pollsquestion/update-question',[{
                questionId:questionId
                ,titleMap:titleMap
                ,descriptionMap:descriptionMap
                ,expirationDateMonth:expirationDateMonth
                ,expirationDateDay:expirationDateDay
                ,expirationDateYear:expirationDateYear
                ,expirationDateHour:expirationDateHour
                ,expirationDateMinute:expirationDateMinute
                ,neverExpire:neverExpire
                ,choices:choices
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('PollsvoteService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addVote = function(questionId,choiceId,serviceContext) {
            return SessionService.invoke('/pollsvote/add-vote',[{
                questionId:questionId
                ,choiceId:choiceId
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('PortalService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.getAutoDeployDirectory = function() {
            return SessionService.invoke('/portal/get-auto-deploy-directory',[{
                
            }]);
        };
        service.getBuildNumber = function() {
            return SessionService.invoke('/portal/get-build-number',[{
                
            }]);
        };
        service.testAddClassNameAndTestTransactionPortletBar_PortalRollback = function(transactionPortletBarText) {
            return SessionService.invoke('/portal/test-add-class-name-and-test-transaction-portlet-bar_-portal-rollback',[{
                transactionPortletBarText:transactionPortletBarText
            }]);
        };
        service.testAddClassNameAndTestTransactionPortletBar_PortletRollback = function(transactionPortletBarText) {
            return SessionService.invoke('/portal/test-add-class-name-and-test-transaction-portlet-bar_-portlet-rollback',[{
                transactionPortletBarText:transactionPortletBarText
            }]);
        };
        service.testAddClassNameAndTestTransactionPortletBar_Success = function(transactionPortletBarText) {
            return SessionService.invoke('/portal/test-add-class-name-and-test-transaction-portlet-bar_-success',[{
                transactionPortletBarText:transactionPortletBarText
            }]);
        };
        service.testAddClassName_Rollback = function(classNameValue) {
            return SessionService.invoke('/portal/test-add-class-name_-rollback',[{
                classNameValue:classNameValue
            }]);
        };
        service.testAddClassName_Success = function(classNameValue) {
            return SessionService.invoke('/portal/test-add-class-name_-success',[{
                classNameValue:classNameValue
            }]);
        };
        service.testAutoSyncHibernateSessionStateOnTxCreation = function() {
            return SessionService.invoke('/portal/test-auto-sync-hibernate-session-state-on-tx-creation',[{
                
            }]);
        };
        service.testDeleteClassName = function() {
            return SessionService.invoke('/portal/test-delete-class-name',[{
                
            }]);
        };
        service.testGetBuildNumber = function() {
            return SessionService.invoke('/portal/test-get-build-number',[{
                
            }]);
        };
        service.testGetUserId = function() {
            return SessionService.invoke('/portal/test-get-user-id',[{
                
            }]);
        };
        service.testHasClassName = function() {
            return SessionService.invoke('/portal/test-has-class-name',[{
                
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('PortletService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.getWarPortlets = function() {
            return SessionService.invoke('/portlet/get-war-portlets',[{
                
            }]);
        };
        service.updatePortlet = function(companyId,portletId,roles,active) {
            return SessionService.invoke('/portlet/update-portlet',[{
                companyId:companyId
                ,portletId:portletId
                ,roles:roles
                ,active:active
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('PortletpreferencesService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.deleteArchivedPreferences = function(portletItemId) {
            return SessionService.invoke('/portletpreferences/delete-archived-preferences',[{
                portletItemId:portletItemId
            }]);
        };
        service.restoreArchivedPreferences = function(groupId,layout,portletId,portletItem,preferences) {
            return SessionService.invoke('/portletpreferences/restore-archived-preferences',[{
                groupId:groupId
                ,layout:layout
                ,portletId:portletId
                ,portletItem:portletItem
                ,preferences:preferences
            }]);
        };
        service.restoreArchivedPreferences = function(groupId,layout,portletId,portletItemId,preferences) {
            return SessionService.invoke('/portletpreferences/restore-archived-preferences',[{
                groupId:groupId
                ,layout:layout
                ,portletId:portletId
                ,portletItemId:portletItemId
                ,preferences:preferences
            }]);
        };
        service.restoreArchivedPreferences = function(groupId,name,layout,portletId,preferences) {
            return SessionService.invoke('/portletpreferences/restore-archived-preferences',[{
                groupId:groupId
                ,name:name
                ,layout:layout
                ,portletId:portletId
                ,preferences:preferences
            }]);
        };
        service.updateArchivePreferences = function(userId,groupId,name,portletId,preferences) {
            return SessionService.invoke('/portletpreferences/update-archive-preferences',[{
                userId:userId
                ,groupId:groupId
                ,name:name
                ,portletId:portletId
                ,preferences:preferences
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('RatingsentryService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.deleteEntry = function(className,classPK) {
            return SessionService.invoke('/ratingsentry/delete-entry',[{
                className:className
                ,classPK:classPK
            }]);
        };
        service.updateEntry = function(className,classPK,score) {
            return SessionService.invoke('/ratingsentry/update-entry',[{
                className:className
                ,classPK:classPK
                ,score:score
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('RegionService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addRegion = function(countryId,regionCode,name,active) {
            return SessionService.invoke('/region/add-region',[{
                countryId:countryId
                ,regionCode:regionCode
                ,name:name
                ,active:active
            }]);
        };
        service.fetchRegion = function(countryId,regionCode) {
            return SessionService.invoke('/region/fetch-region',[{
                countryId:countryId
                ,regionCode:regionCode
            }]);
        };
        service.getRegion = function(regionId) {
            return SessionService.invoke('/region/get-region',[{
                regionId:regionId
            }]);
        };
        service.getRegion = function(countryId,regionCode) {
            return SessionService.invoke('/region/get-region',[{
                countryId:countryId
                ,regionCode:regionCode
            }]);
        };
        service.getRegions = function() {
            return SessionService.invoke('/region/get-regions',[{
                
            }]);
        };
        service.getRegions = function(active) {
            return SessionService.invoke('/region/get-regions',[{
                active:active
            }]);
        };
        service.getRegions = function(countryId) {
            return SessionService.invoke('/region/get-regions',[{
                countryId:countryId
            }]);
        };
        service.getRegions = function(countryId,active) {
            return SessionService.invoke('/region/get-regions',[{
                countryId:countryId
                ,active:active
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('RepositoryService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addRepository = function(groupId,classNameId,parentFolderId,name,description,portletId,typeSettingsProperties,serviceContext) {
            return SessionService.invoke('/repository/add-repository',[{
                groupId:groupId
                ,classNameId:classNameId
                ,parentFolderId:parentFolderId
                ,name:name
                ,description:description
                ,portletId:portletId
                ,typeSettingsProperties:typeSettingsProperties
                ,serviceContext:serviceContext
            }]);
        };
        service.checkRepository = function(repositoryId) {
            return SessionService.invoke('/repository/check-repository',[{
                repositoryId:repositoryId
            }]);
        };
        service.deleteRepository = function(repositoryId) {
            return SessionService.invoke('/repository/delete-repository',[{
                repositoryId:repositoryId
            }]);
        };
        service.getLocalRepositoryImpl = function(repositoryId) {
            return SessionService.invoke('/repository/get-local-repository-impl',[{
                repositoryId:repositoryId
            }]);
        };
        service.getLocalRepositoryImpl = function(folderId,fileEntryId,fileVersionId) {
            return SessionService.invoke('/repository/get-local-repository-impl',[{
                folderId:folderId
                ,fileEntryId:fileEntryId
                ,fileVersionId:fileVersionId
            }]);
        };
        service.getRepository = function(repositoryId) {
            return SessionService.invoke('/repository/get-repository',[{
                repositoryId:repositoryId
            }]);
        };
        service.getRepositoryImpl = function(repositoryId) {
            return SessionService.invoke('/repository/get-repository-impl',[{
                repositoryId:repositoryId
            }]);
        };
        service.getRepositoryImpl = function(folderId,fileEntryId,fileVersionId) {
            return SessionService.invoke('/repository/get-repository-impl',[{
                folderId:folderId
                ,fileEntryId:fileEntryId
                ,fileVersionId:fileVersionId
            }]);
        };
        service.getSupportedConfigurations = function(classNameId) {
            return SessionService.invoke('/repository/get-supported-configurations',[{
                classNameId:classNameId
            }]);
        };
        service.getSupportedParameters = function(classNameId,configuration) {
            return SessionService.invoke('/repository/get-supported-parameters',[{
                classNameId:classNameId
                ,configuration:configuration
            }]);
        };
        service.getTypeSettingsProperties = function(repositoryId) {
            return SessionService.invoke('/repository/get-type-settings-properties',[{
                repositoryId:repositoryId
            }]);
        };
        service.updateRepository = function(repositoryId,name,description) {
            return SessionService.invoke('/repository/update-repository',[{
                repositoryId:repositoryId
                ,name:name
                ,description:description
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('ResourceblockService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addCompanyScopePermission = function(scopeGroupId,companyId,name,roleId,actionId) {
            return SessionService.invoke('/resourceblock/add-company-scope-permission',[{
                scopeGroupId:scopeGroupId
                ,companyId:companyId
                ,name:name
                ,roleId:roleId
                ,actionId:actionId
            }]);
        };
        service.addGroupScopePermission = function(scopeGroupId,companyId,groupId,name,roleId,actionId) {
            return SessionService.invoke('/resourceblock/add-group-scope-permission',[{
                scopeGroupId:scopeGroupId
                ,companyId:companyId
                ,groupId:groupId
                ,name:name
                ,roleId:roleId
                ,actionId:actionId
            }]);
        };
        service.addIndividualScopePermission = function(companyId,groupId,name,primKey,roleId,actionId) {
            return SessionService.invoke('/resourceblock/add-individual-scope-permission',[{
                companyId:companyId
                ,groupId:groupId
                ,name:name
                ,primKey:primKey
                ,roleId:roleId
                ,actionId:actionId
            }]);
        };
        service.removeAllGroupScopePermissions = function(scopeGroupId,companyId,name,roleId,actionId) {
            return SessionService.invoke('/resourceblock/remove-all-group-scope-permissions',[{
                scopeGroupId:scopeGroupId
                ,companyId:companyId
                ,name:name
                ,roleId:roleId
                ,actionId:actionId
            }]);
        };
        service.removeCompanyScopePermission = function(scopeGroupId,companyId,name,roleId,actionId) {
            return SessionService.invoke('/resourceblock/remove-company-scope-permission',[{
                scopeGroupId:scopeGroupId
                ,companyId:companyId
                ,name:name
                ,roleId:roleId
                ,actionId:actionId
            }]);
        };
        service.removeGroupScopePermission = function(scopeGroupId,companyId,groupId,name,roleId,actionId) {
            return SessionService.invoke('/resourceblock/remove-group-scope-permission',[{
                scopeGroupId:scopeGroupId
                ,companyId:companyId
                ,groupId:groupId
                ,name:name
                ,roleId:roleId
                ,actionId:actionId
            }]);
        };
        service.removeIndividualScopePermission = function(companyId,groupId,name,primKey,roleId,actionId) {
            return SessionService.invoke('/resourceblock/remove-individual-scope-permission',[{
                companyId:companyId
                ,groupId:groupId
                ,name:name
                ,primKey:primKey
                ,roleId:roleId
                ,actionId:actionId
            }]);
        };
        service.setCompanyScopePermissions = function(scopeGroupId,companyId,name,roleId,actionIds) {
            return SessionService.invoke('/resourceblock/set-company-scope-permissions',[{
                scopeGroupId:scopeGroupId
                ,companyId:companyId
                ,name:name
                ,roleId:roleId
                ,actionIds:actionIds
            }]);
        };
        service.setGroupScopePermissions = function(scopeGroupId,companyId,groupId,name,roleId,actionIds) {
            return SessionService.invoke('/resourceblock/set-group-scope-permissions',[{
                scopeGroupId:scopeGroupId
                ,companyId:companyId
                ,groupId:groupId
                ,name:name
                ,roleId:roleId
                ,actionIds:actionIds
            }]);
        };
        service.setIndividualScopePermissions = function(companyId,groupId,name,primKey,roleIdsToActionIds) {
            return SessionService.invoke('/resourceblock/set-individual-scope-permissions',[{
                companyId:companyId
                ,groupId:groupId
                ,name:name
                ,primKey:primKey
                ,roleIdsToActionIds:roleIdsToActionIds
            }]);
        };
        service.setIndividualScopePermissions = function(companyId,groupId,name,primKey,roleId,actionIds) {
            return SessionService.invoke('/resourceblock/set-individual-scope-permissions',[{
                companyId:companyId
                ,groupId:groupId
                ,name:name
                ,primKey:primKey
                ,roleId:roleId
                ,actionIds:actionIds
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('ResourcepermissionService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addResourcePermission = function(groupId,companyId,name,scope,primKey,roleId,actionId) {
            return SessionService.invoke('/resourcepermission/add-resource-permission',[{
                groupId:groupId
                ,companyId:companyId
                ,name:name
                ,scope:scope
                ,primKey:primKey
                ,roleId:roleId
                ,actionId:actionId
            }]);
        };
        service.removeResourcePermission = function(groupId,companyId,name,scope,primKey,roleId,actionId) {
            return SessionService.invoke('/resourcepermission/remove-resource-permission',[{
                groupId:groupId
                ,companyId:companyId
                ,name:name
                ,scope:scope
                ,primKey:primKey
                ,roleId:roleId
                ,actionId:actionId
            }]);
        };
        service.removeResourcePermissions = function(groupId,companyId,name,scope,roleId,actionId) {
            return SessionService.invoke('/resourcepermission/remove-resource-permissions',[{
                groupId:groupId
                ,companyId:companyId
                ,name:name
                ,scope:scope
                ,roleId:roleId
                ,actionId:actionId
            }]);
        };
        service.setIndividualResourcePermissions = function(groupId,companyId,name,primKey,roleIdsToActionIds) {
            return SessionService.invoke('/resourcepermission/set-individual-resource-permissions',[{
                groupId:groupId
                ,companyId:companyId
                ,name:name
                ,primKey:primKey
                ,roleIdsToActionIds:roleIdsToActionIds
            }]);
        };
        service.setIndividualResourcePermissions = function(groupId,companyId,name,primKey,roleId,actionIds) {
            return SessionService.invoke('/resourcepermission/set-individual-resource-permissions',[{
                groupId:groupId
                ,companyId:companyId
                ,name:name
                ,primKey:primKey
                ,roleId:roleId
                ,actionIds:actionIds
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('RoleService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addRole = function(name,titleMap,descriptionMap,type) {
            return SessionService.invoke('/role/add-role',[{
                name:name
                ,titleMap:titleMap
                ,descriptionMap:descriptionMap
                ,type:type
            }]);
        };
        service.addRole = function(className,classPK,name,titleMap,descriptionMap,type,subtype,serviceContext) {
            return SessionService.invoke('/role/add-role',[{
                className:className
                ,classPK:classPK
                ,name:name
                ,titleMap:titleMap
                ,descriptionMap:descriptionMap
                ,type:type
                ,subtype:subtype
                ,serviceContext:serviceContext
            }]);
        };
        service.addUserRoles = function(userId,roleIds) {
            return SessionService.invoke('/role/add-user-roles',[{
                userId:userId
                ,roleIds:roleIds
            }]);
        };
        service.deleteRole = function(roleId) {
            return SessionService.invoke('/role/delete-role',[{
                roleId:roleId
            }]);
        };
        service.getGroupRoles = function(groupId) {
            return SessionService.invoke('/role/get-group-roles',[{
                groupId:groupId
            }]);
        };
        service.getRole = function(roleId) {
            return SessionService.invoke('/role/get-role',[{
                roleId:roleId
            }]);
        };
        service.getRole = function(companyId,name) {
            return SessionService.invoke('/role/get-role',[{
                companyId:companyId
                ,name:name
            }]);
        };
        service.getUserGroupGroupRoles = function(userId,groupId) {
            return SessionService.invoke('/role/get-user-group-group-roles',[{
                userId:userId
                ,groupId:groupId
            }]);
        };
        service.getUserGroupRoles = function(userId,groupId) {
            return SessionService.invoke('/role/get-user-group-roles',[{
                userId:userId
                ,groupId:groupId
            }]);
        };
        service.getUserRelatedRoles = function(userId,groups) {
            return SessionService.invoke('/role/get-user-related-roles',[{
                userId:userId
                ,groups:groups
            }]);
        };
        service.getUserRoles = function(userId) {
            return SessionService.invoke('/role/get-user-roles',[{
                userId:userId
            }]);
        };
        service.hasUserRole = function(userId,companyId,name,inherited) {
            return SessionService.invoke('/role/has-user-role',[{
                userId:userId
                ,companyId:companyId
                ,name:name
                ,inherited:inherited
            }]);
        };
        service.hasUserRoles = function(userId,companyId,names,inherited) {
            return SessionService.invoke('/role/has-user-roles',[{
                userId:userId
                ,companyId:companyId
                ,names:names
                ,inherited:inherited
            }]);
        };
        service.unsetUserRoles = function(userId,roleIds) {
            return SessionService.invoke('/role/unset-user-roles',[{
                userId:userId
                ,roleIds:roleIds
            }]);
        };
        service.updateRole = function(roleId,name,titleMap,descriptionMap,subtype,serviceContext) {
            return SessionService.invoke('/role/update-role',[{
                roleId:roleId
                ,name:name
                ,titleMap:titleMap
                ,descriptionMap:descriptionMap
                ,subtype:subtype
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('ScframeworkversionService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addFrameworkVersion = function(name,url,active,priority,serviceContext) {
            return SessionService.invoke('/scframeworkversion/add-framework-version',[{
                name:name
                ,url:url
                ,active:active
                ,priority:priority
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteFrameworkVersion = function(frameworkVersionId) {
            return SessionService.invoke('/scframeworkversion/delete-framework-version',[{
                frameworkVersionId:frameworkVersionId
            }]);
        };
        service.getFrameworkVersion = function(frameworkVersionId) {
            return SessionService.invoke('/scframeworkversion/get-framework-version',[{
                frameworkVersionId:frameworkVersionId
            }]);
        };
        service.getFrameworkVersions = function(groupId,active) {
            return SessionService.invoke('/scframeworkversion/get-framework-versions',[{
                groupId:groupId
                ,active:active
            }]);
        };
        service.getFrameworkVersions = function(groupId,active,start,end) {
            return SessionService.invoke('/scframeworkversion/get-framework-versions',[{
                groupId:groupId
                ,active:active
                ,start:start
                ,end:end
            }]);
        };
        service.updateFrameworkVersion = function(frameworkVersionId,name,url,active,priority) {
            return SessionService.invoke('/scframeworkversion/update-framework-version',[{
                frameworkVersionId:frameworkVersionId
                ,name:name
                ,url:url
                ,active:active
                ,priority:priority
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('SclicenseService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addLicense = function(name,url,openSource,active,recommended) {
            return SessionService.invoke('/sclicense/add-license',[{
                name:name
                ,url:url
                ,openSource:openSource
                ,active:active
                ,recommended:recommended
            }]);
        };
        service.deleteLicense = function(licenseId) {
            return SessionService.invoke('/sclicense/delete-license',[{
                licenseId:licenseId
            }]);
        };
        service.getLicense = function(licenseId) {
            return SessionService.invoke('/sclicense/get-license',[{
                licenseId:licenseId
            }]);
        };
        service.updateLicense = function(licenseId,name,url,openSource,active,recommended) {
            return SessionService.invoke('/sclicense/update-license',[{
                licenseId:licenseId
                ,name:name
                ,url:url
                ,openSource:openSource
                ,active:active
                ,recommended:recommended
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('ScproductentryService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addProductEntry = function(name,type,tags,shortDescription,longDescription,pageURL,author,repoGroupId,repoArtifactId,licenseIds,thumbnails,fullImages,serviceContext) {
            return SessionService.invoke('/scproductentry/add-product-entry',[{
                name:name
                ,type:type
                ,tags:tags
                ,shortDescription:shortDescription
                ,longDescription:longDescription
                ,pageURL:pageURL
                ,author:author
                ,repoGroupId:repoGroupId
                ,repoArtifactId:repoArtifactId
                ,licenseIds:licenseIds
                ,thumbnails:thumbnails
                ,fullImages:fullImages
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteProductEntry = function(productEntryId) {
            return SessionService.invoke('/scproductentry/delete-product-entry',[{
                productEntryId:productEntryId
            }]);
        };
        service.getProductEntry = function(productEntryId) {
            return SessionService.invoke('/scproductentry/get-product-entry',[{
                productEntryId:productEntryId
            }]);
        };
        service.updateProductEntry = function(productEntryId,name,type,tags,shortDescription,longDescription,pageURL,author,repoGroupId,repoArtifactId,licenseIds,thumbnails,fullImages) {
            return SessionService.invoke('/scproductentry/update-product-entry',[{
                productEntryId:productEntryId
                ,name:name
                ,type:type
                ,tags:tags
                ,shortDescription:shortDescription
                ,longDescription:longDescription
                ,pageURL:pageURL
                ,author:author
                ,repoGroupId:repoGroupId
                ,repoArtifactId:repoArtifactId
                ,licenseIds:licenseIds
                ,thumbnails:thumbnails
                ,fullImages:fullImages
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('ScproductversionService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addProductVersion = function(productEntryId,version,changeLog,downloadPageURL,directDownloadURL,testDirectDownloadURL,repoStoreArtifact,frameworkVersionIds,serviceContext) {
            return SessionService.invoke('/scproductversion/add-product-version',[{
                productEntryId:productEntryId
                ,version:version
                ,changeLog:changeLog
                ,downloadPageURL:downloadPageURL
                ,directDownloadURL:directDownloadURL
                ,testDirectDownloadURL:testDirectDownloadURL
                ,repoStoreArtifact:repoStoreArtifact
                ,frameworkVersionIds:frameworkVersionIds
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteProductVersion = function(productVersionId) {
            return SessionService.invoke('/scproductversion/delete-product-version',[{
                productVersionId:productVersionId
            }]);
        };
        service.getProductVersion = function(productVersionId) {
            return SessionService.invoke('/scproductversion/get-product-version',[{
                productVersionId:productVersionId
            }]);
        };
        service.getProductVersions = function(productEntryId,start,end) {
            return SessionService.invoke('/scproductversion/get-product-versions',[{
                productEntryId:productEntryId
                ,start:start
                ,end:end
            }]);
        };
        service.getProductVersionsCount = function(productEntryId) {
            return SessionService.invoke('/scproductversion/get-product-versions-count',[{
                productEntryId:productEntryId
            }]);
        };
        service.updateProductVersion = function(productVersionId,version,changeLog,downloadPageURL,directDownloadURL,testDirectDownloadURL,repoStoreArtifact,frameworkVersionIds) {
            return SessionService.invoke('/scproductversion/update-product-version',[{
                productVersionId:productVersionId
                ,version:version
                ,changeLog:changeLog
                ,downloadPageURL:downloadPageURL
                ,directDownloadURL:directDownloadURL
                ,testDirectDownloadURL:testDirectDownloadURL
                ,repoStoreArtifact:repoStoreArtifact
                ,frameworkVersionIds:frameworkVersionIds
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('ShoppingcategoryService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addCategory = function(parentCategoryId,name,description,serviceContext) {
            return SessionService.invoke('/shoppingcategory/add-category',[{
                parentCategoryId:parentCategoryId
                ,name:name
                ,description:description
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteCategory = function(categoryId) {
            return SessionService.invoke('/shoppingcategory/delete-category',[{
                categoryId:categoryId
            }]);
        };
        service.getCategories = function(groupId) {
            return SessionService.invoke('/shoppingcategory/get-categories',[{
                groupId:groupId
            }]);
        };
        service.getCategories = function(groupId,parentCategoryId,start,end) {
            return SessionService.invoke('/shoppingcategory/get-categories',[{
                groupId:groupId
                ,parentCategoryId:parentCategoryId
                ,start:start
                ,end:end
            }]);
        };
        service.getCategoriesCount = function(groupId,parentCategoryId) {
            return SessionService.invoke('/shoppingcategory/get-categories-count',[{
                groupId:groupId
                ,parentCategoryId:parentCategoryId
            }]);
        };
        service.getCategory = function(categoryId) {
            return SessionService.invoke('/shoppingcategory/get-category',[{
                categoryId:categoryId
            }]);
        };
        service.getSubcategoryIds = function(categoryIds,groupId,categoryId) {
            return SessionService.invoke('/shoppingcategory/get-subcategory-ids',[{
                categoryIds:categoryIds
                ,groupId:groupId
                ,categoryId:categoryId
            }]);
        };
        service.updateCategory = function(categoryId,parentCategoryId,name,description,mergeWithParentCategory,serviceContext) {
            return SessionService.invoke('/shoppingcategory/update-category',[{
                categoryId:categoryId
                ,parentCategoryId:parentCategoryId
                ,name:name
                ,description:description
                ,mergeWithParentCategory:mergeWithParentCategory
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('ShoppingcouponService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addCoupon = function(code,autoCode,name,description,startDateMonth,startDateDay,startDateYear,startDateHour,startDateMinute,endDateMonth,endDateDay,endDateYear,endDateHour,endDateMinute,neverExpire,active,limitCategories,limitSkus,minOrder,discount,discountType,serviceContext) {
            return SessionService.invoke('/shoppingcoupon/add-coupon',[{
                code:code
                ,autoCode:autoCode
                ,name:name
                ,description:description
                ,startDateMonth:startDateMonth
                ,startDateDay:startDateDay
                ,startDateYear:startDateYear
                ,startDateHour:startDateHour
                ,startDateMinute:startDateMinute
                ,endDateMonth:endDateMonth
                ,endDateDay:endDateDay
                ,endDateYear:endDateYear
                ,endDateHour:endDateHour
                ,endDateMinute:endDateMinute
                ,neverExpire:neverExpire
                ,active:active
                ,limitCategories:limitCategories
                ,limitSkus:limitSkus
                ,minOrder:minOrder
                ,discount:discount
                ,discountType:discountType
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteCoupon = function(groupId,couponId) {
            return SessionService.invoke('/shoppingcoupon/delete-coupon',[{
                groupId:groupId
                ,couponId:couponId
            }]);
        };
        service.getCoupon = function(groupId,couponId) {
            return SessionService.invoke('/shoppingcoupon/get-coupon',[{
                groupId:groupId
                ,couponId:couponId
            }]);
        };
        service.search = function(groupId,companyId,code,active,discountType,andOperator,start,end) {
            return SessionService.invoke('/shoppingcoupon/search',[{
                groupId:groupId
                ,companyId:companyId
                ,code:code
                ,active:active
                ,discountType:discountType
                ,andOperator:andOperator
                ,start:start
                ,end:end
            }]);
        };
        service.updateCoupon = function(couponId,name,description,startDateMonth,startDateDay,startDateYear,startDateHour,startDateMinute,endDateMonth,endDateDay,endDateYear,endDateHour,endDateMinute,neverExpire,active,limitCategories,limitSkus,minOrder,discount,discountType,serviceContext) {
            return SessionService.invoke('/shoppingcoupon/update-coupon',[{
                couponId:couponId
                ,name:name
                ,description:description
                ,startDateMonth:startDateMonth
                ,startDateDay:startDateDay
                ,startDateYear:startDateYear
                ,startDateHour:startDateHour
                ,startDateMinute:startDateMinute
                ,endDateMonth:endDateMonth
                ,endDateDay:endDateDay
                ,endDateYear:endDateYear
                ,endDateHour:endDateHour
                ,endDateMinute:endDateMinute
                ,neverExpire:neverExpire
                ,active:active
                ,limitCategories:limitCategories
                ,limitSkus:limitSkus
                ,minOrder:minOrder
                ,discount:discount
                ,discountType:discountType
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('ShoppingitemService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addBookItems = function(groupId,categoryId,isbns) {
            return SessionService.invoke('/shoppingitem/add-book-items',[{
                groupId:groupId
                ,categoryId:categoryId
                ,isbns:isbns
            }]);
        };
        service.addItem = function(groupId,categoryId,sku,name,description,properties,fieldsQuantities,requiresShipping,stockQuantity,featured,sale,smallImage,smallImageURL,smallFile,mediumImage,mediumImageURL,mediumFile,largeImage,largeImageURL,largeFile,itemFields,itemPrices,serviceContext) {
            return SessionService.invoke('/shoppingitem/add-item',[{
                groupId:groupId
                ,categoryId:categoryId
                ,sku:sku
                ,name:name
                ,description:description
                ,properties:properties
                ,fieldsQuantities:fieldsQuantities
                ,requiresShipping:requiresShipping
                ,stockQuantity:stockQuantity
                ,featured:featured
                ,sale:sale
                ,smallImage:smallImage
                ,smallImageURL:smallImageURL
                ,smallFile:smallFile
                ,mediumImage:mediumImage
                ,mediumImageURL:mediumImageURL
                ,mediumFile:mediumFile
                ,largeImage:largeImage
                ,largeImageURL:largeImageURL
                ,largeFile:largeFile
                ,itemFields:itemFields
                ,itemPrices:itemPrices
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteItem = function(itemId) {
            return SessionService.invoke('/shoppingitem/delete-item',[{
                itemId:itemId
            }]);
        };
        service.getCategoriesItemsCount = function(groupId,categoryIds) {
            return SessionService.invoke('/shoppingitem/get-categories-items-count',[{
                groupId:groupId
                ,categoryIds:categoryIds
            }]);
        };
        service.getItem = function(itemId) {
            return SessionService.invoke('/shoppingitem/get-item',[{
                itemId:itemId
            }]);
        };
        service.getItems = function(groupId,categoryId) {
            return SessionService.invoke('/shoppingitem/get-items',[{
                groupId:groupId
                ,categoryId:categoryId
            }]);
        };
        service.getItems = function(groupId,categoryId,start,end,obc) {
            return SessionService.invoke('/shoppingitem/get-items',[{
                groupId:groupId
                ,categoryId:categoryId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.getItemsCount = function(groupId,categoryId) {
            return SessionService.invoke('/shoppingitem/get-items-count',[{
                groupId:groupId
                ,categoryId:categoryId
            }]);
        };
        service.getItemsPrevAndNext = function(itemId,obc) {
            return SessionService.invoke('/shoppingitem/get-items-prev-and-next',[{
                itemId:itemId
                ,obc:obc
            }]);
        };
        service.updateItem = function(itemId,groupId,categoryId,sku,name,description,properties,fieldsQuantities,requiresShipping,stockQuantity,featured,sale,smallImage,smallImageURL,smallFile,mediumImage,mediumImageURL,mediumFile,largeImage,largeImageURL,largeFile,itemFields,itemPrices,serviceContext) {
            return SessionService.invoke('/shoppingitem/update-item',[{
                itemId:itemId
                ,groupId:groupId
                ,categoryId:categoryId
                ,sku:sku
                ,name:name
                ,description:description
                ,properties:properties
                ,fieldsQuantities:fieldsQuantities
                ,requiresShipping:requiresShipping
                ,stockQuantity:stockQuantity
                ,featured:featured
                ,sale:sale
                ,smallImage:smallImage
                ,smallImageURL:smallImageURL
                ,smallFile:smallFile
                ,mediumImage:mediumImage
                ,mediumImageURL:mediumImageURL
                ,mediumFile:mediumFile
                ,largeImage:largeImage
                ,largeImageURL:largeImageURL
                ,largeFile:largeFile
                ,itemFields:itemFields
                ,itemPrices:itemPrices
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('ShoppingorderService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.completeOrder = function(groupId,number,ppTxnId,ppPaymentStatus,ppPaymentGross,ppReceiverEmail,ppPayerEmail,serviceContext) {
            return SessionService.invoke('/shoppingorder/complete-order',[{
                groupId:groupId
                ,number:number
                ,ppTxnId:ppTxnId
                ,ppPaymentStatus:ppPaymentStatus
                ,ppPaymentGross:ppPaymentGross
                ,ppReceiverEmail:ppReceiverEmail
                ,ppPayerEmail:ppPayerEmail
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteOrder = function(groupId,orderId) {
            return SessionService.invoke('/shoppingorder/delete-order',[{
                groupId:groupId
                ,orderId:orderId
            }]);
        };
        service.getOrder = function(groupId,orderId) {
            return SessionService.invoke('/shoppingorder/get-order',[{
                groupId:groupId
                ,orderId:orderId
            }]);
        };
        service.sendEmail = function(groupId,orderId,emailType,serviceContext) {
            return SessionService.invoke('/shoppingorder/send-email',[{
                groupId:groupId
                ,orderId:orderId
                ,emailType:emailType
                ,serviceContext:serviceContext
            }]);
        };
        service.updateOrder = function(groupId,orderId,billingFirstName,billingLastName,billingEmailAddress,billingCompany,billingStreet,billingCity,billingState,billingZip,billingCountry,billingPhone,shipToBilling,shippingFirstName,shippingLastName,shippingEmailAddress,shippingCompany,shippingStreet,shippingCity,shippingState,shippingZip,shippingCountry,shippingPhone,ccName,ccType,ccNumber,ccExpMonth,ccExpYear,ccVerNumber,comments) {
            return SessionService.invoke('/shoppingorder/update-order',[{
                groupId:groupId
                ,orderId:orderId
                ,billingFirstName:billingFirstName
                ,billingLastName:billingLastName
                ,billingEmailAddress:billingEmailAddress
                ,billingCompany:billingCompany
                ,billingStreet:billingStreet
                ,billingCity:billingCity
                ,billingState:billingState
                ,billingZip:billingZip
                ,billingCountry:billingCountry
                ,billingPhone:billingPhone
                ,shipToBilling:shipToBilling
                ,shippingFirstName:shippingFirstName
                ,shippingLastName:shippingLastName
                ,shippingEmailAddress:shippingEmailAddress
                ,shippingCompany:shippingCompany
                ,shippingStreet:shippingStreet
                ,shippingCity:shippingCity
                ,shippingState:shippingState
                ,shippingZip:shippingZip
                ,shippingCountry:shippingCountry
                ,shippingPhone:shippingPhone
                ,ccName:ccName
                ,ccType:ccType
                ,ccNumber:ccNumber
                ,ccExpMonth:ccExpMonth
                ,ccExpYear:ccExpYear
                ,ccVerNumber:ccVerNumber
                ,comments:comments
            }]);
        };
        service.updateOrder = function(groupId,orderId,ppTxnId,ppPaymentStatus,ppPaymentGross,ppReceiverEmail,ppPayerEmail) {
            return SessionService.invoke('/shoppingorder/update-order',[{
                groupId:groupId
                ,orderId:orderId
                ,ppTxnId:ppTxnId
                ,ppPaymentStatus:ppPaymentStatus
                ,ppPaymentGross:ppPaymentGross
                ,ppReceiverEmail:ppReceiverEmail
                ,ppPayerEmail:ppPayerEmail
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('SocialactivityService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.getActivities = function(className,start,end) {
            return SessionService.invoke('/socialactivity/get-activities',[{
                className:className
                ,start:start
                ,end:end
            }]);
        };
        service.getActivities = function(classNameId,start,end) {
            return SessionService.invoke('/socialactivity/get-activities',[{
                classNameId:classNameId
                ,start:start
                ,end:end
            }]);
        };
        service.getActivities = function(mirrorActivityId,className,classPK,start,end) {
            return SessionService.invoke('/socialactivity/get-activities',[{
                mirrorActivityId:mirrorActivityId
                ,className:className
                ,classPK:classPK
                ,start:start
                ,end:end
            }]);
        };
        service.getActivities = function(mirrorActivityId,classNameId,classPK,start,end) {
            return SessionService.invoke('/socialactivity/get-activities',[{
                mirrorActivityId:mirrorActivityId
                ,classNameId:classNameId
                ,classPK:classPK
                ,start:start
                ,end:end
            }]);
        };
        service.getActivitiesCount = function(className) {
            return SessionService.invoke('/socialactivity/get-activities-count',[{
                className:className
            }]);
        };
        service.getActivitiesCount = function(classNameId) {
            return SessionService.invoke('/socialactivity/get-activities-count',[{
                classNameId:classNameId
            }]);
        };
        service.getActivitiesCount = function(mirrorActivityId,className,classPK) {
            return SessionService.invoke('/socialactivity/get-activities-count',[{
                mirrorActivityId:mirrorActivityId
                ,className:className
                ,classPK:classPK
            }]);
        };
        service.getActivitiesCount = function(mirrorActivityId,classNameId,classPK) {
            return SessionService.invoke('/socialactivity/get-activities-count',[{
                mirrorActivityId:mirrorActivityId
                ,classNameId:classNameId
                ,classPK:classPK
            }]);
        };
        service.getActivity = function(activityId) {
            return SessionService.invoke('/socialactivity/get-activity',[{
                activityId:activityId
            }]);
        };
        service.getActivitySetActivities = function(activitySetId,start,end) {
            return SessionService.invoke('/socialactivity/get-activity-set-activities',[{
                activitySetId:activitySetId
                ,start:start
                ,end:end
            }]);
        };
        service.getGroupActivities = function(groupId,start,end) {
            return SessionService.invoke('/socialactivity/get-group-activities',[{
                groupId:groupId
                ,start:start
                ,end:end
            }]);
        };
        service.getGroupActivitiesCount = function(groupId) {
            return SessionService.invoke('/socialactivity/get-group-activities-count',[{
                groupId:groupId
            }]);
        };
        service.getGroupUsersActivities = function(groupId,start,end) {
            return SessionService.invoke('/socialactivity/get-group-users-activities',[{
                groupId:groupId
                ,start:start
                ,end:end
            }]);
        };
        service.getGroupUsersActivitiesCount = function(groupId) {
            return SessionService.invoke('/socialactivity/get-group-users-activities-count',[{
                groupId:groupId
            }]);
        };
        service.getMirrorActivity = function(mirrorActivityId) {
            return SessionService.invoke('/socialactivity/get-mirror-activity',[{
                mirrorActivityId:mirrorActivityId
            }]);
        };
        service.getOrganizationActivities = function(organizationId,start,end) {
            return SessionService.invoke('/socialactivity/get-organization-activities',[{
                organizationId:organizationId
                ,start:start
                ,end:end
            }]);
        };
        service.getOrganizationActivitiesCount = function(organizationId) {
            return SessionService.invoke('/socialactivity/get-organization-activities-count',[{
                organizationId:organizationId
            }]);
        };
        service.getOrganizationUsersActivities = function(organizationId,start,end) {
            return SessionService.invoke('/socialactivity/get-organization-users-activities',[{
                organizationId:organizationId
                ,start:start
                ,end:end
            }]);
        };
        service.getOrganizationUsersActivitiesCount = function(organizationId) {
            return SessionService.invoke('/socialactivity/get-organization-users-activities-count',[{
                organizationId:organizationId
            }]);
        };
        service.getRelationActivities = function(userId,start,end) {
            return SessionService.invoke('/socialactivity/get-relation-activities',[{
                userId:userId
                ,start:start
                ,end:end
            }]);
        };
        service.getRelationActivities = function(userId,type,start,end) {
            return SessionService.invoke('/socialactivity/get-relation-activities',[{
                userId:userId
                ,type:type
                ,start:start
                ,end:end
            }]);
        };
        service.getRelationActivitiesCount = function(userId) {
            return SessionService.invoke('/socialactivity/get-relation-activities-count',[{
                userId:userId
            }]);
        };
        service.getRelationActivitiesCount = function(userId,type) {
            return SessionService.invoke('/socialactivity/get-relation-activities-count',[{
                userId:userId
                ,type:type
            }]);
        };
        service.getUserActivities = function(userId,start,end) {
            return SessionService.invoke('/socialactivity/get-user-activities',[{
                userId:userId
                ,start:start
                ,end:end
            }]);
        };
        service.getUserActivitiesCount = function(userId) {
            return SessionService.invoke('/socialactivity/get-user-activities-count',[{
                userId:userId
            }]);
        };
        service.getUserGroupsActivities = function(userId,start,end) {
            return SessionService.invoke('/socialactivity/get-user-groups-activities',[{
                userId:userId
                ,start:start
                ,end:end
            }]);
        };
        service.getUserGroupsActivitiesCount = function(userId) {
            return SessionService.invoke('/socialactivity/get-user-groups-activities-count',[{
                userId:userId
            }]);
        };
        service.getUserGroupsAndOrganizationsActivities = function(userId,start,end) {
            return SessionService.invoke('/socialactivity/get-user-groups-and-organizations-activities',[{
                userId:userId
                ,start:start
                ,end:end
            }]);
        };
        service.getUserGroupsAndOrganizationsActivitiesCount = function(userId) {
            return SessionService.invoke('/socialactivity/get-user-groups-and-organizations-activities-count',[{
                userId:userId
            }]);
        };
        service.getUserOrganizationsActivities = function(userId,start,end) {
            return SessionService.invoke('/socialactivity/get-user-organizations-activities',[{
                userId:userId
                ,start:start
                ,end:end
            }]);
        };
        service.getUserOrganizationsActivitiesCount = function(userId) {
            return SessionService.invoke('/socialactivity/get-user-organizations-activities-count',[{
                userId:userId
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('SocialactivitysettingService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.getActivityDefinition = function(groupId,className,activityType) {
            return SessionService.invoke('/socialactivitysetting/get-activity-definition',[{
                groupId:groupId
                ,className:className
                ,activityType:activityType
            }]);
        };
        service.getActivityDefinitions = function(groupId,className) {
            return SessionService.invoke('/socialactivitysetting/get-activity-definitions',[{
                groupId:groupId
                ,className:className
            }]);
        };
        service.getActivitySettings = function(groupId) {
            return SessionService.invoke('/socialactivitysetting/get-activity-settings',[{
                groupId:groupId
            }]);
        };
        service.getJsonActivityDefinitions = function(groupId,className) {
            return SessionService.invoke('/socialactivitysetting/get-json-activity-definitions',[{
                groupId:groupId
                ,className:className
            }]);
        };
        service.updateActivitySetting = function(groupId,className,enabled) {
            return SessionService.invoke('/socialactivitysetting/update-activity-setting',[{
                groupId:groupId
                ,className:className
                ,enabled:enabled
            }]);
        };
        service.updateActivitySetting = function(groupId,className,activityType,activityCounterDefinition) {
            return SessionService.invoke('/socialactivitysetting/update-activity-setting',[{
                groupId:groupId
                ,className:className
                ,activityType:activityType
                ,activityCounterDefinition:activityCounterDefinition
            }]);
        };
        service.updateActivitySettings = function(groupId,className,activityType,activityCounterDefinitions) {
            return SessionService.invoke('/socialactivitysetting/update-activity-settings',[{
                groupId:groupId
                ,className:className
                ,activityType:activityType
                ,activityCounterDefinitions:activityCounterDefinitions
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('SocialrequestService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.updateRequest = function(requestId,status,themeDisplay) {
            return SessionService.invoke('/socialrequest/update-request',[{
                requestId:requestId
                ,status:status
                ,themeDisplay:themeDisplay
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('StagingService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.cleanUpStagingRequest = function(stagingRequestId) {
            return SessionService.invoke('/staging/clean-up-staging-request',[{
                stagingRequestId:stagingRequestId
            }]);
        };
        service.createStagingRequest = function(groupId,checksum) {
            return SessionService.invoke('/staging/create-staging-request',[{
                groupId:groupId
                ,checksum:checksum
            }]);
        };
        service.publishStagingRequest = function(stagingRequestId,privateLayout,parameterMap) {
            return SessionService.invoke('/staging/publish-staging-request',[{
                stagingRequestId:stagingRequestId
                ,privateLayout:privateLayout
                ,parameterMap:parameterMap
            }]);
        };
        service.updateStagingRequest = function(stagingRequestId,fileName,bytes) {
            return SessionService.invoke('/staging/update-staging-request',[{
                stagingRequestId:stagingRequestId
                ,fileName:fileName
                ,bytes:bytes
            }]);
        };
        service.validateStagingRequest = function(stagingRequestId,privateLayout,parameterMap) {
            return SessionService.invoke('/staging/validate-staging-request',[{
                stagingRequestId:stagingRequestId
                ,privateLayout:privateLayout
                ,parameterMap:parameterMap
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('TeamService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addTeam = function(groupId,name,description) {
            return SessionService.invoke('/team/add-team',[{
                groupId:groupId
                ,name:name
                ,description:description
            }]);
        };
        service.deleteTeam = function(teamId) {
            return SessionService.invoke('/team/delete-team',[{
                teamId:teamId
            }]);
        };
        service.getGroupTeams = function(groupId) {
            return SessionService.invoke('/team/get-group-teams',[{
                groupId:groupId
            }]);
        };
        service.getTeam = function(teamId) {
            return SessionService.invoke('/team/get-team',[{
                teamId:teamId
            }]);
        };
        service.getTeam = function(groupId,name) {
            return SessionService.invoke('/team/get-team',[{
                groupId:groupId
                ,name:name
            }]);
        };
        service.getUserTeams = function(userId) {
            return SessionService.invoke('/team/get-user-teams',[{
                userId:userId
            }]);
        };
        service.getUserTeams = function(userId,groupId) {
            return SessionService.invoke('/team/get-user-teams',[{
                userId:userId
                ,groupId:groupId
            }]);
        };
        service.hasUserTeam = function(userId,teamId) {
            return SessionService.invoke('/team/has-user-team',[{
                userId:userId
                ,teamId:teamId
            }]);
        };
        service.updateTeam = function(teamId,name,description) {
            return SessionService.invoke('/team/update-team',[{
                teamId:teamId
                ,name:name
                ,description:description
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('ThemeService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.getThemes = function(companyId) {
            return SessionService.invoke('/theme/get-themes',[{
                companyId:companyId
            }]);
        };
        service.getWarThemes = function() {
            return SessionService.invoke('/theme/get-war-themes',[{
                
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('TrashentryService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.deleteEntries = function(entryIds) {
            return SessionService.invoke('/trashentry/delete-entries',[{
                entryIds:entryIds
            }]);
        };
        service.deleteEntries = function(groupId) {
            return SessionService.invoke('/trashentry/delete-entries',[{
                groupId:groupId
            }]);
        };
        service.deleteEntry = function(entryId) {
            return SessionService.invoke('/trashentry/delete-entry',[{
                entryId:entryId
            }]);
        };
        service.deleteEntry = function(className,classPK) {
            return SessionService.invoke('/trashentry/delete-entry',[{
                className:className
                ,classPK:classPK
            }]);
        };
        service.getEntries = function(groupId) {
            return SessionService.invoke('/trashentry/get-entries',[{
                groupId:groupId
            }]);
        };
        service.getEntries = function(groupId,start,end,obc) {
            return SessionService.invoke('/trashentry/get-entries',[{
                groupId:groupId
                ,start:start
                ,end:end
                ,obc:obc
            }]);
        };
        service.moveEntry = function(className,classPK,destinationContainerModelId,serviceContext) {
            return SessionService.invoke('/trashentry/move-entry',[{
                className:className
                ,classPK:classPK
                ,destinationContainerModelId:destinationContainerModelId
                ,serviceContext:serviceContext
            }]);
        };
        service.restoreEntry = function(entryId) {
            return SessionService.invoke('/trashentry/restore-entry',[{
                entryId:entryId
            }]);
        };
        service.restoreEntry = function(entryId,overrideClassPK,name) {
            return SessionService.invoke('/trashentry/restore-entry',[{
                entryId:entryId
                ,overrideClassPK:overrideClassPK
                ,name:name
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('UserService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addGroupUsers = function(groupId,userIds,serviceContext) {
            return SessionService.invoke('/user/add-group-users',[{
                groupId:groupId
                ,userIds:userIds
                ,serviceContext:serviceContext
            }]);
        };
        service.addOrganizationUsers = function(organizationId,userIds) {
            return SessionService.invoke('/user/add-organization-users',[{
                organizationId:organizationId
                ,userIds:userIds
            }]);
        };
        service.addPasswordPolicyUsers = function(passwordPolicyId,userIds) {
            return SessionService.invoke('/user/add-password-policy-users',[{
                passwordPolicyId:passwordPolicyId
                ,userIds:userIds
            }]);
        };
        service.addRoleUsers = function(roleId,userIds) {
            return SessionService.invoke('/user/add-role-users',[{
                roleId:roleId
                ,userIds:userIds
            }]);
        };
        service.addTeamUsers = function(teamId,userIds) {
            return SessionService.invoke('/user/add-team-users',[{
                teamId:teamId
                ,userIds:userIds
            }]);
        };
        service.addUser = function(companyId,autoPassword,password1,password2,autoScreenName,screenName,emailAddress,facebookId,openId,locale,firstName,middleName,lastName,prefixId,suffixId,male,birthdayMonth,birthdayDay,birthdayYear,jobTitle,groupIds,organizationIds,roleIds,userGroupIds,sendEmail,serviceContext) {
            return SessionService.invoke('/user/add-user',[{
                companyId:companyId
                ,autoPassword:autoPassword
                ,password1:password1
                ,password2:password2
                ,autoScreenName:autoScreenName
                ,screenName:screenName
                ,emailAddress:emailAddress
                ,facebookId:facebookId
                ,openId:openId
                ,locale:locale
                ,firstName:firstName
                ,middleName:middleName
                ,lastName:lastName
                ,prefixId:prefixId
                ,suffixId:suffixId
                ,male:male
                ,birthdayMonth:birthdayMonth
                ,birthdayDay:birthdayDay
                ,birthdayYear:birthdayYear
                ,jobTitle:jobTitle
                ,groupIds:groupIds
                ,organizationIds:organizationIds
                ,roleIds:roleIds
                ,userGroupIds:userGroupIds
                ,sendEmail:sendEmail
                ,serviceContext:serviceContext
            }]);
        };
        service.addUser = function(companyId,autoPassword,password1,password2,autoScreenName,screenName,emailAddress,facebookId,openId,locale,firstName,middleName,lastName,prefixId,suffixId,male,birthdayMonth,birthdayDay,birthdayYear,jobTitle,groupIds,organizationIds,roleIds,userGroupIds,addresses,emailAddresses,phones,websites,announcementsDelivers,sendEmail,serviceContext) {
            return SessionService.invoke('/user/add-user',[{
                companyId:companyId
                ,autoPassword:autoPassword
                ,password1:password1
                ,password2:password2
                ,autoScreenName:autoScreenName
                ,screenName:screenName
                ,emailAddress:emailAddress
                ,facebookId:facebookId
                ,openId:openId
                ,locale:locale
                ,firstName:firstName
                ,middleName:middleName
                ,lastName:lastName
                ,prefixId:prefixId
                ,suffixId:suffixId
                ,male:male
                ,birthdayMonth:birthdayMonth
                ,birthdayDay:birthdayDay
                ,birthdayYear:birthdayYear
                ,jobTitle:jobTitle
                ,groupIds:groupIds
                ,organizationIds:organizationIds
                ,roleIds:roleIds
                ,userGroupIds:userGroupIds
                ,addresses:addresses
                ,emailAddresses:emailAddresses
                ,phones:phones
                ,websites:websites
                ,announcementsDelivers:announcementsDelivers
                ,sendEmail:sendEmail
                ,serviceContext:serviceContext
            }]);
        };
        service.addUserGroupUsers = function(userGroupId,userIds) {
            return SessionService.invoke('/user/add-user-group-users',[{
                userGroupId:userGroupId
                ,userIds:userIds
            }]);
        };
        service.addUserWithWorkflow = function(companyId,autoPassword,password1,password2,autoScreenName,screenName,emailAddress,facebookId,openId,locale,firstName,middleName,lastName,prefixId,suffixId,male,birthdayMonth,birthdayDay,birthdayYear,jobTitle,groupIds,organizationIds,roleIds,userGroupIds,sendEmail,serviceContext) {
            return SessionService.invoke('/user/add-user-with-workflow',[{
                companyId:companyId
                ,autoPassword:autoPassword
                ,password1:password1
                ,password2:password2
                ,autoScreenName:autoScreenName
                ,screenName:screenName
                ,emailAddress:emailAddress
                ,facebookId:facebookId
                ,openId:openId
                ,locale:locale
                ,firstName:firstName
                ,middleName:middleName
                ,lastName:lastName
                ,prefixId:prefixId
                ,suffixId:suffixId
                ,male:male
                ,birthdayMonth:birthdayMonth
                ,birthdayDay:birthdayDay
                ,birthdayYear:birthdayYear
                ,jobTitle:jobTitle
                ,groupIds:groupIds
                ,organizationIds:organizationIds
                ,roleIds:roleIds
                ,userGroupIds:userGroupIds
                ,sendEmail:sendEmail
                ,serviceContext:serviceContext
            }]);
        };
        service.addUserWithWorkflow = function(companyId,autoPassword,password1,password2,autoScreenName,screenName,emailAddress,facebookId,openId,locale,firstName,middleName,lastName,prefixId,suffixId,male,birthdayMonth,birthdayDay,birthdayYear,jobTitle,groupIds,organizationIds,roleIds,userGroupIds,addresses,emailAddresses,phones,websites,announcementsDelivers,sendEmail,serviceContext) {
            return SessionService.invoke('/user/add-user-with-workflow',[{
                companyId:companyId
                ,autoPassword:autoPassword
                ,password1:password1
                ,password2:password2
                ,autoScreenName:autoScreenName
                ,screenName:screenName
                ,emailAddress:emailAddress
                ,facebookId:facebookId
                ,openId:openId
                ,locale:locale
                ,firstName:firstName
                ,middleName:middleName
                ,lastName:lastName
                ,prefixId:prefixId
                ,suffixId:suffixId
                ,male:male
                ,birthdayMonth:birthdayMonth
                ,birthdayDay:birthdayDay
                ,birthdayYear:birthdayYear
                ,jobTitle:jobTitle
                ,groupIds:groupIds
                ,organizationIds:organizationIds
                ,roleIds:roleIds
                ,userGroupIds:userGroupIds
                ,addresses:addresses
                ,emailAddresses:emailAddresses
                ,phones:phones
                ,websites:websites
                ,announcementsDelivers:announcementsDelivers
                ,sendEmail:sendEmail
                ,serviceContext:serviceContext
            }]);
        };
        service.deletePortrait = function(userId) {
            return SessionService.invoke('/user/delete-portrait',[{
                userId:userId
            }]);
        };
        service.deleteRoleUser = function(roleId,userId) {
            return SessionService.invoke('/user/delete-role-user',[{
                roleId:roleId
                ,userId:userId
            }]);
        };
        service.deleteUser = function(userId) {
            return SessionService.invoke('/user/delete-user',[{
                userId:userId
            }]);
        };
        service.getCompanyUsers = function(companyId,start,end) {
            return SessionService.invoke('/user/get-company-users',[{
                companyId:companyId
                ,start:start
                ,end:end
            }]);
        };
        service.getCompanyUsersCount = function(companyId) {
            return SessionService.invoke('/user/get-company-users-count',[{
                companyId:companyId
            }]);
        };
        service.getGroupUserIds = function(groupId) {
            return SessionService.invoke('/user/get-group-user-ids',[{
                groupId:groupId
            }]);
        };
        service.getGroupUsers = function(groupId) {
            return SessionService.invoke('/user/get-group-users',[{
                groupId:groupId
            }]);
        };
        service.getOrganizationUserIds = function(organizationId) {
            return SessionService.invoke('/user/get-organization-user-ids',[{
                organizationId:organizationId
            }]);
        };
        service.getOrganizationUsers = function(organizationId) {
            return SessionService.invoke('/user/get-organization-users',[{
                organizationId:organizationId
            }]);
        };
        service.getRoleUserIds = function(roleId) {
            return SessionService.invoke('/user/get-role-user-ids',[{
                roleId:roleId
            }]);
        };
        service.getUserByEmailAddress = function(companyId,emailAddress) {
            return SessionService.invoke('/user/get-user-by-email-address',[{
                companyId:companyId
                ,emailAddress:emailAddress
            }]);
        };
        service.getUserById = function(userId) {
            return SessionService.invoke('/user/get-user-by-id',[{
                userId:userId
            }]);
        };
        service.getUserByScreenName = function(companyId,screenName) {
            return SessionService.invoke('/user/get-user-by-screen-name',[{
                companyId:companyId
                ,screenName:screenName
            }]);
        };
        service.getUserGroupUsers = function(userGroupId) {
            return SessionService.invoke('/user/get-user-group-users',[{
                userGroupId:userGroupId
            }]);
        };
        service.getUserIdByEmailAddress = function(companyId,emailAddress) {
            return SessionService.invoke('/user/get-user-id-by-email-address',[{
                companyId:companyId
                ,emailAddress:emailAddress
            }]);
        };
        service.getUserIdByScreenName = function(companyId,screenName) {
            return SessionService.invoke('/user/get-user-id-by-screen-name',[{
                companyId:companyId
                ,screenName:screenName
            }]);
        };
        service.hasGroupUser = function(groupId,userId) {
            return SessionService.invoke('/user/has-group-user',[{
                groupId:groupId
                ,userId:userId
            }]);
        };
        service.hasRoleUser = function(roleId,userId) {
            return SessionService.invoke('/user/has-role-user',[{
                roleId:roleId
                ,userId:userId
            }]);
        };
        service.hasRoleUser = function(companyId,name,userId,inherited) {
            return SessionService.invoke('/user/has-role-user',[{
                companyId:companyId
                ,name:name
                ,userId:userId
                ,inherited:inherited
            }]);
        };
        service.setRoleUsers = function(roleId,userIds) {
            return SessionService.invoke('/user/set-role-users',[{
                roleId:roleId
                ,userIds:userIds
            }]);
        };
        service.setUserGroupUsers = function(userGroupId,userIds) {
            return SessionService.invoke('/user/set-user-group-users',[{
                userGroupId:userGroupId
                ,userIds:userIds
            }]);
        };
        service.unsetGroupTeamsUsers = function(groupId,userIds) {
            return SessionService.invoke('/user/unset-group-teams-users',[{
                groupId:groupId
                ,userIds:userIds
            }]);
        };
        service.unsetGroupUsers = function(groupId,userIds,serviceContext) {
            return SessionService.invoke('/user/unset-group-users',[{
                groupId:groupId
                ,userIds:userIds
                ,serviceContext:serviceContext
            }]);
        };
        service.unsetOrganizationUsers = function(organizationId,userIds) {
            return SessionService.invoke('/user/unset-organization-users',[{
                organizationId:organizationId
                ,userIds:userIds
            }]);
        };
        service.unsetPasswordPolicyUsers = function(passwordPolicyId,userIds) {
            return SessionService.invoke('/user/unset-password-policy-users',[{
                passwordPolicyId:passwordPolicyId
                ,userIds:userIds
            }]);
        };
        service.unsetRoleUsers = function(roleId,userIds) {
            return SessionService.invoke('/user/unset-role-users',[{
                roleId:roleId
                ,userIds:userIds
            }]);
        };
        service.unsetTeamUsers = function(teamId,userIds) {
            return SessionService.invoke('/user/unset-team-users',[{
                teamId:teamId
                ,userIds:userIds
            }]);
        };
        service.unsetUserGroupUsers = function(userGroupId,userIds) {
            return SessionService.invoke('/user/unset-user-group-users',[{
                userGroupId:userGroupId
                ,userIds:userIds
            }]);
        };
        service.updateAgreedToTermsOfUse = function(userId,agreedToTermsOfUse) {
            return SessionService.invoke('/user/update-agreed-to-terms-of-use',[{
                userId:userId
                ,agreedToTermsOfUse:agreedToTermsOfUse
            }]);
        };
        service.updateEmailAddress = function(userId,password,emailAddress1,emailAddress2,serviceContext) {
            return SessionService.invoke('/user/update-email-address',[{
                userId:userId
                ,password:password
                ,emailAddress1:emailAddress1
                ,emailAddress2:emailAddress2
                ,serviceContext:serviceContext
            }]);
        };
        service.updateIncompleteUser = function(companyId,autoPassword,password1,password2,autoScreenName,screenName,emailAddress,facebookId,openId,locale,firstName,middleName,lastName,prefixId,suffixId,male,birthdayMonth,birthdayDay,birthdayYear,jobTitle,updateUserInformation,sendEmail,serviceContext) {
            return SessionService.invoke('/user/update-incomplete-user',[{
                companyId:companyId
                ,autoPassword:autoPassword
                ,password1:password1
                ,password2:password2
                ,autoScreenName:autoScreenName
                ,screenName:screenName
                ,emailAddress:emailAddress
                ,facebookId:facebookId
                ,openId:openId
                ,locale:locale
                ,firstName:firstName
                ,middleName:middleName
                ,lastName:lastName
                ,prefixId:prefixId
                ,suffixId:suffixId
                ,male:male
                ,birthdayMonth:birthdayMonth
                ,birthdayDay:birthdayDay
                ,birthdayYear:birthdayYear
                ,jobTitle:jobTitle
                ,updateUserInformation:updateUserInformation
                ,sendEmail:sendEmail
                ,serviceContext:serviceContext
            }]);
        };
        service.updateLockoutById = function(userId,lockout) {
            return SessionService.invoke('/user/update-lockout-by-id',[{
                userId:userId
                ,lockout:lockout
            }]);
        };
        service.updateOpenId = function(userId,openId) {
            return SessionService.invoke('/user/update-open-id',[{
                userId:userId
                ,openId:openId
            }]);
        };
        service.updateOrganizations = function(userId,organizationIds,serviceContext) {
            return SessionService.invoke('/user/update-organizations',[{
                userId:userId
                ,organizationIds:organizationIds
                ,serviceContext:serviceContext
            }]);
        };
        service.updatePassword = function(userId,password1,password2,passwordReset) {
            return SessionService.invoke('/user/update-password',[{
                userId:userId
                ,password1:password1
                ,password2:password2
                ,passwordReset:passwordReset
            }]);
        };
        service.updatePortrait = function(userId,bytes) {
            return SessionService.invoke('/user/update-portrait',[{
                userId:userId
                ,bytes:bytes
            }]);
        };
        service.updateReminderQuery = function(userId,question,answer) {
            return SessionService.invoke('/user/update-reminder-query',[{
                userId:userId
                ,question:question
                ,answer:answer
            }]);
        };
        service.updateScreenName = function(userId,screenName) {
            return SessionService.invoke('/user/update-screen-name',[{
                userId:userId
                ,screenName:screenName
            }]);
        };
        service.updateStatus = function(userId,status) {
            return SessionService.invoke('/user/update-status',[{
                userId:userId
                ,status:status
            }]);
        };
        service.updateStatus = function(userId,status,serviceContext) {
            return SessionService.invoke('/user/update-status',[{
                userId:userId
                ,status:status
                ,serviceContext:serviceContext
            }]);
        };
        service.updateUser = function(userId,oldPassword,newPassword1,newPassword2,passwordReset,reminderQueryQuestion,reminderQueryAnswer,screenName,emailAddress,facebookId,openId,languageId,timeZoneId,greeting,comments,firstName,middleName,lastName,prefixId,suffixId,male,birthdayMonth,birthdayDay,birthdayYear,smsSn,aimSn,facebookSn,icqSn,jabberSn,msnSn,mySpaceSn,skypeSn,twitterSn,ymSn,jobTitle,groupIds,organizationIds,roleIds,userGroupRoles,userGroupIds,serviceContext) {
            return SessionService.invoke('/user/update-user',[{
                userId:userId
                ,oldPassword:oldPassword
                ,newPassword1:newPassword1
                ,newPassword2:newPassword2
                ,passwordReset:passwordReset
                ,reminderQueryQuestion:reminderQueryQuestion
                ,reminderQueryAnswer:reminderQueryAnswer
                ,screenName:screenName
                ,emailAddress:emailAddress
                ,facebookId:facebookId
                ,openId:openId
                ,languageId:languageId
                ,timeZoneId:timeZoneId
                ,greeting:greeting
                ,comments:comments
                ,firstName:firstName
                ,middleName:middleName
                ,lastName:lastName
                ,prefixId:prefixId
                ,suffixId:suffixId
                ,male:male
                ,birthdayMonth:birthdayMonth
                ,birthdayDay:birthdayDay
                ,birthdayYear:birthdayYear
                ,smsSn:smsSn
                ,aimSn:aimSn
                ,facebookSn:facebookSn
                ,icqSn:icqSn
                ,jabberSn:jabberSn
                ,msnSn:msnSn
                ,mySpaceSn:mySpaceSn
                ,skypeSn:skypeSn
                ,twitterSn:twitterSn
                ,ymSn:ymSn
                ,jobTitle:jobTitle
                ,groupIds:groupIds
                ,organizationIds:organizationIds
                ,roleIds:roleIds
                ,userGroupRoles:userGroupRoles
                ,userGroupIds:userGroupIds
                ,serviceContext:serviceContext
            }]);
        };
        service.updateUser = function(userId,oldPassword,newPassword1,newPassword2,passwordReset,reminderQueryQuestion,reminderQueryAnswer,screenName,emailAddress,facebookId,openId,languageId,timeZoneId,greeting,comments,firstName,middleName,lastName,prefixId,suffixId,male,birthdayMonth,birthdayDay,birthdayYear,smsSn,aimSn,facebookSn,icqSn,jabberSn,msnSn,mySpaceSn,skypeSn,twitterSn,ymSn,jobTitle,groupIds,organizationIds,roleIds,userGroupRoles,userGroupIds,addresses,emailAddresses,phones,websites,announcementsDelivers,serviceContext) {
            return SessionService.invoke('/user/update-user',[{
                userId:userId
                ,oldPassword:oldPassword
                ,newPassword1:newPassword1
                ,newPassword2:newPassword2
                ,passwordReset:passwordReset
                ,reminderQueryQuestion:reminderQueryQuestion
                ,reminderQueryAnswer:reminderQueryAnswer
                ,screenName:screenName
                ,emailAddress:emailAddress
                ,facebookId:facebookId
                ,openId:openId
                ,languageId:languageId
                ,timeZoneId:timeZoneId
                ,greeting:greeting
                ,comments:comments
                ,firstName:firstName
                ,middleName:middleName
                ,lastName:lastName
                ,prefixId:prefixId
                ,suffixId:suffixId
                ,male:male
                ,birthdayMonth:birthdayMonth
                ,birthdayDay:birthdayDay
                ,birthdayYear:birthdayYear
                ,smsSn:smsSn
                ,aimSn:aimSn
                ,facebookSn:facebookSn
                ,icqSn:icqSn
                ,jabberSn:jabberSn
                ,msnSn:msnSn
                ,mySpaceSn:mySpaceSn
                ,skypeSn:skypeSn
                ,twitterSn:twitterSn
                ,ymSn:ymSn
                ,jobTitle:jobTitle
                ,groupIds:groupIds
                ,organizationIds:organizationIds
                ,roleIds:roleIds
                ,userGroupRoles:userGroupRoles
                ,userGroupIds:userGroupIds
                ,addresses:addresses
                ,emailAddresses:emailAddresses
                ,phones:phones
                ,websites:websites
                ,announcementsDelivers:announcementsDelivers
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('UsergroupService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addGroupUserGroups = function(groupId,userGroupIds) {
            return SessionService.invoke('/usergroup/add-group-user-groups',[{
                groupId:groupId
                ,userGroupIds:userGroupIds
            }]);
        };
        service.addTeamUserGroups = function(teamId,userGroupIds) {
            return SessionService.invoke('/usergroup/add-team-user-groups',[{
                teamId:teamId
                ,userGroupIds:userGroupIds
            }]);
        };
        service.addUserGroup = function(name,description) {
            return SessionService.invoke('/usergroup/add-user-group',[{
                name:name
                ,description:description
            }]);
        };
        service.addUserGroup = function(name,description,serviceContext) {
            return SessionService.invoke('/usergroup/add-user-group',[{
                name:name
                ,description:description
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteUserGroup = function(userGroupId) {
            return SessionService.invoke('/usergroup/delete-user-group',[{
                userGroupId:userGroupId
            }]);
        };
        service.getUserGroup = function(name) {
            return SessionService.invoke('/usergroup/get-user-group',[{
                name:name
            }]);
        };
        service.getUserGroup = function(userGroupId) {
            return SessionService.invoke('/usergroup/get-user-group',[{
                userGroupId:userGroupId
            }]);
        };
        service.getUserUserGroups = function(userId) {
            return SessionService.invoke('/usergroup/get-user-user-groups',[{
                userId:userId
            }]);
        };
        service.unsetGroupUserGroups = function(groupId,userGroupIds) {
            return SessionService.invoke('/usergroup/unset-group-user-groups',[{
                groupId:groupId
                ,userGroupIds:userGroupIds
            }]);
        };
        service.unsetTeamUserGroups = function(teamId,userGroupIds) {
            return SessionService.invoke('/usergroup/unset-team-user-groups',[{
                teamId:teamId
                ,userGroupIds:userGroupIds
            }]);
        };
        service.updateUserGroup = function(userGroupId,name,description) {
            return SessionService.invoke('/usergroup/update-user-group',[{
                userGroupId:userGroupId
                ,name:name
                ,description:description
            }]);
        };
        service.updateUserGroup = function(userGroupId,name,description,serviceContext) {
            return SessionService.invoke('/usergroup/update-user-group',[{
                userGroupId:userGroupId
                ,name:name
                ,description:description
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('UsergroupgrouproleService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addUserGroupGroupRoles = function(userGroupId,groupId,roleIds) {
            return SessionService.invoke('/usergroupgrouprole/add-user-group-group-roles',[{
                userGroupId:userGroupId
                ,groupId:groupId
                ,roleIds:roleIds
            }]);
        };
        service.addUserGroupGroupRoles = function(userGroupIds,groupId,roleId) {
            return SessionService.invoke('/usergroupgrouprole/add-user-group-group-roles',[{
                userGroupIds:userGroupIds
                ,groupId:groupId
                ,roleId:roleId
            }]);
        };
        service.deleteUserGroupGroupRoles = function(userGroupId,groupId,roleIds) {
            return SessionService.invoke('/usergroupgrouprole/delete-user-group-group-roles',[{
                userGroupId:userGroupId
                ,groupId:groupId
                ,roleIds:roleIds
            }]);
        };
        service.deleteUserGroupGroupRoles = function(userGroupIds,groupId,roleId) {
            return SessionService.invoke('/usergroupgrouprole/delete-user-group-group-roles',[{
                userGroupIds:userGroupIds
                ,groupId:groupId
                ,roleId:roleId
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('UsergrouproleService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addUserGroupRoles = function(userId,groupId,roleIds) {
            return SessionService.invoke('/usergrouprole/add-user-group-roles',[{
                userId:userId
                ,groupId:groupId
                ,roleIds:roleIds
            }]);
        };
        service.addUserGroupRoles = function(userIds,groupId,roleId) {
            return SessionService.invoke('/usergrouprole/add-user-group-roles',[{
                userIds:userIds
                ,groupId:groupId
                ,roleId:roleId
            }]);
        };
        service.deleteUserGroupRoles = function(userId,groupId,roleIds) {
            return SessionService.invoke('/usergrouprole/delete-user-group-roles',[{
                userId:userId
                ,groupId:groupId
                ,roleIds:roleIds
            }]);
        };
        service.deleteUserGroupRoles = function(userIds,groupId,roleId) {
            return SessionService.invoke('/usergrouprole/delete-user-group-roles',[{
                userIds:userIds
                ,groupId:groupId
                ,roleId:roleId
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('WebsiteService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addWebsite = function(className,classPK,url,typeId,primary) {
            return SessionService.invoke('/website/add-website',[{
                className:className
                ,classPK:classPK
                ,url:url
                ,typeId:typeId
                ,primary:primary
            }]);
        };
        service.addWebsite = function(className,classPK,url,typeId,primary,serviceContext) {
            return SessionService.invoke('/website/add-website',[{
                className:className
                ,classPK:classPK
                ,url:url
                ,typeId:typeId
                ,primary:primary
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteWebsite = function(websiteId) {
            return SessionService.invoke('/website/delete-website',[{
                websiteId:websiteId
            }]);
        };
        service.getWebsite = function(websiteId) {
            return SessionService.invoke('/website/get-website',[{
                websiteId:websiteId
            }]);
        };
        service.getWebsites = function(className,classPK) {
            return SessionService.invoke('/website/get-websites',[{
                className:className
                ,classPK:classPK
            }]);
        };
        service.updateWebsite = function(websiteId,url,typeId,primary) {
            return SessionService.invoke('/website/update-website',[{
                websiteId:websiteId
                ,url:url
                ,typeId:typeId
                ,primary:primary
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
(function() {
    'use strict';
    angular
    .module('mobile.sdk.v62')
    .factory('WikinodeService', ['SessionService', function (SessionService) {
        var service = {};
        // Begin generated service methods
        service.addNode = function(name,description,serviceContext) {
            return SessionService.invoke('/wikinode/add-node',[{
                name:name
                ,description:description
                ,serviceContext:serviceContext
            }]);
        };
        service.deleteNode = function(nodeId) {
            return SessionService.invoke('/wikinode/delete-node',[{
                nodeId:nodeId
            }]);
        };
        service.getNode = function(nodeId) {
            return SessionService.invoke('/wikinode/get-node',[{
                nodeId:nodeId
            }]);
        };
        service.getNode = function(groupId,name) {
            return SessionService.invoke('/wikinode/get-node',[{
                groupId:groupId
                ,name:name
            }]);
        };
        service.getNodes = function(groupId) {
            return SessionService.invoke('/wikinode/get-nodes',[{
                groupId:groupId
            }]);
        };
        service.getNodes = function(groupId,status) {
            return SessionService.invoke('/wikinode/get-nodes',[{
                groupId:groupId
                ,status:status
            }]);
        };
        service.getNodes = function(groupId,start,end) {
            return SessionService.invoke('/wikinode/get-nodes',[{
                groupId:groupId
                ,start:start
                ,end:end
            }]);
        };
        service.getNodes = function(groupId,status,start,end) {
            return SessionService.invoke('/wikinode/get-nodes',[{
                groupId:groupId
                ,status:status
                ,start:start
                ,end:end
            }]);
        };
        service.getNodesCount = function(groupId) {
            return SessionService.invoke('/wikinode/get-nodes-count',[{
                groupId:groupId
            }]);
        };
        service.getNodesCount = function(groupId,status) {
            return SessionService.invoke('/wikinode/get-nodes-count',[{
                groupId:groupId
                ,status:status
            }]);
        };
        service.moveNodeToTrash = function(nodeId) {
            return SessionService.invoke('/wikinode/move-node-to-trash',[{
                nodeId:nodeId
            }]);
        };
        service.restoreNodeFromTrash = function(nodeId) {
            return SessionService.invoke('/wikinode/restore-node-from-trash',[{
                nodeId:nodeId
            }]);
        };
        service.subscribeNode = function(nodeId) {
            return SessionService.invoke('/wikinode/subscribe-node',[{
                nodeId:nodeId
            }]);
        };
        service.unsubscribeNode = function(nodeId) {
            return SessionService.invoke('/wikinode/unsubscribe-node',[{
                nodeId:nodeId
            }]);
        };
        service.updateNode = function(nodeId,name,description,serviceContext) {
            return SessionService.invoke('/wikinode/update-node',[{
                nodeId:nodeId
                ,name:name
                ,description:description
                ,serviceContext:serviceContext
            }]);
        };
        
        // End generated service methods
        return service;
    }])
})();
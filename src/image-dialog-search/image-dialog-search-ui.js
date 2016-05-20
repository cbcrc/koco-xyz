define([
        'text!./image-dialog-search.html',
        'knockout',
        'jquery',
        './last-search-snapshot',
        'moment',
        'content-dialog-search-base-viewmodel',
        'lodash',
        'signal-emitter',
        'i18next'
    ],
    function(template, ko, $, lastSearchSnapshot,
        moment, ContentDialogSearchViewModel, _, signalEmitter, i18n) {
        'use strict';

        var defaultSearchFields = {
            startDate: null,
            endDate: null,
            keywords: '',
            myImages: false,
            codeZones: [],
            contentTypeId: 19,
            directoryCodeName: null,
            subDirectoryCodeName: null
        };

        // default values here are based on what was available
        // during development of Tango, pass in values appropriate
        // to your usage in params.imageSourceConfig
        var defaultImageContentTypes = [{
            name: 'Picto',
            id: 19,
            apiResourceName: 'images',
            configurationApiResourceName: 'images/configuration'
        }, {
            name: 'GHT1T',
            id: 20,
            apiResourceName: 'images/ght1t',
            configurationApiResourceName: 'zones-for-images'
        }];

        var ImageDialogSearchViewModel = function(params /*, componentInfo*/ ) {
            var self = this;

            self.zones = ko.observableArray();
            self.cloudinaryDirectories = ko.observableArray();
            self.cloudinarySubDirectories = ko.observableArray();
            self.settings = params || {};
            self.api = self.settings.api;
            
            // merge user-supplied config if present
            self.allImageContentTypes = defaultImageContentTypes;
            if (!_.isUndefined(params.imageSourceConfig)) {
                if (_.has(params.imageSourceConfig, 'picto')) {
                    var pictoConfig = _.find(self.allImageContentTypes, { id: 19 });
                    $.extend(pictoConfig, params.imageSourceConfig['picto']);
                }
                if (_.has(params.imageSourceConfig, 'ght1t')) {
                    var ght1tConfig = _.find(self.allImageContentTypes, { id: 20 });
                    $.extend(ght1tConfig, params.imageSourceConfig['ght1t']);
                }
            }

            self.translated = {
                dateInterval: i18n.t('koco-image-dialogs.date-interval'),
                defaultTitle: i18n.t('koco-image-dialogs.notitle'),
                myImages: i18n.t('koco-image-dialogs.image-search-results-default-title'),
                allDirectoriesPlaceholder: i18n.t('koco-image-dialogs.image-search-placeholder-all-directories'),
                allSubDirectoriesPlaceholder: i18n.t('koco-image-dialogs.image-search-placeholder-all-subdirectories'),
                keywordsPlaceholder: i18n.t('koco-image-dialogs.image-search-placeholder-keywords'),
                zonePlaceholder: i18n.t('koco-image-dialogs.image-search-placeholder-zone')
            };

            self.apiResourceName = ko.pureComputed(function() {
                var resourceName = _.find(self.allImageContentTypes, { id: self.searchFields.contentTypeId() }).apiResourceName;
                return !_.isUndefined(resourceName) ? resourceName : '';
            });

            self.contentTypes = _.filter(self.allImageContentTypes, function(contentType) {
                return _.any(self.settings.contentTypeIds, function(contentTypeId) {
                    return contentType.id === contentTypeId;
                });
            });

            var contentDialogSearchViewModelParams = {
                defaultSearchFields: defaultSearchFields,
                isSame: params.isSame,
                selected: params.selected,
                searchOnDisplay: params.searchOnDisplay,
                api: self.api,
                apiResourceName: self.apiResourceName,
                lastSearchSnapshot: lastSearchSnapshot
            };

            ContentDialogSearchViewModel.call(self, contentDialogSearchViewModelParams);

            self.koDisposer.add(self.apiResourceName);

            self.onImageRemoved = function(idAsUrl) {
                self.items.remove(function(item){
                    return item.idAsUrl === idAsUrl;
                });
            };

            signalEmitter.addListener('image:removed', self.onImageRemoved);

            self.activate();
        };

        ImageDialogSearchViewModel.prototype = Object.create(ContentDialogSearchViewModel.prototype);
        ImageDialogSearchViewModel.prototype.constructor = ImageDialogSearchViewModel;

        ImageDialogSearchViewModel.prototype.getSearchArgumentsFromFields = function() {
            var self = this;

            //TODO: simplify this function

            var searchArguments = {
                zoneIds: self.searchFields.codeZones()
            };

            if (self.settings.dimensions) {
                searchArguments.dimensions = encodeURIComponent(JSON.stringify(self.settings.dimensions));
            }

            if (self.searchFields.startDate()) {
                searchArguments.startDate = self.searchFields.startDate();
            }

            if (self.searchFields.endDate()) {
                searchArguments.endDate = self.searchFields.endDate();
            }

            //todo: on devrait permettre de spécifier l'auteur plutôt que seulement 'mes images'
            if (self.searchFields.myImages()) {
                searchArguments.createdBy = self.api.user().userName;
            }

            if (self.searchFields.keywords()) {
                searchArguments.keywords = self.searchFields.keywords();
            }

            if (self.searchFields.directoryCodeName()) {
                searchArguments.directoryCodeName = self.searchFields.directoryCodeName();
            }

            if (self.searchFields.subDirectoryCodeName()) {
                searchArguments.subDirectoryCodeName = self.searchFields.subDirectoryCodeName();
            }

            return searchArguments;
        };

        ImageDialogSearchViewModel.prototype.loadLookups = function() {
            var self = this;
            
            var contentTypesInUse = self.settings.contentTypeIds;
            var pictoInUse = _.contains(contentTypesInUse, 19);
            var ght1tInUse = _.contains(contentTypesInUse, 20);
            
            var doPictoLookups = function () {
                var configurationApiResourceName = _.find(self.allImageContentTypes, { id : 19 }).configurationApiResourceName;
                return self.api.getJson(configurationApiResourceName, {
                    success: function(cloudinaryLookups) {
                        self.cloudinaryDirectories(cloudinaryLookups.directoryCodeNames);
                        self.cloudinarySubDirectories(cloudinaryLookups.subDirectoryCodeNames);
                    }
                });
            }
            
            var doGht1tLookups = function () {
                var configurationApiResourceName = _.find(self.allImageContentTypes, { id : 20 }).configurationApiResourceName;
                return self.api.getJson(configurationApiResourceName, {
                    success: function(zonesLookups) {
                        self.zones(zonesLookups);
                    }
                });
            }
            
            // either do the lookup for the respective source, or 'false' which will fulfill
            // that segment of the promise
            return $.when(ght1tInUse ? doGht1tLookups.call(self) : false, pictoInUse ? doPictoLookups.call(self) : false);
        };

        ImageDialogSearchViewModel.prototype.correctLastSearchSnapshot = function(lastSearchSnapshot) {
            var self = this;

            if (lastSearchSnapshot.searchFields) {
                var searchFieldsContentTypeId = lastSearchSnapshot.searchFields.contentTypeId;

                if (!searchFieldsContentTypeId || !_.any(self.contentTypes, function(contentType) {
                        return contentType.id === searchFieldsContentTypeId;
                    })) {
                    lastSearchSnapshot.searchFields.contentTypeId = self.contentTypes[0].id;
                }
            }

            return lastSearchSnapshot;
        };

        ImageDialogSearchViewModel.prototype.dispose = function() {
            var self = this;

            ContentDialogSearchViewModel.prototype.dispose.call(self);

            signalEmitter.removeListener('image:removed', self.onImageRemoved);
        };

        return {
            viewModel: {
                createViewModel: function(params, componentInfo) {
                    return new ImageDialogSearchViewModel(params, componentInfo);
                }
            },
            template: template
        };
    });

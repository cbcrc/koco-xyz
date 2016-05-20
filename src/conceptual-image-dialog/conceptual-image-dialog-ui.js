define([
        'text!./conceptual-image-dialog.html',
        'knockout',
        'jquery',
        '../image-dialog-ui-base',
        'content-dialog-base-viewmodel',
        'array-utilities',
        'mapping-utilities',
        'i18next'
    ],
    function(template, ko, $, ImageDialogBaseViewModel, ContentDialogViewModel, arrayUtilities, koMappingUtilities, i18n) {
        'use strict';

        var defaultContentTypeId = '20';

        var defaultItem = {
            id: null,
            alt: '',
            title: '',
            legend: '',
            imageCredits: '',
            pressAgency: '',
            imageCollection: '',
            concreteImages: [],
            contentTypeId: defaultContentTypeId
        };

        var ConceptualImageDialogViewModel = function(settings /*, componentInfo*/ ) {
            var self = this;

            self.params = self.getParams(settings);
            
            self.translated = {
                dialogTitle: i18n.t('koco-image-dialogs.dialog-title'),
                dialogCancel: i18n.t('koco-image-dialogs.dialog-cancel'),
                dialogSave: i18n.t('koco-image-dialogs.dialog-save'),
            };

            var originalItem = null;

            var conceptualImage = koMappingUtilities.toJS(settings.params.conceptualImage);
            if (conceptualImage && arrayUtilities.isNotEmptyArray(conceptualImage.concreteImages)) {
                //TODO: Est-ce que le extend defaultItem est nécessaire!?
                originalItem = $.extend({}, defaultItem, conceptualImage);
            }

            var contentDialogViewModelParams = {
                originalItem: originalItem,
                defaultItem: defaultItem,
                close: settings.close,
                isSearchable: true,
                api: self.params.api
            };

            ContentDialogViewModel.call(self, contentDialogViewModelParams);

            self.canDeleteImage = ko.pureComputed(self.canDeleteImage.bind(self));
            self.koDisposer.add(self.canDeleteImage);

            self.activate();
        };

        ConceptualImageDialogViewModel.prototype = Object.create(ImageDialogBaseViewModel.prototype);
        ConceptualImageDialogViewModel.prototype.constructor = ConceptualImageDialogViewModel;

        return {
            viewModel: {
                createViewModel: function(params, componentInfo) {
                    return new ConceptualImageDialogViewModel(params, componentInfo);
                }
            },
            template: template
        };
    });

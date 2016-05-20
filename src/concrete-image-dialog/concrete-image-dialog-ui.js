//Ce dialog est destiné à fonctionner avec tiny-mce
//il ne recoit pas en input un conceptual-image, ni un concrete-image
//il recoit l'url de l'image et fait un appel à l'api pour obtenir l'information nécessaire
//en ce sens, il devrait peut-être être renommé (on pourrait éventullement avoir un vrai concrete-image-dialog)

define([
        'text!./concrete-image-dialog.html',
        'knockout',
        'jquery',
        '../image-dialog-ui-base',
        'content-dialog-base-viewmodel',
        'mapping-utilities',
        'signal-emitter',
        'i18next'
    ],
    function(template, ko, $, ImageDialogBaseViewModel,
        ContentDialogViewModel, koMappingUtilities, emitter, i18n) {
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

        var ConcreteImageDialogViewModel = function(settings /*, componentInfo*/ ) {
            var self = this;

            self.params = self.getParams(settings);
            self.api = self.params.api;
            self.i18n = i18n;

            var contentDialogViewModelParams = {
                dialogTitle: 'Images',
                originalItem: ko.observable(),
                defaultItem: defaultItem,
                close: settings.close,
                isSearchable: true,
                api: self.api,
            };
            
            self.translated = {
                closeLabel: self.i18n.t('koco-image-dialogs.dialog-cancel'),
                saveLabel: self.i18n.t('koco-image-dialogs.dialog-save'),
                altLabel: self.i18n.t('koco-image-dialogs.concrete-dialog-edit-label-alt'),
                legendLabel: self.i18n.t('koco-image-dialogs.concrete-dialog-edit-label-legend'),
                creditsLabel: self.i18n.t('koco-image-dialogs.concrete-dialog-edit-label-credits'),
                agencyLabel: self.i18n.t('koco-image-dialogs.concrete-dialog-edit-label-agency'),
                alignmentLabel: self.i18n.t('koco-image-dialogs.concrete-dialog-edit-label-alignment'),
                leftLabel: self.i18n.t('koco-image-dialogs.concrete-dialog-edit-label-left'),
                centreLabel: self.i18n.t('koco-image-dialogs.concrete-dialog-edit-label-center'),
                rightLabel: self.i18n.t('koco-image-dialogs.concrete-dialog-edit-label-right')
            }

            ContentDialogViewModel.call(self, contentDialogViewModelParams);

            self.canDeleteImage = ko.pureComputed(self.canDeleteImage.bind(self));
            self.koDisposer.add(self.canDeleteImage);

            var align = 'left';

            if (self.params && self.params.align) {
                align = self.params.align;
            }

            self.align = ko.observable(align);
            self.imageForLineups = ko.observable(false);
            self.selectedConcreteImage = ko.observable();

            self.isCloudinary = ko.pureComputed(self.getIsCloudinary.bind(self));
            self.koDisposer.add(self.isCloudinary);

            self.activate();
        };

        ConcreteImageDialogViewModel.prototype = Object.create(ImageDialogBaseViewModel.prototype);
        ConcreteImageDialogViewModel.prototype.constructor = ConcreteImageDialogViewModel;

        ConcreteImageDialogViewModel.prototype.start = function() {
            var self = this;

            var concreteImageUrl = ko.unwrap(self.params.concreteImageUrl);

            if (concreteImageUrl) {
                return self.api.getJson('images/selected', {
                    data: $.param({
                        url: concreteImageUrl
                    }, true),
                    success: function(conceptualImageWithSelectedImage) {
                        if (conceptualImageWithSelectedImage && conceptualImageWithSelectedImage.conceptualImage) {
                            var originalItem = conceptualImageWithSelectedImage.conceptualImage;

                            if (self.params.alt) {
                                originalItem.alt = self.params.alt;
                            }

                            if (self.params.legend) {
                                originalItem.legend = self.params.legend;
                            }

                            if (self.params.pressAgency) {
                                originalItem.pressAgency = self.params.pressAgency;
                            }

                            if (self.params.imageCredits) {
                                originalItem.imageCredits = self.params.imageCredits;
                            }

                            self.selectedConcreteImage(conceptualImageWithSelectedImage.selectedImage);
                            self.originalItem(originalItem);
                            self.selectItem(originalItem);
                        } else {
                            self.selectItem(null);
                        }
                    }
                });
            } else {
                self.selectItem(null);
            }
        };

        ConcreteImageDialogViewModel.prototype.selectItem = function(inputModel) {
            var self = this;

            self.selectedConcreteImage(null);
            ImageDialogBaseViewModel.prototype.selectItem.call(self, inputModel);
        };

        ConcreteImageDialogViewModel.prototype.getSearchOnDisplay = function() {
            var self = this;

            return !ko.unwrap(self.params.concreteImageUrl);
        };

        ConcreteImageDialogViewModel.prototype.toOutputModel = function() {
            var self = this;

            var conceptualImage = ContentDialogViewModel.prototype.toOutputModel.call(self);
            var concreteImage = koMappingUtilities.toJS(self.selectedConcreteImage);

            if (self.imageForLineups()) {
                emitter.dispatch('image:imageForLineups', [conceptualImage]);
            }

            return {
                conceptualImage: conceptualImage,
                concreteImage: concreteImage,
                align: self.align()
            };
        };

        ConcreteImageDialogViewModel.prototype.validate = function() {
            var self = this;

            if (!self.selectedConcreteImage()) {
                return self.i18n.t('koco-image-dialogs.concrete-image-dialog-select-image-format');
            }

            ContentDialogViewModel.prototype.validate.call(self);
        };

        return {
            viewModel: {
                createViewModel: function(params, componentInfo) {
                    return new ConcreteImageDialogViewModel(params, componentInfo);
                }
            },
            template: template
        };
    });

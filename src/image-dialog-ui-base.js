//Notes: Ce plugin recoit un Media et retourne un Media (voir Scoop API)

define([
        'knockout',
        'jquery',
        'content-dialog-base-viewmodel',
        'toastr',
        'lodash',
        'router',
        'mapping-utilities',
        'modaler',
        'signal-emitter'
    ],
    function(ko, $,
        ContentDialogViewModel,
        toastr, _, router, koMappingUtilities, modaler, signalEmitter) {
        'use strict';

        var defaultParams = {
            dimensions: [],
            contentTypeIds: [20]
        };

        var ImageDialogBaseViewModel = function() {};

        ImageDialogBaseViewModel.prototype = Object.create(ContentDialogViewModel.prototype);
        ImageDialogBaseViewModel.prototype.constructor = ImageDialogBaseViewModel;

        ImageDialogBaseViewModel.prototype.getHasSelectedItem = function() {
            var self = this;

            var selectedItem = koMappingUtilities.toJS(self.selectedItem);

            return selectedItem && selectedItem.idAsUrl;
        };

        ImageDialogBaseViewModel.prototype.getIsCloudinary = function() {
            var self = this;

            var selectedItem = koMappingUtilities.toJS(self.selectedItem);

            if (selectedItem && selectedItem.contentType && selectedItem.contentType.id === 19) {
                return true;
            }

            return false;
        };

        ImageDialogBaseViewModel.prototype.getParams = function(settings) {
            var self = this;

            var params = $.extend({}, defaultParams, settings.params.settings);

            if (router.context().route.url.indexOf('mu-contents') > -1) {
                params.contentTypeIds = [19, 20];
            }

            return params;
        };

        ImageDialogBaseViewModel.prototype.canDeleteImage = function() {
            var self = this;

            var resource = koMappingUtilities.toJS(self.selectedItem);

            if (resource && resource.contentType && resource.contentType.id === 20 && resource.idAsUrl) {
                return true;
            }

            return false;
        };

        ImageDialogBaseViewModel.prototype.isSame = function(item) {
            var self = this;

            var selectedItem = koMappingUtilities.toJS(self.selectedItem);

            return selectedItem && item && selectedItem.idAsUrl === item.idAsUrl;
        };

        ImageDialogBaseViewModel.prototype.deleteImage = function() {
            var self = this;

            var resource = this.selectedItem();
            if (typeof resource === 'undefined' || resource === null) {
                toastr.error('Vous devez sélectionner une image.');
                return false;
            }

            modaler.show('confirm', {
                message: 'Attention, vous vous apprêtez à supprimer cette image de la banque d\'images (GHT1T). Voulez-vous réellement supprimer cette image?'
            }).then(function(confirm) {
                if (confirm) {

                    var idAsUrl = resource.idAsUrl();
                    
                    // @TODO test this more thoroughly, we are relying on the remove binding to provide a context that owns self.api
                    self.api.delete(_.template('images?url=<%= id %>')({
                            id: idAsUrl
                        }))
                    .done(function() {
                        signalEmitter.dispatch('image:removed', [idAsUrl]);
                        self.selectedItem(null);
                        toastr.info('L\'image a été supprimée.');
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        toastr.error('Impossible de supprimer l\'image.');
                    });
                }
            });
        };

        return ImageDialogBaseViewModel;
    });

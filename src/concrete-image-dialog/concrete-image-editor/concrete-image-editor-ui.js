define(['text!./concrete-image-editor.html', 'knockout', 'jquery', 'lodash',
    'image-utilities', 'mapping-utilities', 'disposer'],
    function(template, ko, $, _, imageUtilities, koMappingUtilities, KoDisposer) {
        'use strict';

        /*
        args :
            {
                conceptualImage: observable conceptualImage
                concreteImage: observable concreteImage,
                dimensionRatios: ['16:9','4:3'] limiter pour les nouvelles
            }
        */

        var ConcreteImagesPickerViewModel = function(params, componentInfo) {
            var self = this;

            self.params = params;

            var selectedImage = koMappingUtilities.toJS(self.params.selectedImage);
            var selectedConcreteImage = koMappingUtilities.toJS(self.params.selectedConcreteImage);

            var options = buildOptions(selectedImage);

            self.options = ko.observableArray(options);

            if (!selectedConcreteImage) {
                //Attention: 2 type de DefaultConcreteImage (1 pour les previews de scoop et celui ci pour le default concrete image...)
                //en ce moment on est chanceux, c'est la meme taille qui est utilisée par défaut mais il faudra ajuster si ca change
                selectedConcreteImage = imageUtilities.getDefaultConcreteImage(selectedImage);
            }

            var selectedOption = getConcreteImageHref(selectedConcreteImage);

            self.selectedOption = ko.observable(selectedOption);

            self.params.selectedConcreteImage(selectedConcreteImage);

            self.koDisposer = new KoDisposer();

            self.koDisposer.add(self.selectedOption.subscribe(function(newValue) {
                selectedOption = newValue;
                var concreteImage = null;

                if (selectedOption) {
                    concreteImage = _.find(selectedImage.concreteImages, function(c) {
                        return c.mediaLink.href == selectedOption;
                    });
                }

                self.params.selectedConcreteImage(concreteImage || null);
            }));

            self.koDisposer.add(self.params.$raw.selectedImage.subscribe(function() {
                selectedImage = koMappingUtilities.toJS(self.params.selectedImage);
                options = buildOptions(selectedImage);
                self.options(options);
                selectedConcreteImage = imageUtilities.getDefaultConcreteImage(selectedImage);
                selectedOption = getConcreteImageHref(selectedConcreteImage);
                self.selectedOption(selectedOption);
                self.params.selectedConcreteImage(selectedConcreteImage);
            }));
        };

        ConcreteImagesPickerViewModel.prototype.dispose = function() {
            var self = this;

            self.koDisposer.dispose();
        };

        function getConcreteImageHref(selectedConcreteImage) {
            var selectedOption = '';

            if (selectedConcreteImage && selectedConcreteImage.mediaLink && selectedConcreteImage.mediaLink.href) {
                selectedOption = selectedConcreteImage.mediaLink.href;
            }

            return selectedOption;
        }

        function buildOptions(selectedImage) {
            var options = [];

            if (selectedImage && selectedImage.concreteImages && selectedImage.concreteImages.length) {
                for (var i = 0; i < selectedImage.concreteImages.length; i++) {
                    var concreteImage = selectedImage.concreteImages[i];

                    var group = _.find(options, function(g) {
                        return g.ratio === concreteImage.dimensionRatio;
                    });

                    if (!group) {
                        var ratio = 'ratio inconnu';

                        if (concreteImage.dimensionRatio && concreteImage.dimensionRatio != 'unknown') {
                            ratio = concreteImage.dimensionRatio;
                        }

                        group = new Group(ratio, []);
                        options.push(group);
                    }

                    group.dimensions.push(new Option(concreteImage));
                }
            }

            return options;
        }

        function Group(ratio, dimensions) {
            this.ratio = ratio;
            this.dimensions = dimensions;
        }

        function Option(concreteImage) {
            if (concreteImage.width && concreteImage.height) {
                this.name = concreteImage.width + 'x' + concreteImage.height;
            } else {
                this.name = 'dimension inconnue';
            }

            this.id = concreteImage.mediaLink.href;
        }

        return {
            viewModel: {
                createViewModel: function(params, componentInfo) {
                    return new ConcreteImagesPickerViewModel(params, componentInfo);
                }
            },
            template: template
        };
    });

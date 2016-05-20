# koco-image-dialogs

Koco component containing a few different dialogs for displaying, choosing, and editing images provided in the Scoop media idiom. This format describes two types of things, "conceptual images" and "concrete images." As their names suggest, a conceptual image is a container for metadata about an image, while concrete images are children of conceptual images, and describe well-defined manifestations of the conceptual image --a 1x1 crop, for example.

Out of the box this component works with content from GHT1T and Picto. Here's an example of some data for a single 'conceptual' image:

```json
{
    "alt": "569717",
    "concreteImages": [
        {
            "dimensionRatio": "16:9",
            "height": 36,
            "mediaLink": {
                "href": "http://img.src.ca/2015/06/23/64x36/150623_69ca3_569717_1.jpg"
            },
            "width": 64
        },
        {
            "dimensionRatio": "16:9",
            "height": 55,
            "mediaLink": {
                "href": "http://img.src.ca/2015/06/23/98x55/150623_69ca3_569717_sn98.jpg"
            },
            "width": 98
        },
        ...
    ],
    "contentType": {
        "contentTypeGroups": [
            {
                "id": 3,
                "name": "Image conceptuelle"
            },
            {
                "id": 5,
                "name": "Contenu multimedia"
            },
            {
                "id": 6,
                "name": "Image index\u00e9e"
            }
        ],
        "id": 20,
        "name": "Image (Ght1t)"
    },
    "contentTypeDisplayName": "Image (Ght1t)",
    "dtoName": "ConceptualImage",
    "id": "150623_69ca3_569717",
    "idAsUrl": "http://img.src.ca/2015/06/23/64x36/150623_69ca3_569717_1.jpg",
    "imageCollection": null,
    "imageCredits": null,
    "legend": null,
    "pressAgencies": [],
    "pressAgency": null,
    "title": "150623_69ca3_569717"
}
```

As mentioned above, these dialogs are intended for use only with Picto and GHT1T. 'image-dialog-search' has default values for these image sources that are based on what was used during the project for which this component was extracted. But yours are likely to differ, and so can be overridden by passing an imageSourcesConfig param to koco-image-picker, which will in turn pass it down to the search and edit dialogs. The format for that looks like this...

```javascript
{
    'picto': {
        apiResourceName: 'images',
        configurationApiResourceName: 'images/configuration'
    },
    'ght1t': {
        apiResourceName: 'images/ght1t',
        configurationApiResourceName: 'zones-for-images'
    }
};
```


## Installation

```bash
bower install koco-image-dialogs
```


## Usage with KOCO

This is a shared module that is mostly used in conjunction with other modules related to koco-conceptual-image-picker. There's a lot to register in your components.js, though feel free to pull in only what you need!

```javascript
Components.prototype.registerComponents = function() {
    ...
    // image picker dialogs
    dialoger.registerDialog('content');
    dialoger.registerDialog('conceptual-image', {
        basePath: 'bower_components/koco-image-dialogs/src/conceptual-image-dialog'
    });
    dialoger.registerDialog('concrete-image', {
        basePath: 'bower_components/koco-image-dialogs/src/concrete-image-dialog'
    });
    koUtilities.registerComponent('cloudinary-image-editor', {
        basePath: 'bower_components/koco-image-dialogs/src/concrete-image-dialog/cloudinary-image-editor'
    });
    koUtilities.registerComponent('concrete-image-editor', {
        basePath: 'bower_components/koco-image-dialogs/src/concrete-image-dialog/concrete-image-editor'
    });
    ...
};
```

And if you plan to use it, include the concrete image dialog's less file...

`@import "../bower_components/koco-image-dialogs/src/concrete-image-dialog/concrete-image-dialog.less";`
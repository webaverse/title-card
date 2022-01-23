# title-card
![](https://i.imgur.com/ztJy865.png)

## How to load?
To load the title card the postPostProcessScene needs to be enabled in rendersettings first with the orthographic scene set to true.
```
{
  "type": "application/rendersettings",
  "content": {
    "postPostProcessScene": {
      "postPerspectiveScene": false,
      "postOrthographicScene": true
    }
  }
}
```
Then title card information should be added to `.scn` file in the following manner:
```
{
  "start_url": "https://webaverse.github.io/title-card/",
  "loadPriority": -1,
  "components": [
    {
      "key": "boxHelper",
      "value": true
    },
    {
      "key": "renderPriority",
      "value": "postOrthographicScene"
    },
    {
      "key": "zones",
      "value": [
        {
          "backgroundColor": "0xff0000"
        },
        {
          "heading": "STREET",
          "subHeading": "UPTOWN",
          "text": "PART 1",
          "textColor": "0xffffff",
          "primaryColor1": "0x00ff00",
          "primaryColor2": "0xffff00",
          "primaryColor3": "0x00ff00",
          "arrowColor": "0x404040",
          "dimensions": [[-5, 0, 10], [-1, 3, 13]]
        }
      ]
    }
  ]
}
```

## loadPriority
The loadPrioirty should be set to the lowest value so it gets loaded before all other apps in the case of a global title card on scene loading.

## boxHelper
The box helper if set to true will create a box according to defined dimensions of a zone for testing purposes.
![](https://i.imgur.com/pClF38c.png)

## renderPriority
It should be set to postOrthographicScene so the title card app is added to the right scene.

## zones
* It is a list of all the zones with important properties exposed to make the title card look according to the user's will.
* The zones can be added as much as the user wants.
* If a specific property is not provided, the default value will be applied as a placeholder.
* If dimensions are not provided, the zone will be treated as a global zone which will be shown at the time of scene loading with an opaque background. The color of that background can be passed as a zone property. `"backgroundColor": "0xff0000"`

## Text
Text rendered in title card is a separate [app](https://github.com/webaverse/title-card-text).

import * as THREE from 'three';
// import {preloadFont} from 'troika-three-text'
import metaversefile from 'metaversefile';
const { useApp, useScene, usePostOrthographicScene, getNextInstanceId, useCleanup, useFrame, useLocalPlayer, isSceneLoaded } = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, "$1");

let _update = null;

let app = null;
let eyeblasterApp = null;
let textApp = null;
let subApps = [null, null];
/* let zones = null;
let globalCard = null;
let globalCardIndex = -1;
let globalProps = null;

let boxes = [];
let boxHelpers = [];
let shownOnce = [];
let hasBg = [];
let added = [];

let appsLoaded = false; */

class Zone {
  constructor({
    boundingBox,
    heading,
    subHeading,
    text,
    textColor,
    primaryColor1,
    primaryColor2,
    primaryColor3,
    arrowColor,
    headingBgWidth,
    subHeadingBgWidth,
    animationTime,
  }) {
    this.boundingBox = boundingBox;
    this.heading = heading;
    this.subHeading = subHeading;
    this.text = text;
    this.textColor = textColor;
    this.primaryColor1 = primaryColor1;
    this.primaryColor2 = primaryColor2;
    this.primaryColor3 = primaryColor3;
    this.arrowColor = arrowColor;
    this.headingBgWidth = headingBgWidth;
    this.subHeadingBgWidth = subHeadingBgWidth;
    this.animationTime = animationTime;
  }
}

export default e => {
  app = useApp();
  const postSceneOrthographic = usePostOrthographicScene();
  const scene = useScene();
  const localPlayer = useLocalPlayer();
  app.name = 'title-card';

  const showBoxHelper = app.getComponent('boxHelper');
  
  e.waitUntil((async () => {
    /* {
      const promise = new Promise(function(resolve, reject) {
        preloadFont(
          {
            font: './fonts/Plaza Regular.ttf',
            characters: [],
          },
          () => {
            resolve();
          },
        );
      })

      await promise;
    } */

    let appsLoaded = false;
    const promises = [];
    promises.push((async () => {
      let u2 = `../title-card/eyeblaster.gltj`;
      if (/^https?:/.test(u2)) {
        u2 = "/@proxy/" + u2;
      }

      const m = await metaversefile.import(u2);

      eyeblasterApp = metaversefile.createApp();

      eyeblasterApp.contentId = u2;
      eyeblasterApp.instanceId = getNextInstanceId();
      eyeblasterApp.position.copy(app.position);
      eyeblasterApp.quaternion.copy(app.quaternion);
      eyeblasterApp.scale.copy(app.scale);
      eyeblasterApp.updateMatrixWorld();
      eyeblasterApp.name = "eyeblaster";

      subApps[1] = eyeblasterApp;

      await eyeblasterApp.addModule(m);
    })());
    promises.push((async () => {
      let u2 = `../title-card-text/`;
      if (/^https?:/.test(u2)) {
        u2 = "/@proxy/" + u2;
      }

      const m = await metaversefile.import(u2);

      textApp = metaversefile.createApp();

      textApp.contentId = u2;
      textApp.instanceId = getNextInstanceId();
      textApp.position.copy(app.position);
      textApp.quaternion.copy(app.quaternion);
      textApp.scale.copy(app.scale);
      textApp.updateMatrixWorld();
      textApp.name = "text";

      subApps[0] = textApp;

      await textApp.addModule(m);
    })());
    await Promise.all(promises);
    
    app.add(eyeblasterApp);
    app.add(textApp);
    
    appsLoaded = true;
    // app.visible = false;
  })());

  const boxHelpers = [];
  const zones = (app.getComponent('zones') ?? []).map(zoneSpec => {
    const {
      heading,
      subHeading,
      text,
      textColor,
      primaryColor1,
      primaryColor2,
      primaryColor3,
      arrowColor,
      headingBgWidth,
      subHeadingBgWidth,
      animationTime,
      dimensions,
    } = zoneSpec;
    
    const boundingBox = dimensions ? new THREE.Box3(
      new THREE.Vector3().fromArray(dimensions[0]), 
      new THREE.Vector3().fromArray(dimensions[1])
    ) : new THREE.Box3(
      new THREE.Vector3(-Infinity, -Infinity, -Infinity), 
      new THREE.Vector3(Infinity, Infinity, Infinity)
    );
    const zone = new Zone({
      boundingBox,
      heading,
      subHeading,
      text,
      textColor,
      primaryColor1,
      primaryColor2,
      primaryColor3,
      arrowColor,
      headingBgWidth,
      subHeadingBgWidth,
      animationTime,
    });
    if (showBoxHelper) {
      const boxHelper = new THREE.Box3Helper(boundingBox, 0x00ff00);
      boxHelper.updateMatrixWorld(true);
      scene.add(boxHelper);
      boxHelpers.push(boxHelper);
    }      
    return zone;
  });
  
  let lastZone = null;
  _update = (timestamp, timeDiff) => {
    if (showOnStart && !addedGlobal && appsLoaded) {
      startTime = timestamp;
      globalCard = zones.splice(globalCardIndex, 1)[0];
      updateProps(globalCard);
      startAnim();
      showOnStart = false;
      addedGlobal = true;
    } else if (addedGlobal && isSceneLoaded()) {
      addedGlobal = false;
      startTime = timestamp;
      reverseAnim();
      setTimeout(()=>{
        endAnim();
      }, ((globalCard.animationTime ?? 6.0)/2.0) * 1000.0);
    }
    
    for(let i=0; i<boxes.length; i++) {
      let animTime = (zones[i].animationTime || globalProps.animationTime) ?? 6.0;
      if(boxes[i].containsPoint(localPlayer.position)) {
        if(!added[i] && !shownOnce[i]) {
          startTime = timestamp;
          startAnim(i);
        }
        else if(timestamp - startTime >= (animTime/2.0) * 1000.0 && added[i]) {
          if(!reverse) {
            startTime = timestamp;
            reverseAnim();
            reverse = true;
          }
          else {
            endAnim(i);
            reverse = false
          }
        }
      } else {
        if(timestamp - startTime >= (animTime/2.0) * 1000.0 && added[i]) {
          if(!reverse) {
            startTime = timestamp;
            reverseAnim();
            reverse = true;
          }
          else {
            endAnim(i);
            reverse = false
          }
        }
        shownOnce[i] = false;
      }
    }
  }

  const startAnim = (i) => {
    if (i !== undefined) {
      updateProps(zones[i]);
      added[i] = true;
      shownOnce[i] = true;
    }
    updateStartTime();
    app.visible = true;
  }

  const endAnim = (i) => {
    app.visible = false;
    if (i !== undefined) {
      added[i] = false;
    }
  }

  const reverseAnim = () => {
    updateStartTime();
    for(const child of textApp.children) {
      child.material.uniforms.startValue.value = 6.0;
      child.material.uniforms.endValue.value = 0.0;
    }
    let uniforms = eyeblasterApp.children[0].material.uniforms;
    uniforms.startValue.value = 6.0;
    uniforms.endValue.value = 0.0
    uniforms.hBgWidthOffset.value = uniforms.hBgWidth.value*2;
    uniforms.shBgWidthOffset.value = uniforms.shBgWidth.value*2;
  }

  const updateStartTime = () => {
    for(const child of textApp.children) {
      child.material.uniforms.startTime.value = startTime/1000;
    }
    eyeblasterApp.children[0].material.uniforms.startTime.value = startTime/1000;
  }

  const updateProps = (zoneProps) => {
    const {
      heading=globalProps.heading ?? 'HEADING',
      subHeading = globalProps.subHeading ?? 'SUBHEADING',
      text = globalProps.text ?? 'TEXT',
      textColor = globalProps.textColor ?? 0xffffff,
      primaryColor1 = globalProps.primaryColor1 ?? 0x000000,
      primaryColor2 = globalProps.primaryColor2 ?? 0xffffff,
      primaryColor3 = globalProps.primaryColor3 ?? 0xffffff,
      backgroundColor = globalProps.backgroundColor ?? 0x202020,
      arrowColor = globalProps.arrowColor ?? 0xffffff,
      headingBgWidth = globalProps.headingBgWidth ?? 0.35,
      subHeadingBgWidth = globalProps.subHeadingBgWidth ?? 0.28,
      animationTime = globalProps.animationTime ?? 6.0
    } = zoneProps;
    
    textApp.children[1].text = heading;
    textApp.children[2].text = subHeading;
    textApp.children[3].text = text;

    for(const child of textApp.children) {
      let uniforms = child.material.uniforms;
      
      uniforms.color.value = new THREE.Color().setHex(textColor);
      uniforms.animTime.value = animationTime;
      uniforms.startValue.value = 0.0;
      uniforms.endValue.value = 6.0;
    }

    let uniforms = eyeblasterApp.children[0].material.uniforms;

    uniforms.pColor1.value = new THREE.Color().setHex(primaryColor1);
    uniforms.pColor2.value = new THREE.Color().setHex(primaryColor2);
    uniforms.pColor3.value = new THREE.Color().setHex(primaryColor3);
    uniforms.arrowColor.value = new THREE.Color().setHex(arrowColor);
    uniforms.hBgWidth.value = headingBgWidth;
    uniforms.shBgWidth.value = subHeadingBgWidth;
    uniforms.animTime.value = animationTime;
    uniforms.showBg.value = false;
    uniforms.startValue.value = 0.0;
    uniforms.endValue.value = 6.0;
    uniforms.hBgWidthOffset.value = 0.0;
    uniforms.shBgWidthOffset.value = 0.0;

    if(showOnStart) {
      uniforms.bgColor.value = new THREE.Color().setHex(backgroundColor);
      uniforms.showBg.value = showOnStart;
    }
  }

  useFrame(({timestamp, timeDiff}) => {
    _update && _update(timestamp, timeDiff);
  });

  useCleanup(() => {
    for (const subApp of subApps) {
      if (subApp) {
        postSceneOrthographic.remove(subApp);
        subApp.destroy();
      }
    }
    for (const boxHelper of boxHelpers) {
      if (boxHelper) {
        scene.remove(boxHelper);
      }
    }
  });

  return app;
};

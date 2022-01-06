import * as THREE from 'three';
import {preloadFont} from 'troika-three-text'
import metaversefile from "metaversefile";
const { useApp, useScene, usePostOrthographicScene, getNextInstanceId, useCleanup, useFrame, useLocalPlayer, isSceneLoaded } = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, "$1");

let _update = null;

let app = null;
let eyeblasterApp = null;
let textApp = null;
let subApps = [null, null];
let zones = null;
let globalCard = null;
let globalCardIndex = null;
let globalProps = null;

let boxes = [];
let boxHelpers = [];
let shownOnce = [];
let added = [];

let showOnStart = false;
let appsLoaded = false;

export default e => {
  app = useApp();
  const postSceneOrthographic = usePostOrthographicScene();
  const scene = useScene();
  const localPlayer = useLocalPlayer();
  app.name = "title-card";

  let showBoxHelper = app.getComponent("boxHelper");
  
  e.waitUntil((async () => {
    {
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
    }

    {
      let u2 = `https://webaverse.github.io/title-card-text/`;
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
      app.add(textApp);
    }

    {
      let u2 = `https://webaverse.github.io/title-card/eyeblaster.gltj`;
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
      app.add(eyeblasterApp);
    }
    
    appsLoaded = true;
    app.visible = false;
  })());

  {
    zones = app.getComponent("zones") || [];
    globalProps = app.getComponent("globalProps") || {};
    for (let i=0; i<zones.length; i++) {
      const zone = zones[i];
      if(zone.dimensions) {
        let box = new THREE.Box3(new THREE.Vector3().fromArray(zone.dimensions[0]), 
          new THREE.Vector3().fromArray(zone.dimensions[1]));
        boxes.push(box);
        shownOnce.push(false);
        added.push(false);
        boxHelpers.push(null);

        if(showBoxHelper) {
          const boxHelper = new THREE.Box3Helper( box, 0x00ff00 );
          boxHelper.updateMatrixWorld(true);
          scene.add(boxHelper);
          boxHelpers[i] = boxHelper;
        }

      } else {
        showOnStart = true;
        globalCardIndex  = i;
      }
    }
  }

  let startTime = 0.0;
  let addedGlobal = false;
  let reverse = false;
  
  _update = (timestamp, timeDiff) => {
    if(showOnStart && !addedGlobal && appsLoaded) {
      startTime = timestamp;
      globalCard = zones.splice(globalCardIndex, 1)[0];
      updateProps(globalCard);
      startAnim();
      showOnStart = false;
      addedGlobal = true;
    }
    else if(addedGlobal && isSceneLoaded()) {
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
    if(i !== undefined) {
      updateProps(zones[i]);
      added[i] = true;
      shownOnce[i] = true;
    }
    updateStartTime();
    app.visible = true;
  }

  const endAnim = (i) => {
    app.visible = false;
    if(i !== undefined)
      added[i] = false;
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
    uniforms.alphaFlip.value = 1.0;
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
      primaryColorOne = globalProps.primaryColorOne ?? 0x000000,
      primaryColorTwo = globalProps.primaryColorTwo ?? 0xffffff,
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

    uniforms.pColorOne.value = new THREE.Color().setHex(primaryColorOne);
    uniforms.pColorTwo.value = new THREE.Color().setHex(primaryColorTwo);
    uniforms.arrowColor.value = new THREE.Color().setHex(arrowColor);
    uniforms.hBgWidth.value = headingBgWidth;
    uniforms.shBgWidth.value = subHeadingBgWidth;
    uniforms.animTime.value = animationTime;
    uniforms.showBg.value = false;
    uniforms.startValue.value = 0.0;
    uniforms.endValue.value = 6.0;
    uniforms.hBgWidthOffset.value = 0.0;
    uniforms.shBgWidthOffset.value = 0.0;
    uniforms.alphaFlip.value = 0.0;

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
    if(showBoxHelper) {
      for(const boxHelper of boxHelpers) {
        if (boxHelper) {
          scene.remove(boxHelper);
        }
      }
    }
  });

  return app;
};

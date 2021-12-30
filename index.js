import * as THREE from 'three';
import {preloadFont} from 'troika-three-text'
import metaversefile from "metaversefile";
const { useApp, useScene, useOrthographicScene, getNextInstanceId, useCleanup, useFrame, useLocalPlayer, isSceneLoaded } = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, "$1");

let _update = null;

let app = null;
let eyeblasterApp = null;
let textApp = null;
let subApps = [null, null];
let zones = null;
let globalCard = null;
let globalCardIndex = null;

let boxes = [];
let shownOnce = [];
let added = [];
let globalProps = {};

let showOnStart = false;
let appsLoaded = false;

export default e => {
  app = useApp();
  const sceneOrthographic = useOrthographicScene();
  const scene = useScene();
  const localPlayer = useLocalPlayer();
  app.name = "title-card";
  
  e.waitUntil((async () => {
    {
      const promise = new Promise(function(resolve, reject) {
        preloadFont(
          {
            font: './fonts/Plaza Regular.ttf',
            characters: 'abcdefghijklmnopqrstuvwxyz',
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

      textApp = metaversefile.createApp({
        start_url: u2,
      });

      textApp.contentId = u2;
      textApp.instanceId = getNextInstanceId();
      textApp.position.copy(app.position);
      textApp.quaternion.copy(app.quaternion);
      textApp.scale.copy(app.scale);
      textApp.updateMatrixWorld();
      textApp.name = "text";

      subApps[0] = textApp;

      await app.addModule(m);
    }

    {
      let u2 = `https://webaverse.github.io/title-card/eyeblaster.gltj`;
      if (/^https?:/.test(u2)) {
        u2 = "/@proxy/" + u2;
      }

      const m = await metaversefile.import(u2);

      eyeblasterApp = metaversefile.createApp({
        start_url: u2,
      });

      eyeblasterApp.contentId = u2;
      eyeblasterApp.instanceId = getNextInstanceId();
      eyeblasterApp.position.copy(app.position);
      eyeblasterApp.quaternion.copy(app.quaternion);
      eyeblasterApp.scale.copy(app.scale);
      eyeblasterApp.updateMatrixWorld();
      eyeblasterApp.name = "eyeblaster";

      subApps[1] = eyeblasterApp;

      await app.addModule(m);
    }
    
    appsLoaded = true;
    app.visible = false;
  })());

  {
    let showBoxHelper = app.getComponent("boxHelper");
    zones = app.getComponent("zones") || [];
    globalProps = app.getComponent("globalProps");
    for (let i=0; i<zones.length; i++) {
      const zone = zones[i];
      if(zone.dims) {
        let box = new THREE.Box3(new THREE.Vector3().fromArray(zone.dims[0]), 
          new THREE.Vector3().fromArray(zone.dims[1]));
        boxes.push(box);
        shownOnce.push(false);
        added.push(false);
        
        if(showBoxHelper) {
          const helper = new THREE.Box3Helper( box, 0x00ff00 );
          helper.updateMatrixWorld(true);
          scene.add( helper );
        }

      } else {
        showOnStart = true;
        globalCardIndex  = i;
      }
    }
  }

  let startTime;
  let addedGlobal = false;
  
  _update = (timestamp, timeDiff) => {
    if(showOnStart && !addedGlobal && appsLoaded) {
      showOnStart = false;
      addedGlobal = true;
      startTime = timestamp;
      globalCard = zones.splice(globalCardIndex, 1)[0];
      globalCard["animTime"] = 10000;
      updateProps(globalCard);
      startAnim();
    }
    if(addedGlobal && isSceneLoaded()) {
      addedGlobal = false;
      setTimeout(()=>{
        endAnim();
      }, 2000)
    }
    
    for(let i=0; i<boxes.length; i++) { 
      let timeFactor = zones[i].timeFactor || globalProps.timeFactor;
      let animTime = zones[i].animTime || globalProps.animTime;
      if(boxes[i].containsPoint(localPlayer.position)) {
        if(!added[i] && !shownOnce[i]) {
          startTime = timestamp;
          startAnim(i);
        }
        if((((timestamp - startTime)/1000) * timeFactor) % animTime > animTime - 0.1 && added[i]) {
          endAnim(i);
        }
      } else {
        if((((timestamp - startTime)/1000) * timeFactor) % animTime > animTime - 0.1 && added[i]) {
          endAnim(i);
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

  const updateStartTime = () => {
    for(let i in app.children) {
      app.children[i].material.uniforms.startTime.value = startTime/1000;
    }
  }

  const addApp = () => {
    if(!!textApp && !!eyeblasterApp) {
      sceneOrthographic.add(app);
    }
  }

  const removeApp = () => {
    if(!!textApp && !!eyeblasterApp) {
      sceneOrthographic.remove(app);
    }
  }

  const updateProps = (zoneProps) => {
    const {heading, subHeading, text, textColor, pColorOne, pColorTwo, bgColor, arrowColor, hBgWidth, shBgWidth, timeFactor, animTime} = zoneProps;
    
    app.children[1].text = heading || globalProps.heading;
    app.children[2].text = subHeading || globalProps.subHeading;
    app.children[3].text = text || globalProps.text;

    for(let i=0; i< app.children.length - 1; i++) {
      app.children[i].material.uniforms.color.value = new THREE.Color().setHex(textColor || globalProps.textColor);
      app.children[i].material.uniforms.timeFactor.value = timeFactor || globalProps.timeFactor;
      app.children[i].material.uniforms.animTime.value = animTime || globalProps.animTime;
    }

    let uniforms = app.children[app.children.length - 1].material.uniforms;

    uniforms.pColorOne.value = new THREE.Color().setHex(pColorOne || globalProps.pColorOne);
    uniforms.pColorTwo.value = new THREE.Color().setHex(pColorTwo || globalProps.pColorTwo);
    uniforms.arrowColor.value = new THREE.Color().setHex(arrowColor || globalProps.arrowColor);
    uniforms.hBgWidth.value = hBgWidth || globalProps.hBgWidth;
    uniforms.shBgWidth.value = shBgWidth || globalProps.shBgWidth;
    uniforms.timeFactor.value = timeFactor || globalProps.timeFactor;
    uniforms.animTime.value = animTime || globalProps.animTime;
    uniforms.showBg.value = false;

    if(showOnStart) {
      uniforms.bgColor.value = new THREE.Color().setHex(bgColor || globalProps.bgColor);
      uniforms.showBg.value = showOnStart;
    }
  }

  useFrame(({timestamp, timeDiff}) => {
    _update && _update(timestamp, timeDiff);
  });

  useCleanup(() => {
    for (const subApp of subApps) {
      if (subApp) {
        sceneOrthographic.remove(subApp);
        subApp.destroy();
      }
    }
  });

  return app;
};

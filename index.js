import * as THREE from 'three';
// import {preloadFont} from 'troika-three-text'
import metaversefile from 'metaversefile';
const { useApp, useScene, usePostOrthographicScene, getNextInstanceId, useCleanup, useFrame, useLocalPlayer, isSceneLoaded } = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, "$1");

export default e => {
  const app = useApp();
  const postSceneOrthographic = usePostOrthographicScene();
  const scene = useScene();
  const localPlayer = useLocalPlayer();

  app.name = 'title-card';

  const showBoxHelper = app.getComponent('boxHelper');

  let _update = null;

  let eyeblasterApp = null;
  let textApp = null;
  const subApps = [null, null];

  const _parseColor = s => parseInt(s.slice(2), 16);

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
      backgroundColor,
      arrowColor,
      // headingBgWidth,
      // subHeadingBgWidth,
      animationTime,
      showBg,
    }) {
      this.boundingBox = boundingBox;
      this.heading = heading;
      this.subHeading = subHeading;
      this.text = text;
      this.textColor = textColor;
      this.primaryColor1 = primaryColor1;
      this.primaryColor2 = primaryColor2;
      this.primaryColor3 = primaryColor3;
      this.backgroundColor = backgroundColor;
      this.arrowColor = arrowColor;
      // this.headingBgWidth = headingBgWidth;
      // this.subHeadingBgWidth = subHeadingBgWidth;
      this.animationTime = animationTime;
      this.showBg = showBg;

      this.factor = 0;
      this.shownOnce = false;
      this.lastCurrentTimestamp = -Infinity;
    }
    static holdTime = 2 * 1000;
    static factorSpeed = 0.01;
    update(timestamp, timeDiff) {
      const {
        heading = 'HEADING',
        subHeading = 'SUBHEADING',
        text = 'TEXT',
        textColor = '0xffffff',
        primaryColor1 = '0x000000',
        primaryColor2 = '0xffffff',
        primaryColor3 = '0xffffff',
        backgroundColor = '0x202020',
        arrowColor = '0xffffff',
        // headingBgWidth = 0.35,
        // subHeadingBgWidth = 0.28,
        animationTime = 6.0,
        showBg = false,
      } = this;
      
      textApp.children[1].text = heading;
      textApp.children[2].text = subHeading;
      textApp.children[3].text = text;

      const hBlockBounds = textApp.children[1].textRenderInfo.blockBounds;
      const hBgWidth = hBlockBounds[2] - hBlockBounds[0];

      const shBlockBounds = textApp.children[2].textRenderInfo.blockBounds;
      const shBgWidth = shBlockBounds[2] - shBlockBounds[0];

      const timeSinceCurrent = timestamp - this.lastCurrentTimestamp;
      if (timeSinceCurrent < 2500) {
        this.factor += Zone.factorSpeed;
      } else {
        this.factor -= Zone.factorSpeed;
      }
      this.factor = Math.min(Math.max(this.factor, 0), 1);
      if (this.factor > 0) {
        for (const child of textApp.children) {
          let uniforms = child.material.uniforms;
          
          uniforms.color.value.setHex(_parseColor(textColor));
          uniforms.animTime.value = animationTime;
          uniforms.factor.value = this.factor;
        }

        let uniforms = eyeblasterApp.children[0].material.uniforms;

        if (Array.isArray(uniforms.pColor1.value)) {
          uniforms.pColor1.value = new THREE.Color().fromArray(uniforms.pColor1.value);
        }
        if (Array.isArray(uniforms.pColor2.value)) {
          uniforms.pColor2.value = new THREE.Color().fromArray(uniforms.pColor2.value);
        }
        if (Array.isArray(uniforms.pColor3.value)) {
          uniforms.pColor3.value = new THREE.Color().fromArray(uniforms.pColor3.value);
        }
        if (Array.isArray(uniforms.arrowColor.value)) {
          uniforms.arrowColor.value = new THREE.Color().fromArray(uniforms.arrowColor.value);
        }
        uniforms.pColor1.value.setHex(_parseColor(primaryColor1));
        uniforms.pColor2.value.setHex(_parseColor(primaryColor2));
        uniforms.pColor3.value.setHex(_parseColor(primaryColor3));
        uniforms.arrowColor.value.setHex(_parseColor(arrowColor));
        uniforms.hBgWidth.value = hBgWidth;
        uniforms.shBgWidth.value = shBgWidth;
        uniforms.animTime.value = animationTime;
        uniforms.factor.value = this.factor;

        if (showBg) {
          if (Array.isArray(uniforms.bgColor.value)) {
            uniforms.bgColor.value = new THREE.Color().fromArray(uniforms.bgColor.value);
          }
          uniforms.bgColor.value = new THREE.Color().setHex(backgroundColor);
          uniforms.showBg.value = true;
        } else {
          uniforms.showBg.value = false;
        }
        return true;
      } else {
        return false;
      }
    }
  }

  let appsLoaded = false;
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

    const promises = [];
    promises.push((async () => {
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
    })());
    promises.push((async () => {
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
    })());
    await Promise.all(promises);
    
    app.add(eyeblasterApp);
    app.add(textApp);
    
    appsLoaded = true;
    // app.visible = false;
  })());

  const boxHelpers = [];
  const zones = (app.getComponent('zones') ?? []).map(zoneSpec => {
    let {
      heading,
      subHeading,
      text,
      textColor,
      primaryColor1,
      primaryColor2,
      primaryColor3,
      backgroundColor,
      arrowColor,
      // headingBgWidth,
      // subHeadingBgWidth,
      animationTime,
      dimensions,
      showBg,
    } = zoneSpec;
    
    const isGlobal = !dimensions;
    const boundingBox = !isGlobal ? new THREE.Box3(
      new THREE.Vector3().fromArray(dimensions[0]), 
      new THREE.Vector3().fromArray(dimensions[1])
    ) : new THREE.Box3(
      new THREE.Vector3(-Infinity, -Infinity, -Infinity), 
      new THREE.Vector3(Infinity, Infinity, Infinity)
    );
    showBg = showBg ?? (isGlobal ? true : false);
    const zone = new Zone({
      boundingBox,
      heading,
      subHeading,
      text,
      textColor,
      primaryColor1,
      primaryColor2,
      primaryColor3,
      backgroundColor,
      arrowColor,
      // headingBgWidth,
      // subHeadingBgWidth,
      animationTime,
      showBg,
    });
    if (showBoxHelper) {
      const boxHelper = new THREE.Box3Helper(boundingBox, 0x00ff00);
      boxHelper.updateMatrixWorld(true);
      scene.add(boxHelper);
      boxHelpers.push(boxHelper);
    }      
    return zone;
  });
  const globalZone = zones.find(zone => !isFinite(zone.boundingBox.min.x)) || null;
  
  const _getCurrentPlayerZone = () => zones.find(z => {
    if(isFinite(z.boundingBox.min.x) && z.boundingBox.containsPoint(localPlayer.position)) { 
      if(z.shownOnce) return false;
      z.shownOnce = true;
    } else z.shownOnce = false;
    return z.shownOnce;
  }) || null;
  
  let currentZone;
  _update = (timestamp, timeDiff) => {
    if (globalZone && !isSceneLoaded()) {
      currentZone = globalZone;
    } else {
      currentZone = _getCurrentPlayerZone();
    }

    if (currentZone) {
      const now = performance.now();
      currentZone.lastCurrentTimestamp = now;
    }

    if (appsLoaded) {
      const _setVisible = visible => {
        eyeblasterApp.visible = visible;
        for (const child of textApp.children) {
          child.visible = visible;
        }
      };
      _setVisible(false);

      let hadSomeZone = false;
      for (const zone of zones) {
        if (zone.update(timestamp, timeDiff)) {
          hadSomeZone = true;
        }
      }
      if (hadSomeZone) {
        _setVisible(true);
      }
    }

    /* if (showOnStart && !addedGlobal && appsLoaded) {
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
    } */
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

import * as THREE from 'three';
// Adapted from the provided telemetry dashboard's procedural 360-degree model definitions.
export function buildArchiveModel(craft, craftGroup) {
      if (!craftGroup) return;

      const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.78, roughness: 0.28 });
      const silverMat = new THREE.MeshStandardMaterial({ color: 0xdbeafe, metalness: 0.72, roughness: 0.32 });
      const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.65, roughness: 0.45 });
      const solarMat = new THREE.MeshStandardMaterial({ color: 0x0f2952, metalness: 0.45, roughness: 0.25, emissive: 0x061b3a });
      const dishWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.25, roughness: 0.4, side: THREE.DoubleSide });

      if (craft.modelType === 'mer_rover') {
        // Spirit / Opportunity 6-Wheeled Mars Exploration Rover
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.55, 1.1), goldMat);
        body.position.y = -0.15;
        craftGroup.add(body);

        // Delta-shaped Solar Array Deck
        const deckCenter = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 1.4), solarMat);
        deckCenter.position.y = 0.16;
        craftGroup.add(deckCenter);

        const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.05, 1.25), solarMat);
        leftWing.position.set(-1.15, 0.12, 0);
        leftWing.rotation.z = -0.14;
        craftGroup.add(leftWing);

        const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.05, 1.25), solarMat);
        rightWing.position.set(1.15, 0.12, 0);
        rightWing.rotation.z = 0.14;
        craftGroup.add(rightWing);

        // Pancam Mast & Head
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.05, 12), silverMat);
        mast.position.set(0.35, 0.68, 0.32);
        craftGroup.add(mast);

        const camHead = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.2), silverMat);
        camHead.position.set(0.35, 1.22, 0.34);
        craftGroup.add(camHead);

        // 6 Rocker-Bogie Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.18, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        [-0.82, 0.82].forEach((x) => {
          [-0.78, 0, 0.78].forEach((z) => {
            const wheel = new THREE.Mesh(wheelGeo, darkMetalMat);
            wheel.position.set(x, -0.78, z);
            craftGroup.add(wheel);

            const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 8), silverMat);
            strut.position.set(x * 0.85, -0.48, z * 0.85);
            strut.rotation.z = x > 0 ? -0.35 : 0.35;
            craftGroup.add(strut);
          });
        });
      } else if (craft.modelType === 'sojourner') {
        // Compact 6-Wheeled Pathfinder Microrover
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.36, 1.55), goldMat);
        chassis.position.y = -0.2;
        craftGroup.add(chassis);

        const topSolar = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.05, 1.65), solarMat);
        topSolar.position.y = 0.02;
        craftGroup.add(topSolar);

        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65, 8), silverMat);
        antenna.position.set(-0.45, 0.35, -0.55);
        craftGroup.add(antenna);

        const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.16, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        [-0.75, 0.75].forEach((x) => {
          [-0.65, 0, 0.65].forEach((z) => {
            const wheel = new THREE.Mesh(wheelGeo, darkMetalMat);
            wheel.position.set(x, -0.65, z);
            craftGroup.add(wheel);
          });
        });
      } else if (craft.modelType === 'eagle_lander') {
        // Apollo 11 Eagle Descent Stage (Gold Octagonal Base + 4 Landing Legs)
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.85, 8), goldMat);
        base.position.y = -0.15;
        craftGroup.add(base);

        const upperDeck = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 0.35, 8), darkMetalMat);
        upperDeck.position.y = 0.45;
        craftGroup.add(upperDeck);

        const engineBell = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.55, 16, 1, true), darkMetalMat);
        engineBell.position.y = -0.75;
        craftGroup.add(engineBell);

        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2 + Math.PI / 4;
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.35, 8), goldMat);
          leg.position.set(Math.cos(angle) * 1.45, -0.45, Math.sin(angle) * 1.45);
          leg.rotation.z = -Math.cos(angle) * 0.45;
          leg.rotation.x = Math.sin(angle) * 0.45;
          craftGroup.add(leg);

          const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.06, 16), goldMat);
          pad.position.set(Math.cos(angle) * 1.78, -1.05, Math.sin(angle) * 1.78);
          craftGroup.add(pad);
        }
      } else if (craft.modelType === 'apollo_lrv') {
        // Apollo 15 Lunar Roving Vehicle
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 2.1), silverMat);
        frame.position.y = -0.35;
        craftGroup.add(frame);

        [-0.3, 0.3].forEach((x) => {
          const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.38), darkMetalMat);
          seat.position.set(x, -0.1, -0.1);
          craftGroup.add(seat);
        });

        // Umbrella High-Gain Dish Antenna
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 8), silverMat);
        mast.position.set(0.35, 0.15, 0.72);
        craftGroup.add(mast);

        const umbrella = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.22, 16, 1, true), goldMat);
        umbrella.rotation.x = Math.PI;
        umbrella.position.set(0.35, 0.62, 0.72);
        craftGroup.add(umbrella);

        const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.2, 18);
        wheelGeo.rotateZ(Math.PI / 2);
        [-0.72, 0.72].forEach((x) => {
          [-0.78, 0.78].forEach((z) => {
            const wheel = new THREE.Mesh(wheelGeo, darkMetalMat);
            wheel.position.set(x, -0.62, z);
            craftGroup.add(wheel);
          });
        });
      } else if (craft.modelType === 'surveyor3') {
        // Surveyor 3 Tripod Lander + Solar Mast + Soil Sampler Arm
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.75, 6), dishWhiteMat);
        hub.position.y = -0.15;
        craftGroup.add(hub);

        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.35, 10), silverMat);
        mast.position.y = 0.75;
        craftGroup.add(mast);

        const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 0.65), solarMat);
        solarPanel.position.set(0, 1.42, 0);
        solarPanel.rotation.x = 0.35;
        craftGroup.add(solarPanel);

        // Extendable Soil Scoop Arm
        const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.12), silverMat);
        arm.position.set(0.85, -0.25, 0.35);
        arm.rotation.z = -0.35;
        craftGroup.add(arm);

        for (let i = 0; i < 3; i++) {
          const angle = (i * Math.PI * 2) / 3;
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.25, 8), silverMat);
          leg.position.set(Math.cos(angle) * 0.85, -0.55, Math.sin(angle) * 0.85);
          leg.rotation.z = -Math.cos(angle) * 0.55;
          leg.rotation.x = Math.sin(angle) * 0.55;
          craftGroup.add(leg);
        }
      } else if (craft.modelType === 'mars_helicopter') {
        const deck=new THREE.Mesh(new THREE.BoxGeometry(1.3,.12,.48),goldMat);
        deck.position.y=-.10; craftGroup.add(deck);
        for(const x of [-.54,.54]) { const leg=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.9,6),silverMat);leg.position.set(x,-.54,0);craftGroup.add(leg); }
        const mast=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.95,6),silverMat);mast.position.y=.5;craftGroup.add(mast);
        const rotor=new THREE.Mesh(new THREE.BoxGeometry(2.5,.035,.13),darkMetalMat);rotor.position.y=1.0;craftGroup.add(rotor);
        const rotor2=rotor.clone();rotor2.rotation.y=Math.PI/2;rotor2.position.y=.92;craftGroup.add(rotor2);
      } else if (craft.modelType === 'alsep_station') {
        const instrument=new THREE.Mesh(new THREE.BoxGeometry(1.25,.65,.82),silverMat);instrument.position.y=-.3;craftGroup.add(instrument);
        const panel=new THREE.Mesh(new THREE.BoxGeometry(1.8,.06,.8),solarMat);panel.position.set(.8,.2,0);craftGroup.add(panel);
        const pole=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.5,7),silverMat);pole.position.set(-.55,.72,0);craftGroup.add(pole);
        const cap=new THREE.Mesh(new THREE.BoxGeometry(.56,.22,.32),goldMat);cap.position.set(-.55,1.45,0);craftGroup.add(cap);
      } else if (craft.modelType === 'mars_lander') {
        const base=new THREE.Mesh(new THREE.BoxGeometry(1.15,.5,1.05),goldMat);base.position.y=-.12;craftGroup.add(base);
        for(const x of [-1.35,1.35]) {const wing=new THREE.Mesh(new THREE.BoxGeometry(1.2,.05,1.6),solarMat);wing.position.set(x,.05,0);craftGroup.add(wing);}
        const mast=new THREE.Mesh(new THREE.CylinderGeometry(.04,.05,1.0,8),silverMat);mast.position.set(0,.6,0);craftGroup.add(mast);
        const head=new THREE.Mesh(new THREE.BoxGeometry(.45,.3,.3),dishWhiteMat);head.position.y=1.1;craftGroup.add(head);
        for (const a of [0,Math.PI*2/3,Math.PI*4/3]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.1,7),silverMat);leg.position.set(Math.cos(a)*.75,-.6,Math.sin(a)*.75);craftGroup.add(leg);}
      } else {
        // Voyager 1 Interstellar Probe (Matches Reference Image!)
        const bus = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.45, 10), darkMetalMat);
        bus.rotation.z = Math.PI / 2;
        craftGroup.add(bus);

        // Large White High-Gain Parabolic Dish
        const dish = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.45, 32, 1, true), dishWhiteMat);
        dish.rotation.z = Math.PI / 2;
        dish.position.x = -0.45;
        craftGroup.add(dish);

        const feedHorn = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.65, 10), silverMat);
        feedHorn.rotation.z = Math.PI / 2;
        feedHorn.position.x = -0.82;
        craftGroup.add(feedHorn);

        // Science Scan Platform Boom
        const scienceBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.9, 8), goldMat);
        scienceBoom.rotation.z = -Math.PI / 2.4;
        scienceBoom.position.set(0.95, 0.35, 0);
        craftGroup.add(scienceBoom);

        // RTG Power Boom
        const rtgBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.55, 8), darkMetalMat);
        rtgBoom.rotation.z = Math.PI / 3;
        rtgBoom.position.set(0.65, -0.55, 0.35);
        craftGroup.add(rtgBoom);

        // Magnetometer Boom
        const magBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.1, 6), silverMat);
        magBoom.rotation.x = Math.PI / 3;
        magBoom.position.set(0.15, -0.65, -0.75);
        craftGroup.add(magBoom);
      }
    }

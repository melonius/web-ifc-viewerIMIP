/*/// falta:
 	lightNode.position.set( 30, 20, 0 );		///  que no aparece en este main

   setupLights() {
    const light1 = new DirectionalLight(0xffeeff, 0.8);
    light1.position.set(-5, 10, 10);  //                   (rojo, verde (z),  azul )
    this.scene.add(light1);

//*
const light4 = new PointLight(0xffeeff, 0.8);			//CREO QUE NO HA FUNCIONADO
    light1.position.set(0, 2, 0);  //                   (rojo, verde (z),  azul )
    this.scene.add(light4);

const light2 = new DirectionalLight(0xffffff, 0.8);
    light2.position.set(-1, 0.5, -1);
    this.scene.add(light2);
    const ambientLight = new AmbientLight(0xffffee, 0.25);
    this.scene.add(ambientLight);
}


        setupCameras() {
            this.setCameraPositionAndTarget(this.perspectiveCamera);
        }
        setCameraPositionAndTarget(camera) {
            camera.position.z = 12;	///* azul
            camera.position.y = 5;	///* verde  coincide con nuestro z habitual
            camera.position.x = 22;	///* rojo
            camera.lookAt(new Vector3(0, 0, 0));			// al cambiarlo NO HACE NADA
        }
 

        comentar:
                        if (fitToFrame)					///*
                    this.context.fitToFrame();	///*


    		this.castShadow = true;
    		this.receiveShadow = true;



*/

import { CameraProjections, IfcViewerAPI } from 'web-ifc-viewer';
import { createSideMenuButton } from './utils/gui-creator';
import {
  IFCSPACE, IFCOPENINGELEMENT, IFCFURNISHINGELEMENT, IFCWALL, IFCWINDOW, IFCCURTAINWALL, IFCMEMBER, IFCPLATE
} from 'web-ifc';
import {
  MeshBasicMaterial,
  LineBasicMaterial,
  Color,
  Vector2,
  DepthTexture,
  WebGLRenderTarget, Material, BufferGeometry, BufferAttribute, Mesh
} from 'three';
import { ClippingEdges } from 'web-ifc-viewer/dist/components/display/clipping-planes/clipping-edges';
import Stats from 'stats.js/src/Stats';

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(255, 255, 255) });
viewer.axes.setAxes();
// viewer.grid.setGrid();    ///*
// viewer.shadowDropper.darkness = 1.5;

// Set up stats
const stats = new Stats();
stats.showPanel(2);
document.body.append(stats.dom);
stats.dom.style.right = '0px';
stats.dom.style.left = 'auto';
viewer.context.stats = stats;

viewer.context.ifcCamera.cameraControls

const manager = viewer.IFC.loader.ifcManager;

async function getAllWallMeshes() {
 const wallsIDs = manager.getAllItemsOfType(0, IFCWALL, false);
 const meshes = [];
  const customID = 'temp-gltf-subset';

  for(const wallID of wallsIDs) {
   const coordinates = [];
   const expressIDs = [];
   const newIndices = [];

   const alreadySaved = new Map();

   const subset = viewer.IFC.loader.ifcManager.createSubset({
     ids: [wallID],
     modelID,
     removePrevious: true,
     customID
   });

   const positionAttr = subset.geometry.attributes.position;
   const expressIDAttr = subset.geometry.attributes.expressID;

   const newGroups = subset.geometry.groups.filter((group) => group.count !== 0);
   const newMaterials = [];
   const prevMaterials = subset.material;
   let newMaterialIndex = 0;
   newGroups.forEach((group) => {
     newMaterials.push(prevMaterials[group.materialIndex]);
     group.materialIndex = newMaterialIndex++;
   });

   let newIndex = 0;
   for (let i = 0; i < subset.geometry.index.count; i++) {
     const index = subset.geometry.index.array[i];

     if (!alreadySaved.has(index)) {
       coordinates.push(positionAttr.array[3 * index]);
       coordinates.push(positionAttr.array[3 * index + 1]);
       coordinates.push(positionAttr.array[3 * index + 2]);

       expressIDs.push(expressIDAttr.getX(index));
       alreadySaved.set(index, newIndex++);
     }

     const saved = alreadySaved.get(index);
     newIndices.push(saved);
   }

   const geometryToExport = new BufferGeometry();
   const newVerticesAttr = new BufferAttribute(Float32Array.from(coordinates), 3);
   const newExpressIDAttr = new BufferAttribute(Uint32Array.from(expressIDs), 1);

   geometryToExport.setAttribute('position', newVerticesAttr);
   geometryToExport.setAttribute('expressID', newExpressIDAttr);
   geometryToExport.setIndex(newIndices);
   geometryToExport.groups = newGroups;
   geometryToExport.computeVertexNormals();

   const mesh = new Mesh(geometryToExport, newMaterials);
   meshes.push(mesh);
 }

  viewer.IFC.loader.ifcManager.removeSubset(modelID, undefined, customID);
  return meshes;
}



// viewer.IFC.loader.ifcManager.useWebWorkers(true, 'files/IFCWorker.js');
viewer.IFC.setWasmPath('files/');

viewer.IFC.loader.ifcManager.applyWebIfcConfig({
  USE_FAST_BOOLS: true,
  COORDINATE_TO_ORIGIN: false,	///*  lo comenté en primera versión, el original ponía firstModel
});

viewer.context.renderer.postProduction.active = true;

// Setup loader

// const lineMaterial = new LineBasicMaterial({ color: 0x555555 });
// const baseMaterial = new MeshBasicMaterial({ color: 0xffffff, side: 2 });

let first = true;
let model;

// const loadIfc = async (event) => {
async function miload() {

  // tests with glTF
  // const file = event.target.files[0];
  // const url = URL.createObjectURL(file);
  // const result = await viewer.GLTF.exportIfcFileAsGltf({ ifcFileUrl: url });
  //
  // const link = document.createElement('a');
  // link.download = `${file.name}.gltf`;
  // document.body.appendChild(link);
  //
  // for(const levelName in result.gltf) {
  //   const level = result.gltf[levelName];
  //   for(const categoryName in level) {
  //     const category = level[categoryName];
  //     link.href = URL.createObjectURL(category.file);
  //     link.click();
  //   }
  // }
  //
  // link.remove();

  const overlay = document.getElementById('loading-overlay');
  const progressText = document.getElementById('loading-progress');

  overlay.classList.remove('hidden');
  progressText.innerText = `Loading`;

  viewer.IFC.loader.ifcManager.setOnProgress((event) => {
    const percentage = Math.floor((event.loaded * 100) / event.total);
    progressText.innerText = `Loaded ${percentage}%`;
  });

  viewer.IFC.loader.ifcManager.parser.setupOptionalCategories({
    [IFCSPACE]: false,
    [IFCOPENINGELEMENT]: false
  });

  // model = await viewer.IFC.loadIfc(event.target.files[0], false);
  model = await viewer.IFC.loadIfcUrl("models/UPV_V3_11112022.ifc", false);
  // model.material.forEach(mat => mat.side = 2);

  if(first) first = false
  else {
    ClippingEdges.forceStyleUpdate = true;
  }

  // await createFill(model.modelID);
  // viewer.edges.create(`${model.modelID}`, model.modelID, lineMaterial, baseMaterial);

  await viewer.shadowDropper.renderShadow(model.modelID);

  overlay.classList.add('hidden');

};
miload();

const inputElement = document.createElement('input');
inputElement.setAttribute('type', 'file');
inputElement.classList.add('hidden');
// inputElement.addEventListener('change', loadIfc, false);

const handleKeyDown = async (event) => {
  if (event.code === 'Delete') {
    viewer.clipper.deletePlane();
    viewer.dimensions.delete();
  }
  if (event.code === 'Escape') {
    viewer.IFC.selector.unHighlightIfcItems();
  }
  if (event.code === 'KeyC') {
    viewer.context.ifcCamera.toggleProjection();
  }
};

// window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();    ///*
window.onkeydown = handleKeyDown;
window.ondblclick = async () => {

  if (viewer.clipper.active) {
    viewer.clipper.createPlane();
  } else {
    const result = await viewer.IFC.selector.highlightIfcItem(true);
    if (!result) return;
    const { modelID, id } = result;
    const props = await viewer.IFC.getProperties(modelID, id, true, false);
    console.log(props);
  }
};
// loadIfc('./models/UPV_V3_11112022.ifc');
//Setup UI
const loadButton = createSideMenuButton('./resources/folder-icon.svg');
loadButton.addEventListener('click', () => {
  loadButton.blur();
  inputElement.click();
});

const getFileButton = createSideMenuButton('./resources/folder-icon.svg');
getFileButton.addEventListener('click', () => {
  getFileButton.blur();
  inputElement.click();
});

const sectionButton = createSideMenuButton('./resources/section-plane-down.svg');
sectionButton.addEventListener('click', () => {
  sectionButton.blur();
  viewer.clipper.toggle();
});

// const dropBoxButton = createSideMenuButton('./resources/dropbox-icon.svg');
// dropBoxButton.addEventListener('click', () => {
//   dropBoxButton.blur();
//   viewer.dropbox.loadDropboxIfc();
// });

const toCermaButton = createSideMenuButton('./resources/wireframe-cube.svg');
toCermaButton.addEventListener('click', () => {
  toCermaButton.blur();
  alert ("para exportar a CERMA ");
  // viewer.dropbox.loadDropboxIfc();
});


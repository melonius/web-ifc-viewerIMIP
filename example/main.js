import { CameraProjections, IfcViewerAPI } from 'web-ifc-viewer';
import { createSideMenuButton } from './utils/gui-creator';
import {
  IFCSPACE, IFCOPENINGELEMENT, IFCFURNISHINGELEMENT, IFCWALL, IFCWINDOW, IFCCURTAINWALL, IFCMEMBER, IFCPLATE, IFCWALLSTANDARDCASE
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
viewer.grid.setGrid();
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


async function aCerma() {
  let textoaCerma ='';

  const propiedades = [];
  const propiedadesLimpio = [];
  const wallsIDs = await manager.getAllItemsOfType(0, IFCWALLSTANDARDCASE, false);
  // console.log(wallsIDs);
  for (const wallID of wallsIDs) {
    // console.log(viewer.IFC);
    // console.log(wallID);
    const properties = await viewer.IFC.loader.ifcManager.properties.getItemProperties(0, wallID);
    // console.log(properties);

    propiedades[wallID]=properties;
    propiedadesLimpio[wallID]={nombre: properties.ObjectType.value, tag: properties.Tag.value};

    const psetsIDs = await viewer.IFC.loader.ifcManager.properties.getPropertySets(0, wallID);
    for (const psetsID of psetsIDs) {
      // console.log(psetsID);
      const pset = await viewer.IFC.loader.ifcManager.properties.getItemProperties(0, psetsID.expressID);
      // console.log(pset);
      for (const propID of pset.HasProperties) {
        const data = await viewer.IFC.loader.ifcManager.properties.getItemProperties(0, propID.value);
        // console.log(data);
      }
    }
  }
  for (const prop in propiedadesLimpio) {
    if (propiedadesLimpio.hasOwnProperty(prop)) {
      textoaCerma += propiedadesLimpio[prop]['nombre']+' '+propiedadesLimpio[prop].tag+"\n";
      console.log(`${prop}: ${propiedadesLimpio[prop]['nombre']} tag ${propiedadesLimpio[prop].tag}`);
    }
  }

  console.table (propiedades);
  console.table (propiedadesLimpio);

  console.log('textoaCerma:');console.log(textoaCerma);
  console.log('textoaCermaDENTROdeLOAD:');console.log(textoaCerma);
  document.getElementById('downloadLink').setAttribute('href',generateTextFileUrl(textoaCerma));

}


// Setup loader

// const lineMaterial = new LineBasicMaterial({ color: 0x555555 });
// const baseMaterial = new MeshBasicMaterial({ color: 0xffffff, side: 2 });

let first = true;
let model;

const loadIfc = async (event) => {

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

  model = await viewer.IFC.loadIfc(event.target.files[0], false);
  // model.material.forEach(mat => mat.side = 2);

  if(first) first = false
  else {
    ClippingEdges.forceStyleUpdate = true;
  }

  // await createFill(model.modelID);
  // viewer.edges.create(`${model.modelID}`, model.modelID, lineMaterial, baseMaterial);

  await viewer.shadowDropper.renderShadow(model.modelID);

  overlay.classList.add('hidden');
  aCerma();

};

// let textoaCerma ='';
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

  model = await viewer.IFC.loadIfcUrl("models/"+query+".ifc", false);
    
  // model.material.forEach(mat => mat.side = 2);

  if (first) first = false
  else {
    ClippingEdges.forceStyleUpdate = true;
  }

  // await createFill(model.modelID);
  // viewer.edges.create(`${model.modelID}`, model.modelID, lineMaterial, baseMaterial);

  await viewer.shadowDropper.renderShadow(model.modelID);

  overlay.classList.add('hidden');
    
  aCerma();

};

//este es el input llamado por el botón abrir archivo
const inputElement = document.createElement('input');
inputElement.setAttribute('type', 'file');
inputElement.classList.add('hidden');
inputElement.addEventListener('change', loadIfc, false);

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
async function opendir() {
  console.log ("Estoy en opendir");
  var hr = new XMLHttpRequest();
  hr.open("POST", "leedir.php", true);			////MIRAR BIEN LO DE TRUE AL FINAL
  hr.setRequestHeader("Content-type","application/json; charset=utf-8");
  hr.onload = function(e) {
    if (hr.response.lastIndexOf('ERROR', 0) === 0) {
      console.log (hr.response+".");
    } else {
      // console.log (hr.response+".");

      let listaArchivos = JSON.parse(hr.response);
      console.log (listaArchivos);
      // const dialogo = document.createElement('dialog');   
      const divListaarchivos = document.createElement('div');   
      // divListaarchivos.style.display="none";		
      divListaarchivos.style.top="100px";		
      divListaarchivos.style.left="100px";		
      divListaarchivos.style.position="fixed";		
      divListaarchivos.id="divColores";						document.getElementsByTagName('body')[0].appendChild(divListaarchivos);
      


      listaArchivos.forEach((archivo) => {
        const row = document.createElement('div');         divListaarchivos.appendChild(row);
        row.className = 'row';
        // row.onclick = 'parent.open(`index.html?'+archivo[0]+'`)';
        row.setAttribute('onclick', 'parent.open(`index.html?'+archivo[0]+'`)');
        // row.value = 'click to open model';
        row.setAttribute('title', 'click to open model');
          const cell = document.createElement('div');         row.appendChild(cell);
          cell.className = 'cell colIni';
          cell.innerHTML = archivo[0];
          // cell.setAttribute('value', 'click to open model');

          const cell2 = document.createElement('div');         row.appendChild(cell2);
          cell2.className = 'cell textPeque';
          cell2.innerHTML = archivo[1];

          const cell3 = document.createElement('div');         row.appendChild(cell3);
          cell3.className = 'cell textPeque';
          cell3.innerHTML = archivo[2];
      });
      // divListaarchivos.style.visibility = "visible";
      // divListaarchivos.style.display = "block";
    }
  };
  var enviaArray={};
  let pru = "PRU";
  // console.log ( 'tablaActual:',tablaActual,'variable:',variableCompleta, 'onoff:','off', 'servSQL:',servSQL);
  enviaArray["datos"]= {pru:pru};
  hr.send(JSON.stringify(enviaArray));	
}



//Setup UI
const loadButton = createSideMenuButton('./resources/folder-icon.svg');
loadButton.addEventListener('click', () => {
  loadButton.blur();
  inputElement.click();
});

const getFileButton = createSideMenuButton('./resources/folder-icon.svg');
getFileButton.addEventListener('click', () => {
  getFileButton.blur();
  opendir();
  // inputElement.click();
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

let textFileUrl = null;
function generateTextFileUrl(txt) {
  let fileData = new Blob([txt], {type: 'text/plain'});

  // If a file has been previously generated, revoke the existing URL
  if (textFileUrl !== null) {
      window.URL.revokeObjectURL(textFile);
  }

  textFileUrl = window.URL.createObjectURL(fileData);

  // Returns a reference to the global variable holding the URL
  // Again, this is better than generating and returning the URL itself from the function as it will eat memory if the file contents are large or regularly changing
  return textFileUrl;
};

const aElement = document.createElement('a');
aElement.classList.add('basic-button');
const image = document.createElement("img");
image.setAttribute("src", './resources/cerma3.svg');
image.classList.add('icon');
image.style.maxWidth = "90px";
aElement.appendChild(image);

const sideMenu = document.getElementById('side-menu-left');
sideMenu.appendChild(aElement);

aElement.setAttribute('id', 'downloadLink');
aElement.setAttribute('download', 'cerma.txt');
aElement.setAttribute('href', '#');

if (typeof query !== 'undefined') 
miload();

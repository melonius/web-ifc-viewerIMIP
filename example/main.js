import { CameraProjections, IfcViewerAPI } from 'web-ifc-viewer';
import { createSideMenuButton } from './utils/gui-creator';
import {
  IFCSPACE, IFCOPENINGELEMENT, IFCFURNISHINGELEMENT, IFCWALL, IFCWINDOW, IFCCURTAINWALL, IFCMEMBER, IFCPLATE, IFCWALLSTANDARDCASE, IFCROOF, IFCSLAB
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
import { Earcut } from 'three/src/extras/Earcut';

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


let gbxmlData;
let plantillaCerma;

// viewer.IFC.loader.ifcManager.useWebWorkers(true, 'files/IFCWorker.js');
viewer.IFC.setWasmPath('files/');

viewer.IFC.loader.ifcManager.applyWebIfcConfig({
  USE_FAST_BOOLS: true,
  COORDINATE_TO_ORIGIN: false,	///*  lo comenté en primera versión, el original ponía firstModel
});

viewer.context.renderer.postProduction.active = true;


async function aCerma() {

  //////////////////// CHATGPT CODE ///////////////////////////////

  const surfaces = gbxmlData.Campus.Surface;
  const matchingSurfaces = {};
  let textoaCerma ='';

  // Iterate over surfaces and accumulate areas and other properties for each id, azimuth, and tilt
  for (const surf in surfaces) {
    const surface = surfaces[surf];
    const id = surface.constructionIdRef;

    // Calculate the area of the surface from its polygon vertices
    const area = parseFloat(surface.RectangularGeometry.Height) * parseFloat(surface.RectangularGeometry.Width);

    // Extract other properties of interest
    const azimuth = parseFloat(surface.RectangularGeometry.Azimuth);
    const tilt = parseFloat(surface.RectangularGeometry.Tilt);

    if (!(id in matchingSurfaces)) {
      matchingSurfaces[id] = {};
    }
    if (!(azimuth in matchingSurfaces[id])) {
      matchingSurfaces[id][azimuth] = {};
    }
    if (!(tilt in matchingSurfaces[id][azimuth])) {
      matchingSurfaces[id][azimuth][tilt] = {
        'area': 0,
      };
    }

    matchingSurfaces[id][azimuth][tilt].area += area;
  }

  // Iterate over accumulated areas and create objects with U-value, accumulated area, azimuth, and tilt
  const result = [];
  for (const id in matchingSurfaces) {
    for (const azimuth in matchingSurfaces[id]) {
      for (const tilt in matchingSurfaces[id][azimuth]) {
        const area = matchingSurfaces[id][azimuth][tilt].area;
        const uValue = gbxmlData.Construction.find(construction => construction.id === id)['U-value'];
        result.push({
          'id': id,
          'U-value': uValue,
          'area': area,
          'azimuth': parseFloat(azimuth),
          'tilt': parseFloat(tilt),
        });
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////

  // adquisición de plantilla CERMA
  var url = "models/VAlencia_V1.xml";
  // AJAX request
  var xhr = (window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"));
  xhr.onreadystatechange = XHRhandler;
  xhr.open("GET", url, true);
  xhr.send(null);
  // handle response
  function XHRhandler() {
    if (xhr.readyState == 4) {
      plantillaCerma = XML2jsobj(xhr.responseXML.documentElement);
      xhr = null;
      console.log('datos plantilla CERMA');
      console.log(plantillaCerma);
      console.log(result);
      console.log(plantillaCerma.DatosPersonalizados.Cerma.Muros.MurosExt.MuroExt);
      plantillaCerma.DatosPersonalizados.Cerma.Muros.MurosExt.MuroExt.U_Muro_ext_W_m2K.name = result[1]['U-value'];
      plantillaCerma.DatosPersonalizados.Cerma.Muros.MurosExt.MuroExt.Muro_ext_norte_m2.name = result[0]['area'];
      plantillaCerma.DatosPersonalizados.Cerma.Muros.MurosExt.MuroExt.Muro_ext_oeste_m2.name = result[1]['area'];
      plantillaCerma.DatosPersonalizados.Cerma.Muros.MurosExt.MuroExt.Muro_ext_sur_m2.name = result[2]['area'];
      plantillaCerma.DatosPersonalizados.Cerma.Muros.MurosExt.MuroExt.Muro_ext_este_m2.name = result[3]['area'];
      plantillaCerma.DatosPersonalizados.Cerma.Cubiertas.CubiertasIncl.CubiertaIncl.U_Cubierta_incl_W_m2K.name = result[4]['U-value'];
      plantillaCerma.DatosPersonalizados.Cerma.Cubiertas.CubiertasIncl.CubiertaIncl.Cubierta_incl_sur_m2.name = result[4]['area'];
      plantillaCerma.DatosPersonalizados.Cerma.Cubiertas.CubiertasIncl.CubiertaIncl.Cubierta_incl_norte_m2.name = result[5]['area'];
      textoaCerma = jsobj2XML(plantillaCerma, 'DatosEnergeticosDelEdificio');
      downloadXML(textoaCerma, 'new_cerma.xml');
    }
  }

  const propiedades = [];
  const propiedadesLimpio = [];
  const wallsIDs = await manager.getAllItemsOfType(0, IFCWALL, false);

  for (const wallID of wallsIDs) {
    const psetsIDs = await viewer.IFC.loader.ifcManager.properties.getPropertySets(0, wallID);
    let wallData = [];
    for (const psetsID of psetsIDs) {
      const pset = await viewer.IFC.loader.ifcManager.properties.getItemProperties(0, psetsID.expressID);

      if(pset.Name.value == "PSET Wall Material Takeoff")
      {
        if(pset.HasProperties)
        {
          for (const propID of pset.HasProperties) {
            const data = await viewer.IFC.loader.ifcManager.properties.getItemProperties(0, propID.value);
            if(data.Name.value == "Heat Transfer Coefficient (U)")
            {
              wallData.push({nombre: "U", tag: data.NominalValue.value})
            }
            if(data.Name.value == "Area")
            {
              wallData.push({nombre: "Area", tag: data.NominalValue.value})
            }
          }
        }
      }
    }
    propiedades[wallID] = wallData;
    propiedadesLimpio[wallID] = wallData;
    //console.log(wallData);
  }

  const windowsIDs = await manager.getAllItemsOfType(0, IFCWINDOW, false);
  for (const windowID of windowsIDs) {
    const psetsIDs = await viewer.IFC.loader.ifcManager.properties.getPropertySets(0, windowID);
    let windowData = [];
    for (const psetsID of psetsIDs) {
      const pset = await viewer.IFC.loader.ifcManager.properties.getItemProperties(0, psetsID.expressID);         
      if(pset.Name.value == "Pset_WindowCommon" || pset.Name.value == "Cotas")
      {
        if(pset.HasProperties)
        {
          for (const propID of pset.HasProperties) {
            const data = await viewer.IFC.loader.ifcManager.properties.getItemProperties(0, propID.value);
            if(data.Name.value == "ThermalTransmittance")
            {
              windowData.push({nombre: "U", tag: data.NominalValue.value})
            }
            if(data.Name.value == "\\X\\C1rea")
            {
              windowData.push({nombre: "Area", tag: data.NominalValue.value})
            }
            if(data.Name.value == "Altura")
            {
              windowData.push({nombre: "Altura", tag: data.NominalValue.value})
            }
            if(data.Name.value == "Anchura")
            {
              windowData.push({nombre: "Anchura", tag: data.NominalValue.value})
            }
          }
        }
      }
    }
    propiedades[windowID] = windowData;
    propiedadesLimpio[windowID] = windowData;
    //console.log(windowData);
  }

  const roofsIDs = await manager.getAllItemsOfType(0, IFCROOF, false);

  for (const roofID of roofsIDs) {
    const psetsIDs = await viewer.IFC.loader.ifcManager.properties.getPropertySets(0, roofID);
    let roofData = [];
    for (const psetsID of psetsIDs) {
      const pset = await viewer.IFC.loader.ifcManager.properties.getItemProperties(0, psetsID.expressID);

      if(pset.Name.value == "PSET Roof Material Takeoff")
      {
        if(pset.HasProperties)
        {
          for (const propID of pset.HasProperties) {
            const data = await viewer.IFC.loader.ifcManager.properties.getItemProperties(0, propID.value);
            if(data.Name.value == "Heat Transfer Coefficient (U)")
            {
              roofData.push({nombre: "U", tag: data.NominalValue.value})
            }
            if(data.Name.value == "Area")
            {
              roofData.push({nombre: "Area", tag: data.NominalValue.value})
            }
          }
        }
      }
    }
    propiedades[roofID] = roofData;
    propiedadesLimpio[roofID] = roofData;
    //console.log(roofData);
  }

  const slabsIDs = await manager.getAllItemsOfType(0, IFCSLAB, false);

  for (const slabsID of slabsIDs) {
    const psetsIDs = await viewer.IFC.loader.ifcManager.properties.getPropertySets(0, slabsID);
    let slabData = [];
    for (const psetsID of psetsIDs) {
      const pset = await viewer.IFC.loader.ifcManager.properties.getItemProperties(0, psetsID.expressID);

      if(pset.Name.value == "Pset_SlabCommon" || pset.Name.value == "Cotas")
      {
        if(pset.HasProperties)
        {
          for (const propID of pset.HasProperties) {
            const data = await viewer.IFC.loader.ifcManager.properties.getItemProperties(0, propID.value);
            if(data.Name.value == "ThermalTransmittance")
            {
              slabData.push({nombre: "U", tag: data.NominalValue.value})
            }
            if(data.Name.value == '\\X\\C1rea')
            {
              slabData.push({nombre: "Area", tag: data.NominalValue.value})
            }
          }
        }
      }
    }
    propiedades[slabsID] = slabData;
    propiedadesLimpio[slabsID] = slabData;
    //console.log(slabData);
  }

  for(const surf in gbxmlData.Campus.Surface)
  {
    const orient = gbxmlData.Campus.Surface[surf].RectangularGeometry;
    const Wallid = orient.id;
    const az = orient.Azimuth;
    const tl = orient.Tolt;
    const data = gbxmlData.Campus.Surface[surf].PlanarGeometry;
    const coordsList = [];
    for(const pt in data.PolyLoop.CartesianPoint)
    {
      const point = data.PolyLoop.CartesianPoint[pt];
      coordsList.push(point.Coordinate[0]);
      coordsList.push(point.Coordinate[2]);
      coordsList.push(point.Coordinate[1]);
    }
    const triangles = Earcut.triangulate(coordsList, null, 3);
    const scene = viewer.IFC.context.getScene();
    const geometry = new BufferGeometry();
    const vertices = new Float32Array(triangles.length * 3);

    console.log(triangles);

    let id = 0;
    for(const idx in triangles)
    {
      let pt = triangles[idx];
      const point = data.PolyLoop.CartesianPoint[pt];
      vertices[id] = point.Coordinate[0];
      id++;
      vertices[id] = point.Coordinate[2];
      id++;
      vertices[id] = point.Coordinate[1];
      id++;
    }
    geometry.setAttribute( 'position', new BufferAttribute( vertices, 3 ) );
    const material = new MeshBasicMaterial( { color: 0xff0000 } );
    const mesh = new Mesh( geometry, material );
    scene.add(mesh);
  }

  for (const prop in propiedadesLimpio) {
    if (propiedadesLimpio.hasOwnProperty(prop)) {
      // textoaCerma += propiedadesLimpio[prop]['nombre']+' '+propiedadesLimpio[prop].tag+"\n";
      //console.log(`${prop}: ${propiedadesLimpio[prop]['nombre']} tag ${propiedadesLimpio[prop].tag}`);
    }
  }



  // console.table (propiedades);
  // console.table (propiedadesLimpio);

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

  let url = event.target.files[0].name;
  url = "models/" + url.replace(".ifc", ".xml");
  console.log(url);
  // AJAX request
  var xhr = (window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"));
  xhr.onreadystatechange = XHRhandler;
  xhr.open("GET", url, true);
  xhr.send(null);
  // handle response
  function XHRhandler() {
    if (xhr.readyState == 4) {
      gbxmlData = XML2jsobj(xhr.responseXML.documentElement);
      xhr = null;
      console.log('datos gbXml');
      console.log(gbxmlData);
    }
  }

  model = await viewer.IFC.loadIfc(event.target.files[0], false);

  aCerma();

  model.material.forEach(mat => mat.side = 2);
  if (first) first = false
  else {
    ClippingEdges.forceStyleUpdate = true;
  }

  // await createFill(model.modelID);
  // viewer.edges.create(`${model.modelID}`, model.modelID, lineMaterial, baseMaterial);

  await viewer.shadowDropper.renderShadow(model.modelID);

  overlay.classList.add('hidden');

};

 
function XML2jsobj(node) {
  /**
   * XML2jsobj v1.0
   * Converts XML to a JavaScript object
   * so it can be handled like a JSON message
   *
   * By Craig Buckler, @craigbuckler, http://optimalworks.net
   *
   * As featured on SitePoint.com:
   * http://www.sitepoint.com/xml-to-javascript-object/
   *
   * Please use as you wish at your own risk.
   */
	var	data = {};
	// append a value
	function Add(name, value) {
		if (data[name]) {
			if (data[name].constructor != Array) {
				data[name] = [data[name]];
			}
			data[name][data[name].length] = value;
		}
		else {
			data[name] = value;
		}
	};
	// element attributes
	var c, cn;
	for (c = 0; cn = node.attributes[c]; c++) {
		Add(cn.name, cn.value);
	}
	// child elements
	for (c = 0; cn = node.childNodes[c]; c++) {
		if (cn.nodeType == 1) {
			if (cn.childNodes.length == 1 && cn.firstChild.nodeType == 3) {
				// text value
				Add(cn.nodeName, cn.firstChild.nodeValue);
			}
			else {
				// sub-object
				Add(cn.nodeName, XML2jsobj(cn));
			}
		}
	}
	return data;
}

function jsobj2XML(obj, rootElementName, includeDeclaration = true) {
  var xml = '';

  // Add the root element
  if (includeDeclaration) {
    xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
  }
  xml += '<' + rootElementName + '>\n';

  // Convert each property to an XML element
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      var val = obj[prop];

      // If the value is an object, recurse
      if (typeof val === 'object') {
        xml += jsobj2XML(val, prop, false);
      } else {
        xml += '<' + prop + '>' + val + '</' + prop + '>\n';
      }
    }
  }

  // Close the root element
  xml += '</' + rootElementName + '>\n';

  return xml;
}

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


// adquisición de datos desde el fichero ...gb.xml
  var url = "models/" + query + ".xml";
  // AJAX request
  var xhr = (window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"));
  xhr.onreadystatechange = XHRhandler;
  xhr.open("GET", url, true);
  xhr.send(null);
  // handle response
  function XHRhandler() {
    if (xhr.readyState == 4) {
      gbxmlData = XML2jsobj(xhr.responseXML.documentElement);
      xhr = null;
      console.log('datos gbXml');
      console.log(gbxmlData);
    }
  }
  model = await viewer.IFC.loadIfcUrl("models/"+query+".ifc", false);

  model.material.forEach(mat => mat.side = 2);

  aCerma();

  if (first) first = false
  else {
    ClippingEdges.forceStyleUpdate = true;
  }

  // await createFill(model.modelID);
  // viewer.edges.create(`${model.modelID}`, model.modelID, lineMaterial, baseMaterial);

  await viewer.shadowDropper.renderShadow(model.modelID);

  overlay.classList.add('hidden');

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
  hr.addEventListener('load', function(e) {
      if (hr.response.lastIndexOf('ERROR', 0) === 0) {
      console.log (hr.response+".");
    } else {
      // console.log (hr.response+".");

      const listaArchivos = JSON.parse(hr.response);
      console.log (listaArchivos);
      // const dialogo = document.createElement('dialog');   
      const divListaarchivos = document.createElement('div');   
      // divListaarchivos.style.display="none";		
      divListaarchivos.style.top="5%";		
      divListaarchivos.style.left="5%";		
      divListaarchivos.style.position="absolute";		
      divListaarchivos.id="divColores";						document.getElementsByTagName('body')[0].appendChild(divListaarchivos);
      
      //cabecera de tabla
      const row = document.createElement('div');         divListaarchivos.appendChild(row);
      row.className = 'row';

      const createCell = (className, innerHTML) => {
        const cell = document.createElement('div');
        cell.className = `cell ${className}`;
        cell.innerHTML = innerHTML;
        return cell;
      };
      
      row.appendChild(createCell('colIni', 'IFC'));
      row.appendChild(createCell('textPeque', ''));
      row.appendChild(createCell('textPeque', ''));
      row.appendChild(createCell('textPeque', '(gb)XML'));
      row.appendChild(createCell('textPeque', ''));




      listaArchivos.forEach((archivo) => {
        const row = document.createElement('div');         divListaarchivos.appendChild(row);
        row.className = 'row';
        row.setAttribute('onclick', 'parent.open(`index.html?'+archivo[0]+'`)');
        row.setAttribute('title', 'click to open model');
          const cell = document.createElement('div');         row.appendChild(cell);
          cell.className = 'cell colIni';
          cell.innerHTML = archivo[0];

          const cell2 = document.createElement('div');         row.appendChild(cell2);
          cell2.className = 'cell textPeque';
          cell2.innerHTML = archivo[1];

          const cell3 = document.createElement('div');         row.appendChild(cell3);
          cell3.className = 'cell textPeque';
          cell3.innerHTML = archivo[2];

          const cell4 = document.createElement('div');         row.appendChild(cell4);
          cell4.className = 'cell textPeque';
           if (typeof archivo[3] !== 'undefined') {
            cell4.innerHTML = archivo[3];
          } else {
            cell4.innerHTML = "";
          }
  
          const cell5 = document.createElement('div');         row.appendChild(cell5);
          cell5.className = 'cell textPeque';
           if (typeof archivo[4] !== 'undefined') {
            cell5.innerHTML = archivo[4];
          } else {
            cell5.innerHTML = "";
          }

      });
      // divListaarchivos.style.visibility = "visible";
      // divListaarchivos.style.display = "block";
    }
  });
  var enviaArray={};
  let pru = "PRU";
  // console.log ( 'tablaActual:',tablaActual,'variable:',variableCompleta, 'onoff:','off', 'servSQL:',servSQL);
  enviaArray["datos"]= {pru:pru};
  hr.send(JSON.stringify(enviaArray));	
}

function downloadXML(xmlString, filename) {
  // create a blob object
  const blob = new Blob([xmlString], {type: 'text/xml'});

  // create a download link
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;

  // simulate a click on the download link
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
aElement.setAttribute('download', 'cerma.xml');
aElement.setAttribute('href', '#');

if (typeof query !== 'undefined') 
miload();

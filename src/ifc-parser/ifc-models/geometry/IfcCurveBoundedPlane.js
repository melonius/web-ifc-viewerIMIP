import { ifcDataTypes as d } from "../../utils/ifc-data-types.js";
import { ifcClass } from "../../utils/globalProperties.js";
import { getName, ifcTypes as t } from "../../utils/ifc-types.js";

const IfcCurveBoundedPlane = {
  [ifcClass]: getName(t.IfcCurveBoundedPlane),
  BasisSurface: d.id,
  OuterBoundary: d.id,
  InnerBoundaries: d.idSet,
};

export { IfcCurveBoundedPlane };

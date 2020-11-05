import { ifcClass } from "../../utils/globalProperties.js";
import { ifcDataTypes as d } from "../../utils/ifc-data-types.js";
import { getName, ifcTypes as t } from "../../utils/ifc-types.js";

const IfcUnitAssignment = {
  [ifcClass]: getName(t.IfcUnitAssignment),
  Units: d.idSet,
};

export { IfcUnitAssignment };

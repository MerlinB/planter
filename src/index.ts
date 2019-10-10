import TreeHugger from "meta-tree-hugger";
import MetaNode from "./meta-node";
import { Planter } from "./planter";

TreeHugger.db.mapObject = obj => new MetaNode(obj);

export { TreeHugger };
export { Planter };

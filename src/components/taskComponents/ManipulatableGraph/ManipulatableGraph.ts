import type {
  SerializedTaskComponent,
  SerialisedDependencies,
  ComponentDependencies,
  TaskGraphPath,
  ComponentData,
  SerialisedMethod,
  SerialisedMethods,
  MethodImplementation,
  MethodImplementations,
  SerialisedContextMenu,
  NestedComponents
} from "@/components/taskComponents/TaskComponent";
import { TaskComponent } from "@/components/taskComponents/TaskComponent";
import Graph from "@/helpers/GraphTools/Graph";
import { unref } from "vue";

import type { ComputedRef } from "vue";
import type { SerializedDOTGraphComponent } from "@/components/taskComponents/DOTGraph/DOTGraph";
import type { DroppedElements, DropData, DragElements } from "@/components/taskComponents/DragDrop/ItemPallet/ItemPallet";
import type { CSSIDSelector } from "@/components/taskComponents/DragDrop/DragElement/DragElement";
import type { SerializedGraph } from "@/helpers/GraphTools/Graph";

export type ManipulatableGraphComponentType = "ManipulatableGraph";

export type EditableFields = "label" | string;

export interface ManipulatableGraphDropData extends DropData {
  dotTemplate: string;
}

export interface ManipulatableGraphDragElements extends DragElements {
  [dragElement: string]: {
    componentType: string;
    props: { [key: string]: any };
    elementSelector: CSSIDSelector;
    dropData: ManipulatableGraphDropData;
  };
}

export interface SerializedManipulatableGraphDependencies extends SerialisedDependencies {
  dotDescription: TaskGraphPath;
  validationData: TaskGraphPath;
  droppedElements: TaskGraphPath;
  dragElements: TaskGraphPath;
}

export interface ManipulatableGraphDependencies extends ComponentDependencies {
  dotDescription: ComputedRef<string>;
  validationData: ComputedRef<any>;
  droppedElements: ComputedRef<DroppedElements>;
  dragElements: ComputedRef<ManipulatableGraphDragElements>;
}

export interface ManipulatableGraphComponentData extends ComponentData {
  editableFields: Array<string>;
  dotUserGraph: string;
  userGraph: SerializedGraph;
}

export interface ManipulatableGraphMethodImplementations extends MethodImplementations {}
export interface ManipulatableGraphSerialisedMethods extends SerialisedMethods {}

export interface ManipulatedGraphNestedComponents extends NestedComponents {
  DOTGraph: SerializedDOTGraphComponent;
}

export interface SerializedManipulatableGraphComponent
  extends SerializedTaskComponent<
    ManipulatableGraphComponentType,
    SerializedManipulatableGraphDependencies,
    ManipulatableGraphComponentData,
    ManipulatableGraphSerialisedMethods,
    SerialisedContextMenu,
    ManipulatedGraphNestedComponents
  > {}

export class ManipulatableGraphComponent extends TaskComponent<
  SerializedManipulatableGraphComponent,
  SerializedManipulatableGraphDependencies,
  ManipulatableGraphDependencies,
  ManipulatableGraphComponentData,
  ManipulatableGraphSerialisedMethods,
  ManipulatableGraphMethodImplementations,
  ManipulatedGraphNestedComponents
> {
  /**
   * The ManipulatableGraphComponent class is a derived taskComponent,
   * that displays a Graph via the DOTGraph-component.
   */

  public dropHandler() {}

  public getDotAttributes() {
    const test = '${nodeID} [label="" shape="hexagon" fixedSize="false"]';

    const attributeSectionRegExp = /(\[.*\])/g;
    const attributeTupleRegExp = /(\w+="?\w*"?)/g;

    const res = test.match(attributeSectionRegExp);
  }

  public addNode(dotNode: string) {
    const componentData = this.getComponentData();
    const serializedUserGraph = unref(componentData).userGraph;
    const userGraph = new Graph().import(serializedUserGraph);

    // take the highest existing Id and add 1
    const newNodeId = userGraph.nodes().reduce((max, current) => (current > max ? current : max)) + 1;

    dotNode = dotNode.replace(/node\d+/g, `node${newNodeId}`);

    userGraph.addNode(dotNode);
  }

  public validate(): void {}
}

class DOTGraphBuilder {
  constructor() {}
}

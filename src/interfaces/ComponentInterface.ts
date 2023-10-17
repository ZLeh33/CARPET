import type { IStore } from "@/helpers/TaskGraphUtility";

export interface ComponentDependencies {
  [componentName: string]: {
    [dependencyName: string]: string;
  };
}

export interface ComponentProps {
  componentID: number;
  storeObject: IStore;
  dependencies?: ComponentDependencies;
}

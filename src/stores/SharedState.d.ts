export interface State {
    isLoading: boolean;
    previousNode: number | null;
    rootNode: number | null;
    taskMode: string | null;
    currentTask: string | null;
    layoutSize: string;
    taskData: { [key: string]: any };
    topology: Array<Array<number>>;
    edges: IEdges;
    currentNode: number | null;
    nodes: INodes;
    taskReplay: Replay;
    restoredFromReplay?: boolean;
  }
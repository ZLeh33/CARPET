<template>
  <input
    :class="`i__${rowIndex}__${columnIndex}`"
    :data-index="[rowIndex, columnIndex]"
    :readonly="isReadOnly || isFieldReadOnly"
    :disabled="isReadOnly || isFieldReadOnly"
    @keyup="updateField"
    :type="inputType"
    :value="element"
    :min="min"
    :max="max"
  />
</template>

<script lang="ts">
import { computed, watch } from "vue";
export default {
  name: "Scalar",
  props: {
    rowIndex: Number,
    columnIndex: Number,
    isReadOnly: Boolean,
    isFieldReadOnly: Boolean,
    element: Number,
    storeObject: Object,
    componentID: Number,
    inputType: String,
    min: Number,
    max: Number
  },
  setup(props) {
    const { store, getProperty, setProperty } = props.storeObject;
    const currentNode = computed(() => store.state.currentNode);
    const componentPath = `nodes__${currentNode.value}__components__${props.componentID}__component`;
    const taskMode = computed(() => store.state.taskMode);
    const userData = computed(() => loadData(`${componentPath}__userData`));
    const solutionData = computed(() => loadData(`${componentPath}__solutionData`));
    const currentTask = computed(() => getProperty("currentTask"));

    const validationConfig = getProperty(`nodes__${currentNode.value}__components__${props.componentID}__validationConfig`);

    const loadData = (path: string) => {
      const data = getProperty(path);
      if (data) {
        if (data.length > 1) return data;
        return data[0].map((scalar: any) => [scalar]);
      } else return [];
    };

    const updateField = (event: Event) => {
      const element = <HTMLInputElement>event.target;
      const { index } = <{ index: string }>element.dataset;
      const [column, row] = index.split(",");
      let value = element.value === "" ? null : props.inputType === "number" ? parseFloat(element.value) : element.value;
      if (value !== null && props.inputType === "number") {
        value = value.toString();
        if (value.includes(",")) {
          // Ersetze das Komma mit einem Punkt, um es in eine gültige Zahl umzuwandeln
          value = value.replace(",", ".");
        }
        // Versuche nun, den Wert als Zahl zu parsen
        value = parseFloat(value);
      }
      else {
        element.value = element.min;
        value = element.value;
      }
      //Zum Test
      console.log("Test MatrixField: ",value);
      setProperty({ path: `${componentPath}__userData__${column}__${row}`, value });
      checkValidity(event);
    };

    const setVisualCorrectness = (isCorrect: boolean, isSet: boolean, rowIndex: number, columnIndex: number) => {
      const element = document.querySelector(`#matrix_${props.componentID} .i__${rowIndex}__${columnIndex}`);
      if (!element) return;

      // if element is correct, set it to valid
      if (isCorrect) {
        element.classList.remove("invalid");
        element.classList.add("valid");
      }
      // if element is incorrect, but has a value, set to invalid
      else if (isSet) {
        element.classList.remove("valid");
        element.classList.add("invalid");
      }
      // if element is not set remove all classes
      else {
        element.classList.remove("valid");
        element.classList.remove("invalid");
      }
    };

    const validateMatrixField = (rowIndex: number, columnIndex: number) => {
      const userValue = userData.value[rowIndex][columnIndex];
      const solutionValue = solutionData.value[rowIndex][columnIndex];
      const isCorrect = userValue === solutionValue;
      const isSet = userData.value[rowIndex][columnIndex] != null;

      // TODO: make global/constant enum variable in centralised place
      if (taskMode.value === "practice") setVisualCorrectness(isCorrect, isSet, rowIndex, columnIndex);

      setProperty({
        path: `${componentPath}__validationData__${props.rowIndex}__${props.columnIndex}__isCorrect`,
        value: isCorrect
      });
      setProperty({
        path: `${componentPath}__validationData__${props.rowIndex}__${props.columnIndex}__isValid`,
        value: isSet
      });

      return { isCorrect, isSet };
    };

    // TODO!!: delete in proper MatrixField component
    const externalValidation = async () => {
      const rowIndex = <number>props.rowIndex;
      const columnIndex = <number>props.columnIndex;

      const userData = getProperty(`${componentPath}__userData`).value;

      const validationMatrix: Array<Array<boolean | null>> = await store.dispatch("fetchTaskData", {
        endpoint: `${currentTask.value}/${validationConfig.instruction}`,
        payload: { userData, instruction: validationConfig.instruction, type: currentTask.value, task: currentTask.value }
      });

      const isCorrectValue = <boolean>validationMatrix[rowIndex][columnIndex];
      const isCorrect = isCorrectValue;
      const isSet = isCorrectValue !== null ? true : false;

      // TODO: make global/constant enum variable in centralised place
      if (taskMode.value === "practice") setVisualCorrectness(isCorrect, isSet, rowIndex, columnIndex);

      setProperty({
        path: `${componentPath}__validationData`,
        value: validationMatrix
      });
    };

    watch(
      () => props.element,
      async () => {
        if (validationConfig) {
          await externalValidation();
        } else {
          validateMatrixField(<number>props.rowIndex, <number>props.columnIndex);
        }
      }
    );
    const checkValidity = (event: Event) => {
      const element = <HTMLInputElement>event.target;
      const value = element.value ? parseFloat(element.value) : null;
      
      if (value < props.min || value > props.max) {
        element.classList.add('out-of-range');
        element.classList.remove('in-range');
        let value:boolean = false;
        setProperty({ path: `nodes__${currentNode.value}__components__${props.componentID}__isValid`, value }); 
      } else {
        element.classList.remove('out-of-range');
        element.classList.add('in-range');
        let value:boolean = true;
        setProperty({ path: `nodes__${currentNode.value}__components__${props.componentID}__isValid`, value }); 
      }
    };
    
    
    return { updateField , checkValidity };
  }
};
</script>

<style scoped>
.out-of-range {
  border: 7px solid red; /* Ändere die Breite der Linie und den Stil */
}
.in-range {
  border: 7px solid green; /* Ändere die Breite der Linie und den Stil */
}
/************************************End  *******************************/
.scalar {
  width: 30px;
  text-align: center;
  padding: 5px;
}
</style>

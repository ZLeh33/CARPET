<template>
  <ContextMenu :componentId="id" :methods="selectedMethods" :storeObject="storeObject">
    <div class="matrix-wrapper">
        <table :id="`matrix_${id}`" class="matrix">
          <tr v-if="columnLabel && columnLabel.length">
            <p class="placeholder">&nbsp;</p>
            <th v-for="(label, i) in columnLabel" :key="i" @mouseover="handleMouseOver(i)" @mouseleave="handleMouseLeave">
              <p class="matrix_label column_label">{{ label }}</p>
              <span v-show="tooltipVisible && hoveredColumn === i" id="tooltiptext">{{ tooltipMessage }}</span>
            </th>
          </tr>
          <tr v-for="(row, i) in userData" :key="i">
            <th v-if="rowLabel && rowLabel.length">
              <p  v-if="rowAnzahl !== undefined || userDataFromJson !== null" class="matrix_label row_label">{{ rowLabel[0] +" "+(i+1)}}</p>
              <p  v-else class="matrix_label row_label"> {{ rowLabel[i]  }}</p>
            </th>
            <td class="matrix_element" v-for="(element, j) in userData[i]" :key="j">
              <!-- zakaria min max-->
              <MatrixField
                :min="getMinValueForColumn(columnLabel[j])"
                :max="getMaxValueForColumn(columnLabel[j])"
                :rowIndex="i"
                :columnIndex="j"
                :storeObject="storeObject"
                :componentID="id"
                :isReadOnly="isReadOnly"  
                :isFieldReadOnly="checkIsFieldReadOnly(columnLabel[j],i)"
                :element="element"
                :inputType="inputType ?? 'number'"
              />
            </td>
        </tr>
      </table>
    </div>
  </ContextMenu>
</template>

<script lang="ts">
import { onMounted, onBeforeMount, computed, watch, ref, watchEffect } from "vue";
import { Matrix } from "@/helpers/LinearAlgebra";
import MatrixField from "@/components/taskComponents/math/LinearAlgebra/MatrixField.vue";
import type { IMatrixInstruction } from "@/interfaces/componentInterfaces/MatrixInterface";
import ContextMenu from "@/components/taskComponents/mixins/ContextMenu.vue";
import type { IMethodsDefinition } from "@/interfaces/TaskGraphInterface";
import { getSelectedMethods } from "@/helpers/getSelectedMethods";
import { isInteger } from "lodash";
//import DualSlider from "../../form/DualSlider.vue";


import { deepCopy } from "@/helpers/HelperFunctions";

export default {
  props: { componentID: Number, 
            storeObject: Object,
          },
  components: {
    ContextMenu,
    MatrixField
  },
  setup(props) {
    
    const { store, getProperty, setProperty } = props.storeObject;
    const currentNode = computed(() => store.state.currentNode);
    const currentTask = computed(() => getProperty("currentTask"));
    const componentPath = `nodes__${currentNode.value}__components__${props.componentID}__component`;

    const dependencyPaths = getProperty(`nodes__${currentNode.value}__components__${props.componentID}__dependencies`);
    const dependencies = computed(() => {
      return Object.entries(dependencyPaths.Matrix).map(([dependency, dependencyPath]) => getProperty(dependencyPath));
    });
    const isReadOnly = getProperty(`${componentPath}__readOnly`);
    const instructions = getProperty(`${componentPath}__initialize`);
    const inputType = getProperty(`${componentPath}__inputType`);
    const rowLabelPath = getProperty(`${componentPath}__rowLabel`);
    const columnLabelPath = getProperty(`${componentPath}__columnLabel`);

    // TODO set interface in proper component
    /* interface MatrixValidationConfig {
      instruction: string;
      parameters: {
        [key: string]: string; (JSONPath)
      };
      correctOn: ValidityMatrix; (Matrix that contains validity of each field - or null)
      validOn: ValidityMatrix; (Matrix that contains validity of each field - or null)
      apiMethod?: string; Should only allow post
      payLoad?: "Matrix" | "Field";
    }
    interface ValidityMatrix extends Array<Array<boolean | null>>;
    */
    const validationConfig = getProperty(`nodes__${currentNode.value}__components__${props.componentID}__validationConfig`);
    const rowLabel = computed(() => {
      if (rowLabelPath) return getProperty(rowLabelPath);
      else return [];
    });
    const columnLabel = computed(() => {
      if (rowLabelPath) return getProperty(columnLabelPath);
      else return [];
    });

    //muss vor dem Aufruf stehen
    const loadData = (path : string) => {
      const data = getProperty(path);
      if (data) {
        if (data.length > 1) return data;
        if (data.length !=0 )return data[0].map((scalar) => [scalar]);
      } else return [];
    };
    // Funktion, um eine Integer-Attribut zu laden
    const loadIntZahl = (path : string) => {
        const data = getProperty(path);
        return data;
      };
    
    const userData = computed(() => loadData(`${componentPath}__userData`));
    const solutionData = computed(() => loadData(`${componentPath}__solutionData`));
    const validationData = computed(() => loadData(`${componentPath}__validationData`));

    
    const userDataFromJson = ref<Object | null>(null);
    const userDataFromJson_Key  = ref<string | null>(null);
    //const userData = ref<any[]>([]);
    let rowAnzahl = ref<number | undefined>(undefined);
    let standardZeile = undefined;

    const checkIsFieldReadOnly = (column_label: string, index: number): boolean => {
      const check = computed(() => getProperty(`${componentPath}__field_status`));
      if (check.value != null) {
        const data = computed(() => getProperty(getProperty(getProperty(`${componentPath}__field_status`))));
        if (data.value != null) {
          //console.log(data.value);
          for (let key of Object.keys(data.value)) {
            const value = data.value[key];
            if (typeof value === 'object' && value != null && Object.keys(value).length > 0) {
              //console.log(value);
              if (column_label.includes(key)) {
                //console.log(key);
                for (let subKey of Object.keys(value)) {
                  if (subKey.includes(String(index + 1))) {
                    if (value[subKey]['status'] === 'Erfolgreich' || value[subKey]['status'] === true) {
                      console.log(value[subKey]['status']);
                      return true;  // Rückgabe hier wird die Funktion sofort beenden
                    }
                  }
                }
              }
            }
          }
        }
      }
      return false;  // Falls keine Bedingung erfüllt wird, wird false zurückgegeben
    }

    const loadJSONData = async (path: string): Promise<object | null> => {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          console.error('Netzwerkantwort war nicht ok');
          return null;
        }
        const jsonData = await response.json();
        return jsonData;
      } catch (error) {
        console.error('Fehler beim Laden der JSON-Datei:', error);
        return null;
      }
    };
    const transformData = (data: any): Array<any> => {
      let tempArrays: Array<any> = [];

      // Iteriere über die Items im Datenobjekt
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          // Wenn der Wert ein Objekt ist, füge die Werte des Objekts hinzu
          const values = Object.values(value);

          // Bearbeite die Werte des Objekts
          for (let i = 0; i < values.length; i++) {
            const r = values[i];
            if (typeof r === 'number') {
              values[i] = Math.floor(r); // Wandelt Zahlen in Integer um
            } else if (Array.isArray(r)) {
              values[i] = r.map(val => parseFloat(val)); // Wandelt Arrays in Floats um
            }
          }

          tempArrays.push(values); // Füge das Array der temporären Liste hinzu
        } else {
          // Wenn der Wert kein Objekt ist, füge den Wert direkt hinzu
          tempArrays.push([value]);
        }
    }

  // Entferne überflüssige Verschachtelungen
  tempArrays = tempArrays.map(arr => arr.flat());

  // Dynamisch die Anzahl der Zeilen und Spalten ermitteln
  const numRows = tempArrays.length; // Anzahl der Zeilen entspricht der Länge von tempArrays
  const numCols = Math.max(...tempArrays.map(arr => arr.length)); // Anzahl der Spalten entspricht der maximalen Länge der Arrays

  // Ergebnismatrix erstellen
  let result: any[] = [];
  for (let i = 0; i < numRows; i++) {
    let row: any[] = [];
    for (let j = 0; j < numCols; j++) {
      if (tempArrays[i] && tempArrays[i][j] !== undefined) {
        row.push(tempArrays[i][j]);
      } else {
        row.push(null); // Füge Standardwert hinzu, wenn kein Wert vorhanden ist
      }
    }
    result.push(row);
  }

  return result;
};
    const findKey = (obj: Record<string, any>, key: string): any | undefined => {
      // Überprüfen, ob der Schlüssel im aktuellen Objekt vorhanden ist
      if (obj && key in obj) {
        return obj[key]; // Wert zurückgeben, wenn Schlüssel gefunden
      }

      // Rekursiv durch die Werte gehen, wenn sie Objekte oder Arrays sind
      for (let k in obj) {
        const value = obj[k];
        
        // Falls der Wert ein Objekt oder Array ist, rekursiv weiter suchen
        if (value && typeof value === 'object') {
          const result = findKey(value, key);
          if (result !== undefined) {
            return result; // Wert zurückgeben, wenn gefunden
          }
        } else if (value === key) {
          // Falls der Wert selbst dem gesuchten Schlüssel entspricht
          return value;
        }
      }

      // Falls der Schlüssel nicht gefunden wurde
      return undefined;
    };
    
    const builduserData = (jsonData: Record<string, any>, key: string): void => {
      let data : any = findKey(jsonData,key);
      if(data !== undefined){
        data = transformData(data); // Daten transformieren
        setPropertyForUserData(data);
        console.log(data);
        //userData.value = data;
        //setProperty({ path: `${componentPath}__userData`, value: data});
        //console.log(getProperty( `${componentPath}__userData`));
      } else {
        console.error(`Fehler: Schlüssel "${key}" nicht im Objekt gefunden.`);
      }
    };
    const setPropertyForUserData = (data : any) => {
      setProperty({ path: `${componentPath}__userData`, value: data});
    }
    const checkUserdataFromJson = () =>{
      // Annahme: getProperty gibt einen string oder null zurück
      const computedPath = computed(() => getProperty(`${componentPath}__userDataFromJson`));
      if (computedPath.value) {
        userDataFromJson.value = getProperty(computedPath.value); 
        userDataFromJson_Key.value = getProperty(`${componentPath}__userDataFromJson_Key`);
        //const datatmp : Array<any>= await loadJSONData(computedPath.value);
        //rowAnzahl = computed(() => loadIntZahl(getProperty(`${componentPath}__rowAnzahl`)));
        if(userDataFromJson.value && userDataFromJson_Key.value)builduserData(userDataFromJson.value , userDataFromJson_Key.value);
      }
    } 
    
    onMounted(() => {
      checkUserdataFromJson();
    });
    
    // Überprüfen, ob die Property für die Anzahl der Zeilen existiert
    const rowAnzahlCheck = getProperty(`${componentPath}__rowAnzahl`);
    if (rowAnzahlCheck != undefined) {
      // die Anzahl der Zeilen laden
      if(Number.isInteger(rowAnzahlCheck)){
        rowAnzahl.value = rowAnzahlCheck;
      } 
      else {
        rowAnzahl = computed(() => loadIntZahl(getProperty(`${componentPath}__rowAnzahl`)));
      }
      standardZeile = computed(() => loadData(`${componentPath}__standardZeile`));
    }
    
    
    let newData : any = []; // Initialisiere ein neues Array, um die duplizierten Daten zu speichern
    let i : number = 0; // Zähler für die Schleife
    // Überwacht Änderungen an 'rowAnzahl' und aktualisiert 'newData' entsprechend
    watchEffect(() => {

      // Überprüfen, ob 'rowAnzahl' definiert ist
      if (rowAnzahl != undefined && standardZeile != undefined) {
        // Wenn 'rowAnzahl.value' größer oder gleich dem aktuellen Wert von 'i' ist
        if (rowAnzahl.value >= i) {
          // Schleife von 'i' bis 'rowAnzahl.value' 
          for (i; i < rowAnzahl.value; i++) {
            // Füge 'standardSpalte' zu 'newData' hinzu
            newData.push([...standardZeile?.value]);
            console.log(standardZeile);
            }
        } 
        // Wenn 'rowAnzahl.value' kleiner als 'i' aber größer oder gleich 0 ist
        else if (rowAnzahl.value < i && rowAnzahl.value >= 0) {
          // Entferne die überschüssigen Elemente aus 'newData'
          newData.splice(rowAnzahl.value, i - rowAnzahl.value);
          // Setze 'i' auf den neuen Wert von 'rowAnzahl.value'
          i = rowAnzahl.value;
        }

        //setProperty({ path: `${componentPath}__userData`, value: newData });
        setProperty({ path: `${componentPath}__userData`, value: newData});
      }
    });


    // Min- und Max-Werte für jede Spalte  überwachen
    // Erstelle ein computed-Property, das die Daten für die Spaltenbereiche lädt
    const columnRange = computed(() => loadColumnRangeData(`${componentPath}__columnRange`));
    // Funktion zum Laden der Spaltenbereichsdaten
    const loadColumnRangeData = (path) => {
        // Holen Sie sich die Spaltenbereichsdaten
        const columnRangeData = getProperty(path);
        if (columnRangeData) {
            // Mappt die Daten auf ein Array von Objekten mit 'name', 'min' und 'max'
            return columnRangeData.map(item => ({
                name: item.name,
                min: Number(item.min), // Konvertieren Sie min zu einer Zahl
                max: Number(item.max)  // Konvertieren Sie max zu einer Zahl
            }));
        }
        // Gibt ein leeres Array zurück, wenn keine Daten vorhanden sind
        return [];
    };

    // Funktion zum Abrufen des Minimalwerts einer bestimmten Spalte
    const getMinValueForColumn = (columnName: string) => {
      const column = columnRange.value.find(c => c.name === columnName);
      return column ? column.min : null;
    };

    // Funktion zum Abrufen des Maximalwerts einer bestimmten Spalte
    const getMaxValueForColumn = (columnName: string) => {
      const column = columnRange.value.find(c => c.name === columnName);
      return column ? column.max : null;
    };

    // Tooltip-Status und -Nachricht verwalten
    const tooltipVisible = ref(false); // Steuerung, ob der Tooltip sichtbar ist
    const tooltipMessage = ref(''); // Nachricht, die im Tooltip angezeigt wird
    const hoveredColumn = ref(null); // Index der gerade überfahrenen Spalte

    // Funktion zum Handhaben des Mouseover-Ereignisses
    const handleMouseOver = (index: number) => {
      const columnName = columnLabel.value[index]; // Spaltenname basierend auf dem Index abrufen
      const minValue = getMinValueForColumn(columnName); // Minimalwert für die Spalte abrufen
      const maxValue = getMaxValueForColumn(columnName); // Maximalwert für die Spalte abrufen
      tooltipMessage.value = `Min: ${minValue}, Max: ${maxValue}`; // Tooltip-Nachricht setzen
      hoveredColumn.value = index; // Index der überfahrenen Spalte speichern
      tooltipVisible.value = true; // Tooltip sichtbar machen
    };

    // Funktion zum Handhaben des Mouseleave-Ereignisses
    const handleMouseLeave = () => {
      tooltipVisible.value = false; // Tooltip unsichtbar machen
      hoveredColumn.value = null; // Index der überfahrenen Spalte zurücksetzen
    };

    // Die Summe einer Spalte berechnen und überwachen
    // Erstelle ein computed-Property, das die maximalen Summendaten für die Spalten lädt
    const spaltenMaxSumme = computed(() => loadColumnMaxSummeData(`${componentPath}__spaltenMaxSumme`));

    // Funktion zum Laden der maximalen Summendaten für die Spalten
    const loadColumnMaxSummeData = (path) => {
        // Holen Sie sich die Spaltenmaximale Summendaten
        const columnData = getProperty(path);
        if (columnData) {
            // Mappt die Daten auf ein Array von Objekten mit 'spaltenName' und 'maxSumme'
            return columnData.map(item => ({
                spaltenName: item.spaltenName,
                maxSumme: item.maxSumme
            }));
        }
        // Gibt ein leeres Array zurück, wenn keine Daten vorhanden sind
        return [];
    };

    /*const spaltenMaxSummeUeberwachen = () => {
    // Überprüfen, ob 'spaltenMaxSumme' nicht leer ist
    if (spaltenMaxSumme.value.length != 0) {
      const MatrixData =userData.value;

      // Abrufen der maximalen Summendaten für die Spalten
      const spaltenMaxSummeValue = spaltenMaxSumme.value;
      // Iteriere über jede Spalte in spaltenMaxSummeValue
      spaltenMaxSummeValue.forEach(spalte => {
        // Suche den Index des Spaltennamens in columnLabel.value
        const index = columnLabel.value.findIndex(name => name === spalte.spaltenName);

        // Prüfe, ob der Spaltenname gefunden wurde
        if (index !== -1) {
          
          // Berechnen Sie die Summe der Werte in der Spalte
          let sum:number = 0;
          for (let j = 0; j < MatrixData.length; j++) {
            // Zugriff auf den Wert jeder Zeile basierend auf der Spaltenindex
            let value:number = Number(MatrixData[j][index]);
            sum += value;
          }
          //console.log(`Spalte '${spalte.spaltenName}' gefunden an Index ${index}. Maximale Summe: ${spalte.maxSumme}. sum: ${sum}`);
          if(sum > spalte.maxSumme){
            //alert(`Die Summe der Spalte '${spalte.spaltenName}' darf nicht größer als ${spalte.maxSumme}`);
            setProperty({ path: `${componentPath}__checkUserDataValidity`, value: "invalid" });
          }
          else{
            setProperty({ path: `${componentPath}__checkUserDataValidity`, value: "valid" });
          }
        } 
        else {
          console.log(`Spalte '${spalte.spaltenName}' nicht in columnLabel gefunden.`);
        }
      });
    }
  }*/



    
    const initialize = async (instructions: IMatrixInstruction) => {
      Object.entries(instructions).forEach(([name, instructions]) => {
        // TODO: change replay functionality for stepping in task to apply incremental changes behind loading screen
        // fix for presentation; REMOVE AFTERWARDS
        if (name === "user" && getProperty("restoredFromReplay")) {
          return;
        }

        const strip = (v: string) => JSON.parse(JSON.stringify(v));
        const { paths, operations } = instructions;

        let delay = false;
        const matrices = paths.reduce((matrices: { [key: string]: any }, path: string) => {
          let matrix = strip(getProperty(`${path}`));
          // need to wait for components to be computed fully, before initializing depending component
          if (matrix === null) {
            delay = true;
            matrices[path] = new Matrix(...[[]]);
            return matrices;
          }

          if (matrix.length == 1) matrix = matrix[0].map((scalar: number) => [scalar]);

          matrices[path] = new Matrix(...matrix);
          return matrices;
        }, {} as { [key: string]: any });

        if (delay) return;

        // execute operation on matrices
        // if operation is chained, execute on the matrices listed in the paths
        // otherwise execute on "result"
        // result is initialized as the matrix with the first path
        // otherwise result is set by the result of the previous operation
        let resultMatrix = operations.reduce((result: any, operation: string) => {
          const { name: operationName, args } = JSON.parse(JSON.stringify(operation));
          if (args.includes("chain")) {
            let matrix = result;
            for (let j = 1; j < paths.length; j++) {
              const path = paths[j];
              matrix = matrix[operationName](matrices[path]);
            }
            return matrix;
          }

          return result[operationName](...args);
        }, matrices[paths[0]]);

        if (resultMatrix === undefined) {
          resultMatrix = new Matrix(...[[]]);
        }
        console.log('hier'+ resultMatrix);
        setProperty({ path: `${componentPath}__${name}Data`, value: resultMatrix.getRows() });
      });
    };

    onMounted(async () => {
      if ((dependencies.value && !userData.value) || !userData.value.length) {
        initialize(instructions);
      }
      // TODO: replace with call to validateMatrix, once below TODO is solved
      validateMatrixHacked();
    });

    watch(
      dependencies,
      async () => {
        initialize(instructions);
        if (props.componentID == 3) {
          console.log("DEPENDENCY UPDATE", props.componentID, dependencies.value);
        }
      },
      { deep: true }
    );
    const validateMatrix = () => {
      const validity = { isValid: true, isCorrect: true };
      if (isReadOnly) return validity;

      let earlyStop = false;
      for (const column of validationData.value) {
        if (earlyStop) break;
        for (const elementValidity of column) {
          const { isValid, isCorrect } = elementValidity;

          if (isCorrect === false) {
            validity.isCorrect = isCorrect;
          }

          if (isValid === false) {
            validity.isValid = false;
            earlyStop = true;
            break;
          }
        }
      }
      return validity;
    };

    const externalValidation = async () => {
      const validity = { isValid: true, isCorrect: true };
      if (isReadOnly) return validity;

      const validationData = getProperty(`${componentPath}__validationData`).value;

      let earlyStop = false;
      for (let i = 0; i < validationData.length; i++) {
        if (earlyStop) break;
        const validationColumn = validationData[i];
        for (let j = 0; j < validationColumn.length; j++) {
          const isCorrect = validationColumn[j];
          const isSet = validationColumn[j] !== null ? true : false;

          if (isCorrect === false) {
            validity.isCorrect = isCorrect;
          }
          if (isSet === false) {
            validity.isCorrect = false;
            validity.isValid = false;
            earlyStop = true;
            break;
          }
        }
      }

      return validity;
    };

    // TODO: figure out why all validationData isValid-fields are being set to true, even if only one MatrixField is being manipulated
    const validateMatrixHacked = () => {
      const validity = { isValid: true, isCorrect: true };
      if (isReadOnly) return validity;

      let earlyStop = false;
      for (let i = 0; i < solutionData.value.length; i++) {
        if (earlyStop) break;
        const solutionColumn = solutionData.value[i];
        for (let j = 0; j < solutionColumn.length; j++) {
          const userValue = userData.value[i][j];
          const solutionValue = solutionData.value[i][j];
          const isCorrect = userValue === solutionValue;
          const isSet = userData.value[i][j] != null;

          if (isCorrect === false) {
            validity.isCorrect = isCorrect;
          }
          if (isSet === false) {
            validity.isCorrect = false;
            validity.isValid = false;
            earlyStop = true;
            break;
          }
        }
      }
      return validity;
    };

    // TODO: enable again, once above TODO is solved
    // watch(
    //   validationData,
    //   () => {
    //     const { isValid, isCorrect } = validateMatrix();
    //     setProperty({
    //       path: `nodes__${currentNode.value}__components__${props.componentID}__isValid`,
    //       value: isValid
    //     });
    //     setProperty({
    //       path: `nodes__${currentNode.value}__components__${props.componentID}__isCorrect`,
    //       value: isCorrect
    //     });
    //   },
    //   { deep: true }
    // );

    const completeValidate = async () => {
      let { isValid, isCorrect } = { isValid: false, isCorrect: false };
      if (validationConfig) {
        ({ isValid, isCorrect } = await externalValidation());
      } else {
        ({ isValid, isCorrect } = validateMatrixHacked());

        //isValid = spaltenMaxSummeUeberwachen();
      }

      setProperty({
        path: `nodes__${currentNode.value}__components__${props.componentID}__isValid`,
        value: isValid
      });
      setProperty({
        path: `nodes__${currentNode.value}__components__${props.componentID}__isCorrect`,
        value: isCorrect
      });
      //spaltenMaxSummeUeberwachen();
    };

    // TODO: delete, once above TODO is solved
    watch(
      userData,
      async () => {
        await completeValidate();
      },
      { deep: true }
    );

    const methods = {
      fillZeros: () => {
        const solution = JSON.parse(JSON.stringify(getProperty(`${componentPath}__solutionData`)));
        const userData = JSON.parse(JSON.stringify(getProperty(`${componentPath}__userData`)));
        solution.forEach((row, i) =>
          row.map((value, j) => {
            if (value === 0) setProperty({ path: `${componentPath}__userData__${i}__${j}`, value });
            else setProperty({ path: `${componentPath}__userData__${i}__${j}`, value: userData[i][j] });
          })
        );
      },
      showSolution: () => {
        const solution = JSON.parse(JSON.stringify(getProperty(`${componentPath}__solutionData`)));
        solution.forEach((row, i) =>
          row.map((value, j) => {
            setProperty({ path: `${componentPath}__userData__${i}__${j}`, value });
          })
        );
      },
      copyToClipboard: () => {
        const csv = userData.value.map((row) => row.join(";") + ";").join("\n");
        window.navigator.clipboard.writeText(csv);
      }
    };
    const selectedMethods = getSelectedMethods(
      <IMethodsDefinition>getProperty(`nodes__${currentNode.value}__components__${props.componentID}__methods`),
      methods
    );

    return {
      id: props.componentID,
      solutionData,
      userData,
      rowLabel,
      columnLabel,
      isReadOnly,
      selectedMethods: selectedMethods,
      inputType,
      columnRange,
      getMinValueForColumn,
      getMaxValueForColumn,
      tooltipVisible,
      tooltipMessage,
      hoveredColumn,
      handleMouseOver,
      handleMouseLeave,
      rowAnzahl,
      newData,
      spaltenMaxSumme,
      userDataFromJson,
      checkIsFieldReadOnly
    };
  }
};
</script>

<style scoped>
#tooltiptext {
  top: 0%;
  left: 5px;
  width: 20%;
  height: 20%;
  position: absolute;
  background-color: gainsboro;
  color: #333;
  border: 1px solid #ccc;
  padding: 5px;
  border-radius: 4px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}


.matrix-wrapper {
  width: 100%;
  max-height: calc(100% - 30px); /* Höhe der Tabelle kann angepasst werden */
  overflow: auto; /* Scrollbars erscheinen, wenn der Inhalt größer als der Container ist */
  border: 1px solid #ccc;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.matrix {
  width: 100%;
  height: 100%;
  min-height: 55vh;
  border-collapse: collapse;
  table-layout: fixed;
}

.matrix .matrix_element {
  min-height: 100%;
  position: relative;
  border: 2px solid black;
}

.matrix input {
  top: 0px;
  position: absolute;
  width: 100%;
  min-height: 100%;
  font-size: 130%;
  text-align: center;
}

th {
  min-height: 100%;
  border: 2px solid black;
  background: #57636b;
  color: #b1b2b4;
}

.matrix_label {
  font-size: 130%;
  width: 100%;
  text-align: center;
}

.column_label {
  writing-mode: horizontal-tb;
  /*
  writing-mode: vertical-rl;
   text-orientation: upright; */
  /* transform: rotate(180deg); */
  display: flex;
  /* align-items: center; */
}

.row_label {
  min-width: fit-content;
  margin: 0 auto;
}

.valid {
  background: green;
}

.invalid {
  background: red;
}

input[disabled] {
  background: lightgrey;
}
</style>

<template>
    <div class="TextContainer">
        <!-- Überschrift anzeigen, wenn vorhanden -->
        <h1 v-if="heading">{{ heading }}</h1>
        
        <!-- Paragraph anzeigen, wenn vorhanden -->
        <p v-if="paragraph" style="font-size: 2em;"><i>{{ paragraph }}</i></p>
        
        <!-- Parameter-Liste mit Key-Value-Paaren -->
        <ul v-if="parameter && Object.keys(parameter).length > 0">
            <li 
                v-for="(value, key) in parameter" 
                :key="key"
                class="parameter-item"
            >
                {{ key }}   :   {{ value }}
            </li>
        </ul>
        <p v-if="Object.keys(parameter).length == 0" style="font-size: 1em;">{{ parameter }}</p>

        <!-- result anzeigen, wenn vorhanden -->
        <p v-if="result" style="font-size: 2em;"><strong>{{ result }}</strong></p>
    </div>
</template>

<script lang="ts">
import { keys } from 'lodash';
import { defineComponent, computed, watchEffect , ref} from 'vue';

    export default defineComponent({
        props: {
            componentID: Number,    // ID der Komponente
            storeObject: Object     // Store-Objekt zur Datenhaltung
        },
        setup(props) {
            const { store, getProperty } = props.storeObject;   // Extrahiere store und getProperty Methode aus dem Store-Objekt
            const currentNode = computed(() => store.state.currentNode);    // Berechnet den aktuellen Knoten des Zustands
            const componentPath = computed(() => `nodes__${currentNode.value}__components__${props.componentID}__component`);   // Generiert den Pfad zur Komponente basierend auf currentNode und componentID

            const loadData = (path : String): String | null => {
                let data : String | null =   null;
                data = getProperty(path);
                return data;
            };
            const loadJSONData = async (path : String) : Promise<object | undefined> => {
                try{
                    const response = await fetch(path);
                    if(!response.ok){
                        console.log('Netzwerkantwort war nicht ok');
                    }
                    const jsonData = await response.json();
                    return jsonData;
                } catch (error){
                    console.error("Fehler beim Laden der JSON-Datei:", error);
                }
            }
            
            // Asynchrone Funktion zum Laden und Verarbeiten der JSON-Daten
            const buildTask = async (path: string) => {
                try {
                    const data = await loadJSONData(path); // Warten auf die Daten
                    if (data) {
                        const paragraph = Object.values(data)[0];
                        const parameter = Object.values(data)[1];
                        const result  = Object.values(data)[2];
                        return {paragraph ,parameter, result}; // Rückgabe der Aufgabe
                    } else {
                        console.log('Fehler: Das geladene Datenobjekt ist kein Objekt');
                        return null; // Rückgabe von null bei Fehler
                    }
                } catch (error) {
                    console.error('Fehler beim Laden der Daten:', error);
                    return null; // Rückgabe von null bei Fehler
                }
            };

            const heading = computed(() => loadData(`${componentPath.value}__titel`));
            const path = computed(() => loadData(`${componentPath.value}__path`));
            // Reaktive Daten für paragraph und parameter
            const paragraph = ref('');
            const parameter = ref('');
            const result  =   ref('');
            watchEffect(() => {
                // Hier sicherstellen, dass path.value nicht null oder undefined ist
                if (path.value) {
                    buildTask(path.value).then(({ paragraph: p, parameter: par, result: e }) => {
                        if (p && par && e) {
                            // Die Werte werden in den reaktiven Variablen gespeichert
                            paragraph.value = p;
                            parameter.value = par;
                            result.value = e;
                        } else {
                            console.log('Fehler: Es wurden keine gültigen Daten zurückgegeben.');
                        }
                    });
                }
            });

            return {
                heading,
                paragraph,
                parameter,
                result
            };


        }
    });
</script>

<style>
    .TextContainer {
    width: 95%;
    max-height: 100vh; /* Beschränkt die Höhe auf die Ansichtshöhe */
    background-color: lightgray;
    overflow: auto;
    overflow-x: hidden;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem; /* Abstand zwischen den Elementen */
    }

    ul {
        padding: 0;
        list-style-type: circle;
    }

    .parameter-item {
        margin-left: 20px;
        font-size: 1.5em;
        color: #333;
    }

</style>
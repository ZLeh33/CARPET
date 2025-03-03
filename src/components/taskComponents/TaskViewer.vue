<template>
    <div class="TextContainer">
        <!-- Überschrift anzeigen, wenn vorhanden -->
        <h1 v-if="heading">{{ heading }}</h1>
        
        <!-- Paragraph anzeigen, wenn vorhanden -->
        <p v-if="paragraph" style="font-size: 2em;" v-html="paragraph"></p>
        <div v-if="stringArray">
            <p v-for="(item, index) in stringArray" :key="index" style="font-size: 1.5em;">{{ item }}</p>
        </div>
        
    </div>
</template>

<script lang="ts">
import { keys } from 'lodash';
import { setPriority } from 'os';
import { defineComponent, computed, watchEffect , ref} from 'vue';

    export default defineComponent({
        props: {
            componentID: Number,    // ID der Komponente
            storeObject: Object     // Store-Objekt zur Datenhaltung
        },
        setup(props) {
            const { store, getProperty, setProperty } = props.storeObject;   // Extrahiere store und getProperty Methode aus dem Store-Objekt
            const currentNode = computed(() => store.state.currentNode);    // Berechnet den aktuellen Knoten des Zustands
            const componentPath = computed(() => `nodes__${currentNode.value}__components__${props.componentID}__component`);   // Generiert den Pfad zur Komponente basierend auf currentNode und componentID

            const loadData = (path : String): String | null => {
                let data : String | null =   null;
                data = getProperty(path);
                return data;
            };
            
            
            
            const findKey = (obj: Record<string, any>, key: string): any | undefined => {
                // Überprüfen, ob der Schlüssel im aktuellen Objekt vorhanden ist
                if (key in obj) {
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
                    }
                }
                // Falls der Schlüssel nicht gefunden wurde
                return undefined;
            };

            const heading = computed(() => loadData(`${componentPath.value}__titel`));
            const path = computed(() => loadData(`${componentPath.value}__path`));
            
            //console.log(labels);
            // Reaktive Daten für paragraph und parameter
            const paragraph = ref<string | null>('');
            let obj = ref<Object | null>(null);
            let key : string | null;
            //const parameter = ref('');
            //const result  =   ref('');

            let stringArray = ref<string[]>([]); 

            watchEffect(() => {
                // Hier sicherstellen, dass path.value nicht null oder undefined ist
                if (path.value) {
                    obj = getProperty(path.value);
                    key = getProperty(`${componentPath.value}__key`);
                    if(obj && key)paragraph.value = findKey(obj,key);
                }
                else{
                    //paragraph.value =  computed(() => getProperty(getProperty(`${componentPath.value}__feedback`))).value; 
                    //console.log(paragraph.value);

                    // Array leeren, bevor neue Werte hinzugefügt werden
                    stringArray.value = [];
                    for (let i = 1; i <= 4; i++) {
                        let tmp = computed(() => getProperty(getProperty(`${componentPath.value}__feedback${i}`))).value;
                        if (tmp != null) stringArray.value.push(`${tmp}`);
                        if (tmp != null){
                            setProperty({
                                    path: `nodes__${currentNode.value}__components__${props.componentID}__component__1`,
                                    value: false
                            });
                            setProperty({
                                    path: `nodes__${currentNode.value}__components__${props.componentID}__component__3`,
                                    value: false
                            });
                                }

                    }
                    
                    
                }
            });

            return {
                heading,
                paragraph,
                stringArray
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

    .parameter-item {
        margin-left: 20px;
        font-size: 1.5em;
        color: #333;
    }

</style>
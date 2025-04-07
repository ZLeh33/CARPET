<template>
    <div class="TextContainer">
        <!-- Überschrift anzeigen, wenn vorhanden -->
        <h1 v-if="heading">{{ heading }}</h1>
        
        <!-- Paragraph anzeigen, wenn vorhanden -->
        <p v-if="paragraph" style="font-size: 2em;" v-html="paragraph"></p>
        
        <div v-for="(categoryValue, categoryKey) in tmp" :key="categoryKey"  style="position: relative; left: 15%;">
            <strong>{{ categoryKey }}</strong>
            <ul>
                <li v-for="(value1, key1) in categoryValue" :key="key1">
                    <ul v-if="typeof value1 === 'object'">
                        <strong style="position: relative; left: 5%;">{{ key1 }}</strong>:
                        <li v-for="(value, key) in value1" :key="key" style="position: relative; left: 10%;">
                            {{ key }}: {{ value }}
                        </li>
                    </ul>
                    <ul v-else>
                        <li style="position: relative; left: 10%;">
                            {{ key1 }}: {{ value1 }}
                        </li>
                    </ul>
                </li>
            </ul>
            
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
            
            const heading = computed(() => loadData(`${componentPath.value}__titel`));
            
            // path : parameter, in dem eine pfad gespeichert ist. Die Pfad soll als Object geladen
            const path = computed(() => loadData(`${componentPath.value}__path`));
            // Falls Path vorhanden, dann zögehörige Parameter
            let obj = ref<Object | null>(null);
            let key : string | null;
            const paragraph = ref<string | null>('');
            


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

            
            
            
            
            const tmp = computed(() => {
                const feedbackPath = getProperty(`${componentPath.value}__feedback`);
                if (!feedbackPath) return null;
                return getProperty(feedbackPath);
            });
            //console.log(tmp);
            watchEffect(() => {
                // Hier sicherstellen, dass path.value nicht null oder undefined ist
                if (path.value) {
                    obj = getProperty(path.value);
                    key = getProperty(`${componentPath.value}__key`);
                    if(obj && key)paragraph.value = findKey(obj,key);
                }
                
            });

            return {
                heading,
                paragraph,
                tmp
            };


        }
    });
</script>

<style>
    .TextContainer {
    width: 95%;
    
    background-color: lightgray;
    overflow: auto;
    overflow-x: hidden;
    padding: 20px;
    }

    .parameter-item {
        margin-left: 20px;
        font-size: 1.5em;
        color: #333;
    }

</style>
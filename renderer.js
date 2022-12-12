/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */


const {basicSetup} = require("codemirror")
const {EditorView, keymap} = require("@codemirror/view")
const {EditorState} = require("@codemirror/state")

const {python} = require("@codemirror/lang-python")
const {indentWithTab} = require("@codemirror/commands")
const fs = require('fs');

const updated = (newCode) => {
    console.log(newCode);
    fs.writeFileSync('/tmp/test-sync.py', newCode);
}

const editor = new EditorView({
  doc: `import streamlit as st
st.write("Hello world!")`,
  extensions: [
      basicSetup, 
      keymap.of([indentWithTab]),
      python(), 
      EditorView.updateListener.of((viewUpdate) => {
        if (viewUpdate.docChanged) {
            const doc = viewUpdate.state.doc;
            const value = doc.toString();
            updated(value);
        }
    }),
  ],
  parent: document.getElementById('editor'),
});

// Update to initial state
updated(editor.state.doc.toString())

require('electron').ipcRenderer.on('menuItemClick', (event, message) => {
    let contents = "";
    if (message == "Basic") {
        contents = `import streamlit as st
st.title("Hello, world!")
        `
    }
    else if (message == "Plot") {
        contents = `import streamlit as st

st.line_chart({"a": [1,2,3], "b": [2,5,10]})
        `
    }
    else if (message == "Complex") {
        contents = `import streamlit as st

tab1, tab2, tab3 = st.tabs(["These", "Are", "Tabs"])

with tab1:
    st.write("Some stuff")
with tab2:
    st.write("The middle tab!")

with tab3: 
    st.write("Another tab???")

num = st.slider("Select number", 1, 10, 3)

st.write(f"{num}^{num}: ", num**num)
`
    }
    editor.setState(EditorState.create({
        doc: contents,
        extensions: [
            basicSetup, 
            keymap.of([indentWithTab]),
            python(), 
            EditorView.updateListener.of((viewUpdate) => {
                if (viewUpdate.docChanged) {
                    const doc = viewUpdate.state.doc;
                    const value = doc.toString();
                    updated(value);
                }
            }),
        ],
    }))

    updated(contents);
})

const spawn = require("child_process").spawn;
const streamlit = spawn('streamlit',["run", "/tmp/test-sync.py", "--server.port", "8509"]);

console.log(streamlit)

streamlit.stdout.on('data', data => console.log('data : ', data.toString()))
streamlit.on('close', ()=>{
  // Python ends, do stuff
})
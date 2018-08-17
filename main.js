// ALLOWS LINE BREAKS WITH RETURN BUTTON
marked.setOptions({
  breaks: true,
});

// INSERTS target="_blank" INTO HREF TAGS (required for codepen links)
const renderer = new marked.Renderer();
renderer.link = function (href, title, text) {
  return `<a target="_blank" href="${href}">${text}` + '</a>';
}

const markdownToHTML = markdownText => marked(markdownText, { renderer: renderer });

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false,
      readerMode: false,
      markdownText: this.props.defaultText
    }

    this.onTextChanged = this.onTextChanged.bind(this);
    this.onToggleEditMode = this.onToggleEditMode.bind(this);
    this.onToggleReaderMode = this.onToggleReaderMode.bind(this);
    this.onSaveAsHTML = this.onSaveAsHTML.bind(this);
    this.onOpenFromDisk = this.onOpenFromDisk.bind(this);
    this.onEditorScroll = this.onEditorScroll.bind(this);
    this.onPreviewScroll = this.onPreviewScroll.bind(this);
  }

  onToggleEditMode() {
    const newEditModeState = !this.state.editMode;
    const newReaderModeState = newEditModeState ? false : this.state.readerMode;

    this.setState({
      readerMode: newReaderModeState,
      editMode: newEditModeState
    });
  }

  onToggleReaderMode() {
    const newReaderModeState = !this.state.readerMode;
    const newEditModeState = newReaderModeState ? false : this.state.editMode;

    this.setState({
      readerMode: newReaderModeState,
      editMode: newEditModeState
    });
  }

  onSaveAsHTML() {
    const content = markdownToHTML(this.state.markdownText);
    const fileName = "export.html";

    if (navigator.msSaveBlob) { // IE
      navigator.msSaveBlob(new Blob([content], { type: 'text/html;charset=utf-8;' }), fileName);
    } else {
      const a = document.createElement('a');
      a.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(content);
      a.download = fileName;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  onOpenFromDisk() {
    const input = document.body.appendChild(
      document.createElement("input")
    );
    input.setAttribute("type", "file");
    input.setAttribute("accept", ".md, .txt");

    input.addEventListener("change", ({ target }) => {
      if (target.files && target.files[0]) {
        const fileReader = new FileReader();
        fileReader.onload = event => {
          this.setState({
            markdownText: event.target.result
          });
          document.body.removeChild(input);
        }
        fileReader.readAsText(target.files[0]);
      }
    });
    input.click();
  }

  onTextChanged({ target }) {
    this.setState({
      markdownText: target.value
    });
  }

  componentDidMount() {
    const root = ReactDOM.findDOMNode(this);
    this.previewElm = root.querySelector('#preview');
    this.editorElm = root.querySelector('#editor');

    if (this.previewElm) this.previewElm.addEventListener('scroll', this.onPreviewScroll);
    if (this.editorElm) this.editorElm.addEventListener('scroll', this.onEditorScroll);
  }

  onPreviewScroll() {
    this.editorElm.removeEventListener("scroll", this.onEditorScroll);
    this.editorElm.scrollTop = this.previewElm.scrollTop;

    window.clearTimeout(this.isPreviewScrolling);
    this.isPreviewScrolling = setTimeout(() => {
      this.editorElm.addEventListener("scroll", this.onEditorScroll);
    }, 66);
  }

  onEditorScroll() {
    this.previewElm.removeEventListener("scroll", this.onPreviewScroll);
    this.previewElm.scrollTop = this.editorElm.scrollTop;

    window.clearTimeout(this.isEditorScrolling);
    this.isEditorScrolling = setTimeout(() => {
      this.previewElm.addEventListener("scroll", this.onPreviewScroll);
    }, 66);
  }

  render() {
    return (
      <div>
        <NavBar
          editMode={this.state.editMode}
          readerMode={this.state.readerMode}
          onToggleEditMode={this.onToggleEditMode}
          onToggleReaderMode={this.onToggleReaderMode}
          onSaveAsHTML={this.onSaveAsHTML}
          onOpenFromDisk={this.onOpenFromDisk}
        />
        <Workspace
          markdownText={this.state.markdownText}
          readerMode={this.state.readerMode}
          editMode={this.state.editMode}
          onTextChanged={this.onTextChanged}
        />
      </div>
    )
  }
}

class NavBar extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const editModeClassName = "fas fa-pencil-alt navbar-wrapper-icon" + (this.props.editMode ? " choosen" : "");
    const readerModeClassName = "fas fa-eye navbar-wrapper-icon" + (this.props.readerMode ? " choosen" : "");
    const saveAsHTMLClassName = "fas fa-download navbar-wrapper-icon";
    const openFromDiskClassName = "fas fa-upload navbar-wrapper-icon";

    return (
      <nav className="navbar">
        <div className="navbar-wrapper">
          <h1 className="navbar-wrapper-name">
            <a href="#">Markdown Previewer</a>
          </h1>
        </div>
        <div className="navbar-wrapper">
          <i className={editModeClassName} onClick={this.props.onToggleEditMode} title="Edit mode"></i>
          <i className={readerModeClassName} onClick={this.props.onToggleReaderMode} title="Reader mode"></i>
          <i className={saveAsHTMLClassName} onClick={this.props.onSaveAsHTML} title="Save as HTML"></i>
          <i className={openFromDiskClassName} onClick={this.props.onOpenFromDisk} title="Open from Disk"></i>
        </div>
      </nav>
    )
  }
}

class Workspace extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="workspace">
        <Editor
          markdownText={this.props.markdownText}
          onTextChanged={this.props.onTextChanged}
          editMode={this.props.editMode}
          readerMode={this.props.readerMode}
        />
        <Previewer
          markdownText={this.props.markdownText}
          readerMode={this.props.readerMode}
          editMode={this.props.editMode}
        />
      </div>
    )
  }
}

class Editor extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const editorClassName = "editor " + (this.props.editMode ? "center" : this.props.readerMode ? "hide" : "");

    return (
      <div className={editorClassName}>
        <textarea id="editor" className="editor-textarea"
          onChange={this.props.onTextChanged}
          value={this.props.markdownText}>
        </textarea>
      </div>
    )
  }
}

class Previewer extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const previewerClassName = "previewer " + (this.props.readerMode ? "center" : this.props.editMode ? "hide" : "");
    const htmlContent = markdownToHTML(this.props.markdownText);

    return (
      <div className={previewerClassName}>
        <div id="preview"
          className="previewer-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}>
        </div>
      </div>
    )
  }
}

const defaultText =
  `# Welcome to my React Markdown Previewer!

## This is a sub-heading...
### And here's some other cool stuff:
  
Heres some code, \`<div></div>\`, between 2 backticks.

\`\`\`
// this is multi-line code:

function anotherExample(firstLine, lastLine) {
  if (firstLine == '\`\`\`' && lastLine == '\`\`\`') {
    return multiLineCode;
  }
}
\`\`\`
  
You can also make text **bold**... whoa!
Or _italic_.
Or... wait for it... **_both!_**
And feel free to go crazy ~~crossing stuff out~~.

There's also [links](https://www.freecodecamp.com), and
> Block Quotes!

And if you want to get really crazy, even tables:

Wild Header | Crazy Header | Another Header?
------------ | ------------- | ------------- 
Your content can | be here, and it | can be here....
And here. | Okay. | I think we get it.

- And of course there are lists.
  - Some are bulleted.
     - With different indentation levels.
        - That look like this.


1. And there are numbererd lists too.
1. Use just 1s if you want! 
1. But the list goes on...
- Even if you use dashes or asterisks.
* And last but not least, let's not forget embedded images:

![React Logo w/ Text](https://goo.gl/Umyytc)
`

const rootNode = document.querySelector("#app");
ReactDOM.render(<App defaultText={defaultText} />, rootNode);
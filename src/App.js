import React, { useState, useEffect } from 'react';
/*import './App.css';*/
import 'antd/dist/antd.css';
import { API, Storage } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';
import { Button, Input, message, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const props = {
  name: 'file',
  action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
  headers: {
    authorization: 'authorization-text',
  },
  onChange(info) {
    if (info.file.status !== 'uploading') {
      console.log(info.file, info.fileList);
    }
    if (info.file.status === 'done') {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  },
};

const initialFormState = { name: '', description: '' }

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
  const apiData = await API.graphql({ query: listNotes });
  const notesFromAPI = apiData.data.listNotes.items;
  await Promise.all(notesFromAPI.map(async note => {
    if (note.image) {
      const image = await Storage.get(note.image);
      note.image = image;
    }
    return note;
  }))
  setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
  if (!formData.name || !formData.description) return;
  await API.graphql({ query: createNoteMutation, variables: { input: formData } });
  if (formData.image) {
    const image = await Storage.get(formData.image);
    formData.image = image;
  }
  setNotes([ ...notes, formData ]);
  setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }

  async function onChange(e) {
  if (!e.target.files[0]) return
  const file = e.target.files[0];
  setFormData({ ...formData, image: file.name });
  await Storage.put(file.name, file);
  fetchNotes();
  }

  return (
    <div className="App">
      <h1>My Notes App</h1>
      <Input
        placeholder ="Note Name"
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        value={formData.name}
      />
      <Input
        placeholder ="Note Description"
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        value={formData.description}
      />
      <Upload {...props}>
        <Button icon={<UploadOutlined />}>Click to Upload</Button>
      </Upload>
      <Button onClick={createNote}>Create Note</Button>
      <p></p>
      <p></p>
      <table style={{marginBottom: 30}}>
        {
          notes.map(note => (
            <tr>
              <th>{note.id}</th>
              <th>{note.name}</th>
              <th>{note.description}</th>
              {
                  <th><img src={note.image} alt="Room for more..." style={{width: 200}} /></th>
              }
              <th><Button onClick={() => deleteNote(note)}>Delete note</Button></th>
            </tr>
          ))
        }
      </table>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);
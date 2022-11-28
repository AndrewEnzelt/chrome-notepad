import React, { useEffect, useMemo, useState } from "react";
import "./App.scss";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import { Button, Chip, Divider, TextField, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import Accordion from "@mui/material/Accordion";
import DeleteIcon from "@mui/icons-material/Delete";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useForm, Controller } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";

interface Note {
  id: string | number;
  title: string;
  description: string;
}
interface IFormInput {
  title: string;
  description: string;
}

const schema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow("").optional()
});

function App () {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    chrome.storage?.sync.get(["notes"], (items) => {
      if (items.notes && notes.length === 0) {
        setNotes(JSON.parse(items.notes));
      }
    });
  }, []);

  const [filter, setFilter] = useState("");
  const notesFiltered = useMemo(() => {
    return notes.filter(note => note.title.includes(filter) || note.description.includes(filter));
  }, [filter, JSON.stringify(notes)]);

  const getNoteById = (id: string | number) => {
    return notes.find((note) => note.id === id);
  };

  const deleteNoteById = (id: string | number) => {
    const newNotes = notes.filter(note => note.id !== id);
    setNotes(newNotes);
  };

  const addNote = async (data: IFormInput) => {
    notes.push({
      id: notes.length + 1,
      title: data.title,
      description: data.description
    });
    chrome.storage?.sync.set({ notes: JSON.stringify(notes) });
  };

  const updateNote = async (data: IFormInput) => {
    notes.forEach((note) => {
      if (note.id === editNoteId) {
        note.title = data.title;
        note.description = data.description;
      }
    });
    chrome.storage?.sync.set({ notes: JSON.stringify(notes) });
  };

  const resetDefault = () => {
    reset();
    setEditNoteId(null);
    setCreateModalOpen(false);
  };

  const onSubmit = async (data: IFormInput) => {
    if (editNoteId) {
      updateNote(data);
    } else {
      addNote(data);
    }
    resetDefault();
  };

  const { control, handleSubmit, setValue, reset } = useForm<IFormInput>({
    resolver: joiResolver(schema)
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [editNoteId, setEditNoteId] = useState<number | string | null>(null);

  const createUpdateModal = () => {
    if (editNoteId) {
      const note = getNoteById(editNoteId);
      if (!note) return null;
      setValue("title", note.title);
      setValue("description", note.description);
    }
    return (
      <div className="notepad-control-panel-create-modal">
        <Divider><Chip label={ (!editNoteId ? "CREATE" : "UPDATE") + " NOTE" }/></Divider>
        <form className="notepad-control-panel-create-modal-form" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="title"
            control={control}
            defaultValue=""
            render={({ field }) => <TextField size="small" required label="Title" {...field}/>}
          />
          <Controller
            name="description"
            control={control}
            defaultValue=""
            render={({ field }) => <TextField size="small" multiline rows={4} label="Description" {...field}/>}
          />
          <Button className="notepad-control-panel-create-modal-form-button" variant="outlined" endIcon={<SaveIcon className="notepad-control-panel-create-modal-form-button-save-icon"/>} type="submit">{!editNoteId ? "CREATE" : "UPDATE"}</Button>
        </form>
      </div>
    );
  };

  const expandedNotesIds: Record<string | number, boolean> = {};

  const handleExpandedNotesChange = (id: number | string) => {
    if (expandedNotesIds[id]) {
      delete expandedNotesIds[id];
    } else {
      expandedNotesIds[id] = true;
    }
  };

  const notesList = () => {
    return (
      <div className="notepad-list">
        {notesFiltered.map(note => {
          return (
            <div key={note.id} className="notepad-list-item">
              <Accordion square={false} className="notepad-list-item-accordion" draggable expanded={expandedNotesIds[note.id]} onChange={ () => handleExpandedNotesChange(note.id)}>
                <AccordionSummary
                  className="notepad-list-item-accordion-summary"
                  expandIcon={<ExpandMoreIcon className="notepad-list-item-accordion-summary-expand-icon"/>}
                  aria-controls="panel1bh-content"
                  id="panel1bh-header"
                >
                  <Typography sx={{ width: "33%", flexShrink: 0 }}>
                    {note.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails className="notepad-list-item-accordion-details">
                  <Typography >
                    {note.description}
                  </Typography>
                </AccordionDetails>
              </Accordion>
              <div className="notepad-list-item-buttons" >
                <IconButton color="primary" aria-label="upload picture" component="label"
                  onClick={() => {
                    if (note.id !== editNoteId) { setCreateModalOpen(true); setEditNoteId(note.id); } else {
                      resetDefault();
                    }
                  }}>
                  { note.id !== editNoteId ? <EditIcon className="notepad-list-item-buttons-edit-icon" /> : <CloseIcon className="notepad-list-item-buttons-edit-icon"/>}
                </IconButton>
                <IconButton color="primary" aria-label="upload picture" component="label" onClick={() => { if (confirm("Delete note?")) { deleteNoteById(note.id); } }}>
                  <DeleteIcon className="notepad-list-item-buttons-delete-icon"/>
                </IconButton>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="notepad">
      <Divider textAlign="left"><Chip className="notepad-header-chip" label="NOTEPAD"/></Divider>
      <div className="notepad-control-panel">
        <div className="notepad-control-panel-top">
          <TextField size="small" id="outlined-search" label="Search..." type="search" className="notepad-control-panel-top-search" onChange={(e) => { setFilter(e.target.value); }}/>
          { !createModalOpen
            ? <IconButton color="primary" aria-label="upload picture" component="label" onClick={() => setCreateModalOpen(true)}>
              <AddIcon className="notepad-control-panel-top-add-open" fontSize="large" />
            </IconButton>
            : <IconButton color="primary" aria-label="upload picture" component="label" onClick={() => { reset(); setEditNoteId(null); setCreateModalOpen(false); }}>
              <RemoveIcon className="notepad-control-panel-top-add-close" fontSize="large" />
            </IconButton>
          }
        </div>
        { createModalOpen ? createUpdateModal() : null}
        <Divider />
      </div>
      { notesList() }
    </div>
  );
}

export default App;
